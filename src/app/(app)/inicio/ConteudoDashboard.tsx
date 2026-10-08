'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { api } from '@/lib/api';
import { buscarMalhaMunicipio } from '@/lib/municipios';
import styles from './dashboard.module.css';

type SituacaoPainel = {
    totalFamilias: number;
    semBanheiro: IndicadorSituacaoPainel;
    soCarroPipa: IndicadorSituacaoPainel;
    soBolsaFamilia: IndicadorSituacaoPainel;
    semTratamentoAgua: IndicadorSituacaoPainel;
};

type IndicadorSituacaoPainel = {
    valor: number;
    percentual: number;
};

type ItemNecessidadePainel = {
    chave: string;
    quantidade: number;
};

type NecessidadesPainel = {
    totalFamilias: number;
    totalPessoas: number;
    totalCriancasAte12: number;
    roupa: ItemNecessidadePainel[];
    calcado: ItemNecessidadePainel[];
    semTamanhoInformado: number;
    semCalcadoInformado: number;
    semIdadeInformada: number;
};

type MunicipioPainel = {
    id: string;
    nome: string;
    uf: string;
    codigoIbge: string | null;
};

type ComunidadePainel = {
    id: string;
    nome: string;
    municipioId: string;
};

/** Um ponto de GET /api/relatorios/mapa: uma comunidade (ADR-0005), nunca uma família. */
type ComunidadeMapa = {
    comunidadeId: string;
    nome: string;
    familias: number;
    latitude: number | null;
    longitude: number | null;
};

type RespostaMapa = {
    /** `null` na visão geral (sem filtro de município). */
    municipio: { id: string; nome: string; codigoIbge: string | null } | null;
    pontos: ComunidadeMapa[];
};

/** Mesmas faixas da legenda do mapa: mais de 80, de 40 a 80, menos de 40. */
function corPorTotalFamilias(total: number): string {
    if (total > 80) return 'var(--laranja)';
    if (total >= 40) return 'var(--ambar)';
    return 'var(--verde)';
}

/**
 * Tamanho do pino, em pixels, proporcional ao número de famílias.
 * Raiz quadrada de propósito: o olho compara círculos pela área, não
 * pelo diâmetro — sem isso, o dobro de famílias pareceria 4x maior.
 */
function tamanhoPinoPorTotalFamilias(total: number): number {
    const minimoPx = 30;
    const maximoPx = 60;
    const maiorValorEsperado = 400; // ajustem conforme a maior comunidade real for aparecendo
    const proporcao = Math.sqrt(Math.min(total, maiorValorEsperado) / maiorValorEsperado);
    return Math.round(minimoPx + proporcao * (maximoPx - minimoPx));
}

function IconeFamilias() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5" />
            <path d="M16 5.5a3 3 0 0 1 0 5.8M16 14c2.4.2 3.9 1.8 4.5 5" />
        </svg>
    );
}

function IconePessoas() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="7.5" r="3.5" />
            <path d="M4.5 20c.5-4.1 3-6.2 7.5-6.2s7 2.1 7.5 6.2" />
        </svg>
    );
}

function IconeCriancas() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="7" r="2.8" />
            <path d="M7.5 20v-2.5a4.5 4.5 0 0 1 9 0V20M9 12.5l-2 2M15 12.5l2 2M10 20v-2M14 20v-2" />
        </svg>
    );
}

function IconeBanheiro() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M7 4v6M7 4h5v5M5 10h14l-2 5H7l-2-5Z" />
            <path d="M8 15v4h8v-4M16 18h2" />
        </svg>
    );
}

function IconeMunicipioFiltro() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
        </svg>
    );
}

function IconeComunidadeFiltro() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

const ACOES_CABECALHO = (
    <Link href="/familias/nova" className="botao botao--primario">
        Nova família
    </Link>
);

