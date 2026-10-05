'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LayersControl, MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { Botao } from '@/componentes/Botao';
import { buscarMalhaMunicipio, type MalhaMunicipio } from '@/lib/municipios';
import { procurarComunidade, type LugarEncontrado, type Limites } from '@/lib/nominatim';
import estilos from './MiniMapa.module.css';

export interface Ponto {
  latitude: number;
  longitude: number;
}

interface Props {
  /** Código IBGE do município escolhido; enquadra o mapa no contorno dele. */
  codigoIbge: string | null;
  /** Nome e UF do município, para "Procurar no mapa". */
  municipioNome: string | null;
  uf: string;
  nomeComunidade: string;
  /** Ponto já marcado (ou digitado nos campos). `null` = falta marcar. */
  ponto: Ponto | null;
  aoMarcar: (ponto: Ponto) => void;
}

/* Vista inicial antes de escolher o município: o Sertão do Moxotó. É só onde
   a câmera começa; nunca vira coordenada. */
const CENTRO_INICIAL: L.LatLngTuple = [-8.35, -37.4];
const ZOOM_INICIAL = 8;
const ZOOM_SUGESTAO = 15;

const ATRIBUICAO_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
/* Esri World Imagery: uso não comercial com atribuição a Esri e às fontes.
   Ver https://www.esri.com/en-us/legal/terms/full-master-agreement e as regras
   de atribuição em https://developers.arcgis.com/documentation/esri-and-data-attribution/ */
const ATRIBUICAO_ESRI = 'Powered by <a href="https://www.esri.com">Esri</a> | '
  + 'Imagens: Esri, Maxar, Earthstar Geographics e GIS User Community';

const pino = L.divIcon({ className: estilos.pino, iconSize: [28, 28], iconAnchor: [14, 28] });
const pinoSugestao = L.divIcon({ className: estilos.pinoSugestao, iconSize: [28, 28], iconAnchor: [14, 28] });

/** Seis casas decimais: uns 10 cm, mais do que o clique consegue acertar. */
const arredondar = (valor: number) => Math.round(valor * 1e6) / 1e6;

function paraPonto(latlng: L.LatLng): Ponto {
  const { lat, lng } = latlng.wrap();
  return { latitude: arredondar(lat), longitude: arredondar(lng) };
}

/** Desenha o contorno do município e enquadra o mapa nele. */
function Contorno({ malha }: { malha: MalhaMunicipio }) {
  const mapa = useMap();
  useEffect(() => {
    // Sem cor aqui: o SVG recebe a classe e o CSS pinta com os tokens.
    // `interactive: false` deixa o clique passar para o mapa.
    const camada = L.geoJSON(malha as Parameters<typeof L.geoJSON>[0], {
      style: { className: estilos.contorno },
      interactive: false,
    }).addTo(mapa);
    mapa.fitBounds(camada.getBounds(), { padding: [12, 12] });
    return () => { camada.remove(); };
  }, [mapa, malha]);
  return null;
}

function Cliques({ aoMarcar }: { aoMarcar: (ponto: Ponto) => void }) {
  useMapEvents({ click: (e) => aoMarcar(paraPonto(e.latlng)) });
  return null;
}

/** Ponto digitado fora da vista: o mapa vai até ele (sem mudar o zoom). */
function Acompanhar({ latitude, longitude }: Ponto) {
  const mapa = useMap();
  useEffect(() => {
    if (!mapa.getBounds().contains([latitude, longitude])) mapa.panTo([latitude, longitude]);
  }, [mapa, latitude, longitude]);
  return null;
}

function IrPara({ latitude, longitude }: Ponto) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView([latitude, longitude], Math.max(mapa.getZoom(), ZOOM_SUGESTAO));
  }, [mapa, latitude, longitude]);
  return null;
}

type EstadoBusca = 'ocioso' | 'procurando' | 'nao-encontrado' | 'erro';

/**
 * Mini-mapa para marcar onde fica a comunidade (ADR-0005: um ponto por
 * comunidade, nunca por família). Escolher o município enquadra o contorno
 * dele (malha do IBGE); clicar põe o pino; arrastar corrige. "Procurar no
 * mapa" pede ao Nominatim uma sugestão pelo nome, que só vira coordenada
 * quando a usuária confirma.
 *
 * O mapa é ajuda, não requisito: se o IBGE, os tiles ou o Nominatim falharem,
 * os campos de latitude/longitude da tela continuam valendo. E o centro do
 * município nunca é usado como coordenada: campo vazio quer dizer "falta
 * marcar", e um chute ali seria indistinguível de um ponto real.
 *
 * Leaflet usa `window`: carregue com `next/dynamic` e `ssr: false`.
 */
