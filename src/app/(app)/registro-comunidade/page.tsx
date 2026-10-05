'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { Campo } from '@/componentes/Campo';
import { Loading } from '@/componentes/Loading';
import type { Ponto } from '@/componentes/comunidade/MiniMapa';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { Selecao } from '@/componentes/Selecao';
import { api } from '@/lib/api';
import { useMetadados } from '@/lib/metadados';
import {
  garantirMunicipio, listarMunicipiosIbge, listarUfs, type MunicipioIbge, type UfIbge,
} from '@/lib/municipios';
import type { Comunidade, TipoComunidade } from '@/tipos/dominio';
import estilos from './registro-comunidade.module.css';

/** Corpo de `POST /api/comunidades` (`ComunidadeCreateRequest`). */
interface ComunidadeRequisicao {
  nome: string;
  municipioId: string;
  tipoComunidade: TipoComunidade;
  liderNome: string | null;
  liderTelefone: string | null;
  latitude: number | null;
  longitude: number | null;
  observacoes: string | null;
}

/* Começa em PE: a associação atende o Sertão do Moxotó. */
const VAZIO = {
  uf: 'PE',
  /** Código IBGE do município escolhido. */
  municipioIbge: '',
  nome: '',
  tipoComunidade: '',
  liderNome: '',
  liderTelefone: '',
  latitude: '',
  longitude: '',
  observacoes: '',
};

type Formulario = typeof VAZIO;
type Erros = Partial<Record<keyof Formulario, string>>;

const ID_NOME = 'nome-comunidade';

/* Leaflet usa `window`, então o mapa só existe no navegador. */
const MiniMapa = dynamic(() => import('@/componentes/comunidade/MiniMapa'), {
  ssr: false,
  loading: () => <Loading mensagem="Carregando o mapa…" tamanho="compacto" />,
});

const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Não foi possível concluir a operação.');

const cancelado = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

const textoOuNulo = (valor: string) => valor.trim() || null;

/** Aceita vírgula ("-8,4123"), que é como se digita decimal no Brasil. */
const coordenada = (valor: string) => (valor.trim() ? Number(valor.trim().replace(',', '.')) : null);

/** Mostra no campo do jeito que se digita aqui: "-8,412345". */
const textoCoordenada = (valor: number) => String(valor).replace('.', ',');

/**
 * Par "lat, long" colado de uma vez (Google Maps, link de localização do
 * WhatsApp: "-8.4123, -37.0541"). Exige ponto decimal, para não confundir com
 * um número só escrito com vírgula ("-8,4123").
 */
const PAR = /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;

function validar(form: Formulario): Erros {
  const erros: Erros = {};
  if (!form.uf) erros.uf = 'Escolha o estado.';
  if (!form.municipioIbge) erros.municipioIbge = 'Escolha o município.';
  if (!form.nome.trim()) erros.nome = 'Informe o nome da comunidade.';
  if (!form.tipoComunidade) erros.tipoComunidade = 'Escolha o tipo.';

  const latitude = coordenada(form.latitude);
  const longitude = coordenada(form.longitude);
  if (latitude !== null && !(Math.abs(latitude) <= 90)) erros.latitude = 'Latitude vai de -90 a 90.';
  if (longitude !== null && !(Math.abs(longitude) <= 180)) erros.longitude = 'Longitude vai de -180 a 180.';
  // Um ponto só com metade da coordenada não serve para o mapa.
  if ((latitude === null) !== (longitude === null)) {
    if (latitude === null) erros.latitude ??= 'Informe a latitude junto com a longitude.';
    else erros.longitude ??= 'Informe a longitude junto com a latitude.';
  }
  return erros;
}

/**
 * Cadastro de comunidade (sítio, povoado, assentamento…). É a unidade do mapa
 * (ADR-0005): o ponto fica na comunidade, nunca na família. Os totais de
 * pessoas e crianças não são digitados aqui, saem das famílias ligadas a ela.
 *
 * Estado e município vêm da lista do IBGE; ao salvar, `garantirMunicipio`
 * acha ou cria o município no nosso banco. O nome da comunidade é digitado:
 * sítio e assentamento não constam no IBGE (os "distritos" de lá são outra
 * coisa).
 *
 * Depois de salvar, o formulário limpa mas mantém estado e município, para
 * cadastrar várias comunidades do mesmo município em sequência.
 */