export function ConteudoDashboard() {
    useCabecalho('Início', ACOES_CABECALHO);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const municipioId = searchParams.get('municipioId') ?? '';
    const comunidadeId = searchParams.get('comunidadeId') ?? '';

    const [municipios, setMunicipios] = useState<MunicipioPainel[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [comunidades, setComunidades] = useState<ComunidadePainel[]>([]);
    const [carregandoComunidades, setCarregandoComunidades] = useState(false);

    const [situacao, setSituacao] = useState<SituacaoPainel | null>(null);
    const [necessidades, setNecessidades] = useState<NecessidadesPainel | null>(null);
    const [comunidadesMapa, setComunidadesMapa] = useState<ComunidadeMapa[]>([]);
    const [codigoIbgeSelecionado, setCodigoIbgeSelecionado] = useState<string | null>(null);
    const [carregandoRelatorios, setCarregandoRelatorios] = useState(true);
    const [erroRelatorios, setErroRelatorios] = useState<string | null>(null);
    const [carregandoMapa, setCarregandoMapa] = useState(true);
    const [erroMapa, setErroMapa] = useState<string | null>(null);
    const [semContorno, setSemContorno] = useState(false);
    const [modoMapa, setModoMapa] = useState<'familias' | 'comunidades'>('familias');

    // codigoIbgeSelecionado vem da resposta do mapa (`municipio.codigoIbge`).
    // "Todos os municípios" e um município sem código caem os dois em `null`,
    // e o mapa funciona sem desenhar o contorno.

    // --- Mapa: refs do Leaflet e do elemento DOM -----------------------
    const elementoMapaRef = useRef<HTMLDivElement | null>(null);
    const mapaRef = useRef<Leaflet.Map | null>(null);
    const camadaPinosRef = useRef<Leaflet.LayerGroup | null>(null);
    const camadaMalhaRef = useRef<Leaflet.GeoJSON | null>(null);
    const leafletRef = useRef<typeof Leaflet | null>(null);
    const [mapaPronto, setMapaPronto] = useState(false);

    useEffect(() => {
        let cancelado = false;
        const parametros = new URLSearchParams();

        if (municipioId) parametros.set('municipioId', municipioId);
        if (comunidadeId) parametros.set('comunidadeId', comunidadeId);

        const consulta = parametros.toString()
            ? `?${parametros.toString()}`
            : '';

        setCarregandoRelatorios(true);
        setErroRelatorios(null);

        Promise.all([
            api.get<SituacaoPainel>(`/relatorios/situacao${consulta}`),
            api.get<NecessidadesPainel>(`/relatorios/necessidades${consulta}`),
        ])
            .then(([dadosSituacao, dadosNecessidades]) => {
                if (cancelado) return;
                setSituacao(dadosSituacao);
                setNecessidades(dadosNecessidades);
            })
            .catch(() => {
                if (!cancelado) {
                    setErroRelatorios('Não foi possível carregar os indicadores.');
                }
            })
            .finally(() => {
                if (!cancelado) setCarregandoRelatorios(false);
            });

        return () => {
            cancelado = true;
        };
    }, [municipioId, comunidadeId]);

    useEffect(() => {
        let cancelado = false;
        const parametros = new URLSearchParams();

        if (municipioId) parametros.set('municipioId', municipioId);

        const consulta = parametros.toString() ? `?${parametros.toString()}` : '';
        setCarregandoMapa(true);
        setErroMapa(null);

        api.get<RespostaMapa>(`/relatorios/mapa${consulta}`)
            .then((dados) => {
                if (cancelado) return;
                // A rota só filtra por município; o recorte por comunidade é aqui.
                setComunidadesMapa(
                    comunidadeId ? dados.pontos.filter((p) => p.comunidadeId === comunidadeId) : dados.pontos
                );
                setCodigoIbgeSelecionado(dados.municipio?.codigoIbge ?? null);
            })
            .catch(() => {
                if (!cancelado) {
                    setComunidadesMapa([]);
                    setCodigoIbgeSelecionado(null);
                    setErroMapa('Não foi possível carregar os pontos do mapa.');
                }
            })
            .finally(() => {
                if (!cancelado) setCarregandoMapa(false);
            });

        return () => {
            cancelado = true;
        };
    }, [municipioId, comunidadeId]);

    useEffect(() => {
        let cancelado = false;

        setCarregandoComunidades(true);

        const consulta = municipioId
            ? `?municipioId=${encodeURIComponent(municipioId)}`
            : '';

        api.get<ComunidadePainel[]>(`/comunidades${consulta}`)
            .then((dados) => {
                if (!cancelado) setComunidades(dados);
            })
            .catch(() => {
                if (!cancelado) setComunidades([]);
            })
            .finally(() => {
                if (!cancelado) setCarregandoComunidades(false);
            });

        return () => {
            cancelado = true;
        };
    }, [municipioId]);

    useEffect(() => {
        let cancelado = false;

        api.get<MunicipioPainel[]>('/municipios')
            .then((dados) => {
                if (!cancelado) setMunicipios(dados);
            })
            .catch(() => {
                if (!cancelado) setErro('Não foi possível carregar os municípios.');
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => {
            cancelado = true;
        };
    }, []);

    // --- Mapa: efeito 1 — cria o mapa uma única vez, só no navegador ---
    // `useEffect` nunca roda no servidor, então o Leaflet nunca toca em
    // `window` durante o SSR. É por isso que não precisamos de
    // `next/dynamic` nem de um arquivo de componente separado: o
    // `import('leaflet')` aqui dentro já garante que isso só executa no
    // cliente.
    useEffect(() => {
        if (mapaRef.current || !elementoMapaRef.current) return; // guarda contra o Strict Mode
        let cancelado = false;

        import('leaflet').then((modulo) => {
            if (cancelado || !elementoMapaRef.current || mapaRef.current) return;

            const L = modulo.default;
            leafletRef.current = modulo;

            const mapa = L.map(elementoMapaRef.current, {
                center: [-8.7, -37.8], // sertão de Pernambuco, ponto de partida
                zoom: 8,
                zoomControl: false,
            });

            // O controle padrão vem com "Zoom in"/"Zoom out" em inglês, e é
            // isso que o leitor de tela lê (WCAG 3.1.2).
            L.control.zoom({ zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(mapa);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapa);

            camadaPinosRef.current = L.layerGroup().addTo(mapa);
            mapaRef.current = mapa;
            setMapaPronto(true);
        });

        return () => {
            cancelado = true;
            mapaRef.current?.remove();
            mapaRef.current = null;
        };
    }, []);

    // --- Mapa: efeito 2 — redesenha os pinos quando os dados mudarem ---
    useEffect(() => {
        const L = leafletRef.current;
        const mapa = mapaRef.current;
        const camadaPinos = camadaPinosRef.current;
        if (!mapaPronto || !L || !mapa || !camadaPinos) return;

        camadaPinos.clearLayers();

        const comCoordenadas = comunidadesMapa.filter(
            (c): c is ComunidadeMapa & { latitude: number; longitude: number } =>
                c.latitude !== null && c.longitude !== null
        );

        comCoordenadas.forEach((comunidade) => {
            const tamanho = tamanhoPinoPorTotalFamilias(comunidade.familias);
            const mostrandoFamilias = modoMapa === 'familias';
            const tamanhoPino = mostrandoFamilias ? tamanho : 32;
            const cor = mostrandoFamilias
                ? corPorTotalFamilias(comunidade.familias)
                : 'var(--laranja)';

            const icone = L.divIcon({
                className: styles.pino,
                html: `<div style="width:${tamanhoPino}px;height:${tamanhoPino}px;background:${cor};">${mostrandoFamilias ? comunidade.familias : ''}</div>`,
                iconSize: [tamanhoPino, tamanhoPino],
                iconAnchor: [tamanhoPino / 2, tamanhoPino / 2],
            });

            L.marker([comunidade.latitude, comunidade.longitude], { icon: icone })
                .bindTooltip(mostrandoFamilias
                    ? `<strong>${comunidade.nome}</strong><br>${comunidade.familias} famílias`
                    : `<strong>${comunidade.nome}</strong><br>Comunidade atendida`)
                .addTo(camadaPinos);
        });

        if (comCoordenadas.length > 0) {
            const grupo = L.featureGroup(camadaPinos.getLayers());
            mapa.fitBounds(grupo.getBounds().pad(0.2));
        }
    }, [comunidadesMapa, mapaPronto, modoMapa]);

    // --- Mapa: efeito 3 — busca e desenha a malha do IBGE --------------
    useEffect(() => {
        const L = leafletRef.current;
        const mapa = mapaRef.current;
        if (!mapaPronto || !L || !mapa) return;

        if (camadaMalhaRef.current) {
            camadaMalhaRef.current.remove();
            camadaMalhaRef.current = null;
        }

        setSemContorno(false);
        if (!codigoIbgeSelecionado) return; // "Todos os municípios" → sem polígono único

        let cancelado = false;
        const controle = new AbortController();

        buscarMalhaMunicipio(codigoIbgeSelecionado, controle.signal)
            .then((malha) => {
                if (cancelado) return;

                const camada = L.geoJSON(malha as Parameters<typeof L.geoJSON>[0], {
                    style: { className: styles.contorno },
                    interactive: false,
                }).addTo(mapa);

                camadaMalhaRef.current = camada;
                mapa.fitBounds(camada.getBounds().pad(0.15)); // enquadra sozinho
            })
            .catch((erro) => {
                if (cancelado || (erro instanceof DOMException && erro.name === 'AbortError')) return;
                setSemContorno(true);
            });

        return () => {
            cancelado = true;
            controle.abort();
        };
    }, [codigoIbgeSelecionado, mapaPronto]);

    function aoTrocarMunicipio(evento: ChangeEvent<HTMLSelectElement>) {
        const parametros = new URLSearchParams(searchParams.toString());
        const novoId = evento.target.value;

        if (novoId) {
            parametros.set('municipioId', novoId);
        } else {
            parametros.delete('municipioId');
        }

        parametros.delete('comunidadeId');

        const consulta = parametros.toString();
        router.replace(`${pathname}${consulta ? `?${consulta}` : ''}`, {
            scroll: false,
        });
    }

    function aoTrocarComunidade(evento: ChangeEvent<HTMLSelectElement>) {
        const parametros = new URLSearchParams(searchParams.toString());
        const novoId = evento.target.value;

        if (novoId) {
            parametros.set('comunidadeId', novoId);
        } else {
            parametros.delete('comunidadeId');
        }

        const consulta = parametros.toString();
        router.replace(`${pathname}${consulta ? `?${consulta}` : ''}`, {
            scroll: false,
        });
    }

    const comunidadesOrdenadas = [...comunidadesMapa].sort(
        (a, b) => b.familias - a.familias
    );
    const maiorTotalFamilias = Math.max(1, ...comunidadesMapa.map((c) => c.familias));

    return (
        <div className={styles.pagina}>
            <section className={styles.cabecalho} aria-labelledby="titulo-dashboard">
                <h2 id="titulo-dashboard">Visão geral</h2>
                <p>Famílias e comunidades atendidas pela associação.</p>
                {carregando && (
                    <span className="campo__ajuda" aria-live="polite">
                        Carregando municípios...
                    </span>
                )}
                {erro && (
                    <span className="campo__ajuda campo__ajuda--erro" role="alert">
                        {erro}
                    </span>
                )}
            </section>

            <div className={styles.cartoes}>
                <article className={`cartao ${styles.cartaoIndicador}`} aria-labelledby="indicador-familias">
                    <div className={styles.cartaoCabecalho}>
                        <span className={styles.iconeCartao}><IconeFamilias /></span>
                        <h2 className={styles.rotulo} id="indicador-familias">Famílias cadastradas</h2>
                    </div>
                    <strong className={styles.numero}>
                        {carregandoRelatorios ? '...' : (necessidades?.totalFamilias ?? 0).toLocaleString('pt-BR')}
                    </strong>
                </article>

                <article className={`cartao ${styles.cartaoIndicador}`} aria-labelledby="indicador-pessoas">
                    <div className={styles.cartaoCabecalho}>
                        <span className={styles.iconeCartao}><IconePessoas /></span>
                        <h2 className={styles.rotulo} id="indicador-pessoas">Pessoas</h2>
                    </div>
                    <strong className={styles.numero}>
                        {carregandoRelatorios ? '...' : (necessidades?.totalPessoas ?? 0).toLocaleString('pt-BR')}
                    </strong>
                </article>

                <article className={`cartao ${styles.cartaoIndicador}`} aria-labelledby="indicador-criancas">
                    <div className={styles.cartaoCabecalho}>
                        <span className={styles.iconeCartao}><IconeCriancas /></span>
                        <h2 className={styles.rotulo} id="indicador-criancas">Crianças até 12 anos</h2>
                    </div>
                    <strong className={styles.numero}>
                        {carregandoRelatorios ? '...' : (necessidades?.totalCriancasAte12 ?? 0).toLocaleString('pt-BR')}
                    </strong>
                </article>

                <article className={`cartao ${styles.cartaoIndicador}`} aria-labelledby="indicador-banheiro">
                    <div className={styles.cartaoCabecalho}>
                        <span className={styles.iconeCartao}><IconeBanheiro /></span>
                        <h2 className={styles.rotulo} id="indicador-banheiro">Famílias sem banheiro</h2>
                    </div>
                    <strong className={styles.numero}>
                        {carregandoRelatorios ? '...' : (situacao?.semBanheiro.valor ?? 0).toLocaleString('pt-BR')}
                    </strong>
                </article>
            </div>

            <section className={`${styles.filtros} nao-imprime`} aria-label="Filtros do dashboard">
                <div className="campo">
                    <label className={`campo__rotulo ${styles.rotuloFiltro}`} htmlFor="filtro-municipio">
                        <IconeMunicipioFiltro />
                        <span>Município</span>
                    </label>
                    <div className={styles.selectEnvoltorio}>
                        <select
                            id="filtro-municipio"
                            className={`campo__entrada ${styles.selectComSeta}`}
                            value={municipioId}
                            onChange={aoTrocarMunicipio}
                            disabled={carregando}
                        >
                            <option value="">Todos os municípios</option>
                            {municipios.map((municipio) => (
                                <option key={municipio.id} value={municipio.id}>
                                    {municipio.nome} - {municipio.uf}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="campo">
                    <label className={`campo__rotulo ${styles.rotuloFiltro}`} htmlFor="filtro-comunidade">
                        <IconeComunidadeFiltro />
                        <span>Comunidade</span>
                    </label>
                    <div className={styles.selectEnvoltorio}>
                        <select
                            id="filtro-comunidade"
                            className={`campo__entrada ${styles.selectComSeta}`}
                            value={comunidadeId}
                            onChange={aoTrocarComunidade}
                            disabled={carregandoComunidades}
                        >
                            <option value="">Todas as comunidades</option>
                            {comunidades.map((comunidade) => (
                                <option key={comunidade.id} value={comunidade.id}>
                                    {comunidade.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="campo">
                    <label className={`campo__rotulo ${styles.rotuloFiltro}`} htmlFor="filtro-modo-mapa">
                        <IconeComunidadeFiltro />
                        <span>Mostrar no mapa</span>
                    </label>
                    <div className={styles.selectEnvoltorio}>
                        <select
                            id="filtro-modo-mapa"
                            className={`campo__entrada ${styles.selectComSeta}`}
                            value={modoMapa}
                            onChange={(evento) => setModoMapa(evento.target.value as 'familias' | 'comunidades')}
                        >
                            <option value="familias">Famílias por comunidade</option>
                            <option value="comunidades">Comunidades com pontos iguais</option>
                        </select>
                    </div>
                </div>
            </section>

            {erroRelatorios && (
                <p className="campo__ajuda campo__ajuda--erro" role="alert">
                    {erroRelatorios}
                </p>
            )}

            <div className={styles.corpoMapa}>
                <div className={styles.areaMapa}>
                    <div ref={elementoMapaRef} className={styles.mapa} aria-label="Mapa das comunidades atendidas" />
                    <div className={styles.legendaMapa} aria-label="Legenda do mapa">
                        <strong>{modoMapa === 'familias' ? 'Tamanho e cor do pino = famílias' : 'Pontos representam comunidades'}</strong>
                        {modoMapa === 'familias' ? (
                            <ul>
                                <li><span className={`${styles.amostraLegenda} ${styles.amostraGrande}`} />Mais de 80 famílias</li>
                                <li><span className={`${styles.amostraLegenda} ${styles.amostraMedia}`} />De 40 a 80</li>
                                <li><span className={`${styles.amostraLegenda} ${styles.amostraPequena}`} />Menos de 40</li>
                            </ul>
                        ) : (
                            <p>Um ponto por comunidade, sem escala de famílias.</p>
                        )}
                    </div>
                </div>

                <aside className={`cartao ${styles.lista}`} aria-label="Comunidades no mapa">
                    <h2 className={styles.listaTitulo}>Comunidades no mapa</h2>

                    {carregandoMapa ? (
                        <p className={styles.listaVazia}>Carregando comunidades...</p>
                    ) : erroMapa ? (
                        <p className="campo__ajuda campo__ajuda--erro" role="alert">{erroMapa}</p>
                    ) : comunidadesOrdenadas.length === 0 ? (
                        <p className={styles.listaVazia}>
                            Nenhuma comunidade encontrada para esse filtro.
                        </p>
                    ) : (
                        <ul className={styles.listaItens}>
                            {comunidadesOrdenadas.map((comunidade) => {
                                // O ponto do mapa não traz município; vem da lista de comunidades.
                                const municipioDaComunidade = municipios.find(
                                    (municipio) => municipio.id
                                        === comunidades.find((c) => c.id === comunidade.comunidadeId)?.municipioId
                                );

                                return (
                                    <li key={comunidade.comunidadeId} className={styles.listaItem}>
                                        <div className={styles.listaItemCabecalho}>
                                            <span>{comunidade.nome}</span>
                                            <strong>{comunidade.familias}</strong>
                                        </div>

                                        {municipioDaComunidade && (
                                            <span className={styles.listaItemLocal}>
                                                {municipioDaComunidade.nome} · {municipioDaComunidade.uf}
                                            </span>
                                        )}

                                        <div className={styles.listaBarraFundo}>
                                            <div
                                                className={styles.listaBarraPreenchida}
                                                style={{
                                                    width: `${(comunidade.familias / maiorTotalFamilias) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        {comunidade.latitude === null && (
                                            <span className={styles.semLocalizacao}>
                                                Sem coordenada · não aparece no mapa
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {semContorno && (
                        <p className={styles.listaVazia}>
                            Contorno do município indisponível; os pontos continuam visíveis.
                        </p>
                    )}
                </aside>
            </div>

            <section className={`cartao ${styles.grafico}`} aria-labelledby="titulo-situacao">
                <h2 id="titulo-situacao">Situação das famílias</h2>

                {carregandoRelatorios ? (
                    <p>Carregando situação...</p>
                ) : (
                    <div className={styles.listaBarras}>
                        <div className={styles.barra}>
                            <span>Sem banheiro</span>
                            <strong>{situacao?.semBanheiro.percentual ?? 0}%</strong>
                            <progress value={situacao?.semBanheiro.percentual ?? 0} max="100" />
                        </div>
                        <div className={styles.barra}>
                            <span>Somente carro-pipa</span>
                            <strong>{situacao?.soCarroPipa.percentual ?? 0}%</strong>
                            <progress value={situacao?.soCarroPipa.percentual ?? 0} max="100" />
                        </div>
                        <div className={styles.barra}>
                            <span>Somente Bolsa Família</span>
                            <strong>{situacao?.soBolsaFamilia.percentual ?? 0}%</strong>
                            <progress value={situacao?.soBolsaFamilia.percentual ?? 0} max="100" />
                        </div>
                        <div className={styles.barra}>
                            <span>Sem tratamento de água</span>
                            <strong>{situacao?.semTratamentoAgua.percentual ?? 0}%</strong>
                            <progress value={situacao?.semTratamentoAgua.percentual ?? 0} max="100" />
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