export default function MiniMapa({ codigoIbge, municipioNome, uf, nomeComunidade, ponto, aoMarcar }: Props) {
  const idInstrucao = useId();
  const [malha, setMalha] = useState<MalhaMunicipio | null>(null);
  const [semContorno, setSemContorno] = useState(false);
  const [semImagem, setSemImagem] = useState(false);
  const [busca, setBusca] = useState<EstadoBusca>('ocioso');
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<LugarEncontrado | null>(null);
  const controleBusca = useRef<AbortController | null>(null);

  useEffect(() => {
    setMalha(null);
    setSemContorno(false);
    if (!codigoIbge) return;
    const controle = new AbortController();
    buscarMalhaMunicipio(codigoIbge, controle.signal)
      .then(setMalha)
      .catch((e) => { if (!(e instanceof DOMException && e.name === 'AbortError')) setSemContorno(true); });
    return () => controle.abort();
  }, [codigoIbge]);

  // Trocar o nome ou o município invalida a sugestão e o "não encontrado".
  useEffect(() => {
    controleBusca.current?.abort();
    setSugestao(null);
    setBusca('ocioso');
    setErroBusca(null);
  }, [codigoIbge, municipioNome, nomeComunidade]);

  useEffect(() => () => controleBusca.current?.abort(), []);

  const limites = useMemo<Limites | null>(() => {
    if (!malha) return null;
    const caixa = L.geoJSON(malha as Parameters<typeof L.geoJSON>[0]).getBounds();
    return { oeste: caixa.getWest(), sul: caixa.getSouth(), leste: caixa.getEast(), norte: caixa.getNorth() };
  }, [malha]);

  const eventosPino = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({ dragend: (e) => aoMarcar(paraPonto((e.target as L.Marker).getLatLng())) }),
    [aoMarcar],
  );

  const podeProcurar = Boolean(nomeComunidade.trim() && municipioNome) && busca !== 'procurando';

  async function procurar() {
    if (!municipioNome || !nomeComunidade.trim()) return;
    controleBusca.current?.abort();
    const controle = new AbortController();
    controleBusca.current = controle;
    setBusca('procurando');
    setErroBusca(null);
    setSugestao(null);
    try {
      const lugar = await procurarComunidade(
        { nome: nomeComunidade, municipio: municipioNome, uf, limites },
        controle.signal,
      );
      setSugestao(lugar);
      setBusca(lugar ? 'ocioso' : 'nao-encontrado');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setErroBusca(e instanceof Error ? e.message : 'Não foi possível procurar agora.');
      setBusca('erro');
    }
  }

  function usarSugestao() {
    if (!sugestao) return;
    aoMarcar({ latitude: arredondar(sugestao.latitude), longitude: arredondar(sugestao.longitude) });
    setSugestao(null);
  }

  return (
    <div className={estilos.miniMapa}>
      <p id={idInstrucao} className="texto-apoio">
        Clique no mapa em cima da comunidade para marcar; arraste o pino para corrigir. Também dá
        para digitar ou colar a coordenada nos campos abaixo.
      </p>

      <div className={estilos.moldura} role="group" aria-label="Mapa da comunidade" aria-describedby={idInstrucao}>
        <MapContainer
          className={estilos.mapa}
          center={CENTRO_INICIAL}
          zoom={ZOOM_INICIAL}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          {/* O padrão diz "Zoom in"/"Zoom out" ao leitor de tela (WCAG 3.1.2). */}
          <ZoomControl position="topleft" zoomInTitle="Aproximar" zoomOutTitle="Afastar" />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Ruas">
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={ATRIBUICAO_OSM}
                maxZoom={19}
                eventHandlers={{ tileerror: () => setSemImagem(true) }}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution={ATRIBUICAO_ESRI}
                maxNativeZoom={18}
                maxZoom={19}
                eventHandlers={{ tileerror: () => setSemImagem(true) }}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {malha && <Contorno malha={malha} />}
          <Cliques aoMarcar={aoMarcar} />
          {ponto && (
            <>
              <Marker
                position={[ponto.latitude, ponto.longitude]}
                icon={pino}
                draggable
                eventHandlers={eventosPino}
                title="Comunidade (arraste para corrigir)"
              />
              <Acompanhar latitude={ponto.latitude} longitude={ponto.longitude} />
            </>
          )}
          {sugestao && (
            <>
              <Marker
                position={[sugestao.latitude, sugestao.longitude]}
                icon={pinoSugestao}
                title="Sugestão do OpenStreetMap"
              />
              <IrPara latitude={sugestao.latitude} longitude={sugestao.longitude} />
            </>
          )}
        </MapContainer>
      </div>

      <div className={estilos.busca}>
        <Botao type="button" variante="secundario" onClick={procurar} disabled={!podeProcurar}>
          {busca === 'procurando' ? 'Procurando…' : 'Procurar no mapa'}
        </Botao>
        {!municipioNome || !nomeComunidade.trim()
          ? <span className="campo__ajuda">Escolha o município e digite o nome para procurar.</span>
          : null}
      </div>

      <div aria-live="polite" className={estilos.recados}>
        {busca === 'nao-encontrado' && <p className="campo__ajuda">Não encontrado, marque no mapa.</p>}
        {busca === 'erro' && <p className="campo__ajuda campo__ajuda--erro">{erroBusca}</p>}
        {sugestao && (
          <div className={estilos.sugestao}>
            <p className={estilos.sugestaoTexto}>
              Sugestão (OpenStreetMap): <strong>{sugestao.descricao}</strong>. Confira no mapa antes de usar.
            </p>
            <div className={estilos.sugestaoAcoes}>
              <Botao type="button" variante="secundario" onClick={() => setSugestao(null)}>Descartar</Botao>
              <Botao type="button" variante="secundario" onClick={usarSugestao}>Usar esta posição</Botao>
            </div>
          </div>
        )}
        {semContorno && (
          <p className="campo__ajuda">Contorno do município indisponível agora. Dá para marcar assim mesmo.</p>
        )}
        {semImagem && (
          <p className="campo__ajuda">
            O mapa não carregou por completo. Os campos de latitude e longitude continuam valendo.
          </p>
        )}
      </div>
    </div>
  );
}