export default function RegistroComunidade() {
  useCabecalho('Nova comunidade');
  const { metadados, erro: erroMetadados } = useMetadados();

  const [ufs, setUfs] = useState<UfIbge[] | null>(null);
  const [municipiosIbge, setMunicipiosIbge] = useState<MunicipioIbge[] | null>(null);
  const [erroIbge, setErroIbge] = useState<string | null>(null);
  /** Muda ao clicar em "Tentar de novo" e refaz as buscas no IBGE. */
  const [tentativa, setTentativa] = useState(0);

  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState<Comunidade | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    setErroIbge(null);
    listarUfs(controle.signal)
      .then(setUfs)
      .catch((e) => { if (!cancelado(e)) setErroIbge(mensagem(e)); });
    return () => controle.abort();
  }, [tentativa]);

  // Trocar de estado cancela a busca anterior: a resposta de PE não pode
  // chegar depois da de PB e sobrescrever a lista.
  useEffect(() => {
    setMunicipiosIbge(null);
    if (!form.uf) return;
    const controle = new AbortController();
    listarMunicipiosIbge(form.uf, controle.signal)
      .then(setMunicipiosIbge)
      .catch((e) => { if (!cancelado(e)) setErroIbge(mensagem(e)); });
    return () => controle.abort();
  }, [form.uf, tentativa]);

  const opcoesUf = useMemo(() => ufs?.map((u) => ({ valor: u.sigla, rotulo: u.nome })), [ufs]);
  const opcoesMunicipio = useMemo(
    () => municipiosIbge?.map((m) => ({ valor: String(m.id), rotulo: m.nome })),
    [municipiosIbge],
  );

  const municipioNome = municipiosIbge?.find((m) => String(m.id) === form.municipioIbge)?.nome ?? null;

  // O pino segue o que está nos campos, desde que seja um ponto inteiro e válido.
  const latitude = coordenada(form.latitude);
  const longitude = coordenada(form.longitude);
  const ponto = useMemo<Ponto | null>(
    () => (latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
      ? { latitude, longitude }
      : null),
    [latitude, longitude],
  );

  const marcar = useCallback(({ latitude: lat, longitude: lng }: Ponto) => {
    setForm((atual) => ({ ...atual, latitude: textoCoordenada(lat), longitude: textoCoordenada(lng) }));
    setErros((atuais) => ({ ...atuais, latitude: undefined, longitude: undefined }));
    setCriada(null);
  }, []);

  function mudarCoordenada(campo: 'latitude' | 'longitude', valor: string) {
    const par = PAR.exec(valor);
    if (par) marcar({ latitude: Number(par[1]), longitude: Number(par[2]) });
    else mudar(campo, valor);
  }

  function mudar(campo: keyof Formulario, valor: string) {
    setForm((atual) => (campo === 'uf'
      ? { ...atual, uf: valor, municipioIbge: '' }
      : { ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setCriada(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const encontrados = validar(form);
    const escolhido = municipiosIbge?.find((m) => String(m.id) === form.municipioIbge);
    if (!encontrados.municipioIbge && !escolhido) encontrados.municipioIbge = 'Escolha o município.';
    setErros(encontrados);
    setErro(null);
    if (Object.keys(encontrados).length > 0 || !escolhido) return;

    setSalvando(true);
    try {
      const municipio = await garantirMunicipio(escolhido, form.uf);
      const corpo: ComunidadeRequisicao = {
        nome: form.nome.trim(),
        municipioId: municipio.id,
        tipoComunidade: form.tipoComunidade as TipoComunidade,
        liderNome: textoOuNulo(form.liderNome),
        liderTelefone: textoOuNulo(form.liderTelefone),
        latitude: coordenada(form.latitude),
        longitude: coordenada(form.longitude),
        observacoes: textoOuNulo(form.observacoes),
      };
      const comunidade = await api.post<Comunidade>('/comunidades', corpo);
      setCriada(comunidade);
      setForm({ ...VAZIO, uf: form.uf, municipioIbge: form.municipioIbge });
      document.getElementById(ID_NOME)?.focus();
    } catch (falha) {
      setErro(mensagem(falha));
    } finally {
      setSalvando(false);
    }
  }

  function limpar() {
    setForm(VAZIO);
    setErros({});
    setErro(null);
    setCriada(null);
  }

  const carregando = (lista: unknown[] | null) => (lista === null && !erroIbge ? 'Carregando…' : 'Selecione');

  return (
    <form className={estilos.pagina} onSubmit={salvar} noValidate>
      <p className="texto-apoio">
        A comunidade é o ponto do mapa e o que a agente escolhe no app. Os totais de pessoas vêm das
        famílias cadastradas nela.
      </p>

      {erroIbge && (
        <div className={estilos.avisoComAcao}>
          <Aviso tom="erro" titulo="Lista de municípios indisponível">{erroIbge}</Aviso>
          <Botao type="button" variante="secundario" onClick={() => setTentativa((t) => t + 1)}>
            Tentar de novo
          </Botao>
        </div>
      )}
      {erroMetadados && <Aviso tom="erro" titulo="Não deu para carregar as listas">{erroMetadados.message}</Aviso>}

      {criada && (
        <div role="status">
          <Aviso titulo="Comunidade cadastrada">
            {criada.nome} ({criada.municipioNome}) já aparece no cadastro de famílias e no app das agentes.
          </Aviso>
        </div>
      )}

      <fieldset className={`cartao ${estilos.secao}`}>
        <legend className={estilos.legenda}>Localização</legend>
        <div className={estilos.grade}>
          <Selecao
            rotulo="Estado"
            opcoes={opcoesUf}
            vazio={carregando(ufs)}
            value={form.uf}
            onChange={(e) => mudar('uf', e.target.value)}
            erro={erros.uf}
            disabled={!ufs}
            required
          />
          <Selecao
            rotulo="Município"
            opcoes={opcoesMunicipio}
            vazio={form.uf ? carregando(municipiosIbge) : 'Escolha o estado antes'}
            value={form.municipioIbge}
            onChange={(e) => mudar('municipioIbge', e.target.value)}
            erro={erros.municipioIbge}
            disabled={!municipiosIbge?.length}
            required
          />
          <Campo
            id={ID_NOME}
            rotulo="Nome da comunidade"
            ajuda="Sítio, povoado ou assentamento, como a associação chama."
            value={form.nome}
            onChange={(e) => mudar('nome', e.target.value)}
            erro={erros.nome}
            maxLength={120}
            required
          />
          <Selecao
            rotulo="Tipo"
            opcoes={metadados?.tipoComunidade}
            vazio="Selecione"
            value={form.tipoComunidade}
            onChange={(e) => mudar('tipoComunidade', e.target.value)}
            erro={erros.tipoComunidade}
            required
          />
        </div>
        <MiniMapa
          codigoIbge={form.municipioIbge || null}
          municipioNome={municipioNome}
          uf={form.uf}
          nomeComunidade={form.nome}
          ponto={ponto}
          aoMarcar={marcar}
        />
        <div className={estilos.grade}>
          <Campo
            rotulo="Latitude"
            ajuda="Opcional. Ex.: -8,4123, ou cole o par do Google Maps"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => mudarCoordenada('latitude', e.target.value)}
            erro={erros.latitude}
          />
          <Campo
            rotulo="Longitude"
            ajuda="Opcional. Ex.: -37,0541"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => mudarCoordenada('longitude', e.target.value)}
            erro={erros.longitude}
          />
        </div>
      </fieldset>

      <fieldset className={`cartao ${estilos.secao}`}>
        <legend className={estilos.legenda}>Liderança</legend>
        <div className={estilos.grade}>
          <Campo
            rotulo="Nome do líder"
            value={form.liderNome}
            onChange={(e) => mudar('liderNome', e.target.value)}
            maxLength={120}
          />
          <Campo
            rotulo="Telefone do líder"
            type="tel"
            inputMode="tel"
            value={form.liderTelefone}
            onChange={(e) => mudar('liderTelefone', e.target.value)}
            maxLength={20}
          />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="observacoes-comunidade">Observações</label>
          <textarea
            id="observacoes-comunidade"
            className={`campo__entrada ${estilos.textoLongo}`}
            value={form.observacoes}
            onChange={(e) => mudar('observacoes', e.target.value)}
          />
        </div>
      </fieldset>

      {erro && <Aviso tom="erro" titulo="Não deu para salvar">{erro}</Aviso>}

      <div className={estilos.acoes}>
        <Botao type="button" variante="secundario" onClick={limpar}>Limpar</Botao>
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar comunidade'}
        </Botao>
      </div>
    </form>
  );
}
