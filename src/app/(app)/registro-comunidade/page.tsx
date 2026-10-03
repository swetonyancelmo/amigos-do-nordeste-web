'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Aviso } from '@/componentes/Aviso';
import { Botao } from '@/componentes/Botao';
import { useCabecalho } from '@/componentes/ContextoCabecalho';

import estilos from './page.module.css';

interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

interface MunicipioIBGE {
  id: number;
  nome: string;
}

interface DistritoIBGE {
  id: number;
  nome: string;
}

const VALOR_INICIAL = {
  estado: 'PE',
  municipio: '',
  comunidade: '',
  TipodeComunidade: '',
  nomeResponsavel: '',
  telefoneResponsavel: '',
  quantidadePessoas: '',
  quantidadeAdolescentes: '',
  quantidadeCriancas: '',
  endereco: '',
  numero: '',
  pontoReferencia: '',
  dataInicio: '',
  dataFim: '',
};

type DadosFormulario = typeof VALOR_INICIAL;

export default function RegistroComunidade() {
  useCabecalho('Cadastro de comunidades');
  const [dados, setDados] = useState<DadosFormulario>(VALOR_INICIAL);
  const [salvo, setSalvo] = useState(false);

  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [comunidades, setComunidades] = useState<DistritoIBGE[]>([]);

  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [carregandoComunidades, setCarregandoComunidades] = useState(false);

  const [municipioIdSelecionado, setMunicipioIdSelecionado] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => res.json())
      .then((data: EstadoIBGE[]) => setEstados(data))
      .catch((err) => console.error('Erro ao buscar estados:', err));
  }, []);

  useEffect(() => {
    if (!dados.estado) {
      setMunicipios([]);
      setComunidades([]);
      return;
    }

    setCarregandoMunicipios(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${dados.estado}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data: MunicipioIBGE[]) => {
        setMunicipios(data);
        setCarregandoMunicipios(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar municípios:', err);
        setCarregandoMunicipios(false);
      });
  }, [dados.estado]);

  useEffect(() => {
    if (!municipioIdSelecionado) {
      setComunidades([]);
      return;
    }

    setCarregandoComunidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipioIdSelecionado}/distritos?orderBy=nome`)
      .then((res) => res.json())
      .then((data: DistritoIBGE[]) => {
        setComunidades(data);
        setCarregandoComunidades(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar comunidades/distritos:', err);
        setCarregandoComunidades(false);
      });
  }, [municipioIdSelecionado]);

  function atualizar(campo: keyof DadosFormulario, valor: string) {
    setDados((atual) => {
      if (campo === 'estado') {
        setMunicipioIdSelecionado(null);
        return { ...atual, estado: valor, municipio: '', comunidade: '' };
      }
      return { ...atual, [campo]: valor };
    });
    setSalvo(false);
  }

  function aoSelecionarMunicipio(nomeMunicipio: string) {
    const munEncontrado = municipios.find((m) => m.nome === nomeMunicipio);
    if (munEncontrado) {
      setMunicipioIdSelecionado(munEncontrado.id);
      setDados((atual) => ({ ...atual, municipio: nomeMunicipio, comunidade: '' }));
    } else {
      setMunicipioIdSelecionado(null);
      setDados((atual) => ({ ...atual, municipio: '', comunidade: '' }));
    }
    setSalvo(false);
  }

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setSalvo(true);
  }

  function limpar() {
    setDados(VALOR_INICIAL);
    setMunicipioIdSelecionado(null);
    setSalvo(false);
  }

  return (
    <main className={estilos.pagina}>
      <section className={estilos.cartao} aria-labelledby="titulo-cadastro">
        <div className={estilos.cabecalho}>
          <span className={estilos.eyebrow}>Registro territorial</span>
          <h1 id="titulo-cadastro">Cadastro de comunidades</h1>
          <p>Registre a localização e as informações gerais da comunidade.</p>
        </div>

        {salvo && (
          <Aviso titulo="Registro pronto">Os dados foram preenchidos e estão prontos para serem enviados.</Aviso>
        )}

        <form className={estilos.formulario} onSubmit={submeter}>
          <fieldset className={estilos.grupo}>
            <legend>Localização</legend>
            <div className={estilos.linhaTres}>
              {/* Select de Estado */}
              <div className={estilos.campo}>
                <label htmlFor="estado"><IconeCampo nome="localizacao" /> Estado</label>
                <select 
                  id="estado" 
                  name="estado" 
                  value={dados.estado} 
                  onChange={(e) => atualizar('estado', e.target.value)}
                  required
                >
                  <option value="">Selecione um estado</option>
                  {estados.map((uf) => (
                    <option key={uf.id} value={uf.sigla}>
                      {uf.nome} ({uf.sigla})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select de Município */}
              <div className={estilos.campo}>
                <label htmlFor="municipio"><IconeCampo nome="municipio" /> Município</label>
                <select
                  id="municipio"
                  name="municipio"
                  value={dados.municipio}
                  onChange={(e) => aoSelecionarMunicipio(e.target.value)}
                  disabled={!dados.estado || carregandoMunicipios}
                  required
                >
                  <option value="">
                    {carregandoMunicipios ? 'Carregando municípios...' : 'Selecione um município'}
                  </option>
                  {municipios.map((mun) => (
                    <option key={mun.id} value={mun.nome}>
                      {mun.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select de Comunidade / Distrito (IBGE) */}
              <div className={estilos.campo}>
                <label htmlFor="comunidade"><IconeCampo nome="comunidade" /> Comunidade / Distrito</label>
                <select
                  id="comunidade"
                  name="comunidade"
                  value={dados.comunidade}
                  onChange={(e) => atualizar('comunidade', e.target.value)}
                  disabled={!dados.municipio || carregandoComunidades}
                  required
                >
                  <option value="">
                    {carregandoComunidades ? 'Carregando comunidades...' : 'Selecione a comunidade'}
                  </option>
                  {comunidades.map((com) => (
                    <option key={com.id} value={com.nome}>
                      {com.nome}
                    </option>
                  ))}
                </select>
              </div>

              <CampoTexto id="tipoDeComunidade" icone="comunidade" rotulo="Tipo de Comunidade" placeholder="Ex.: Urbana, Quilombola, Rural" valor={dados.TipodeComunidade} onChange={(valor) => atualizar('TipodeComunidade', valor)} required />
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Composição</legend>
            <div className={estilos.linhaTres}>
              <CampoTexto id="nomeResponsavel" icone="pessoa" rotulo="Nome do responsável" placeholder="Digite o nome completo" valor={dados.nomeResponsavel} onChange={(valor) => atualizar('nomeResponsavel', valor)} />
              <CampoTexto id="telefoneResponsavel" icone="pessoa" rotulo="Telefone do responsável" placeholder="Digite o telefone completo" valor={dados.telefoneResponsavel} onChange={(valor) => atualizar('telefoneResponsavel', valor)} />
              <CampoTexto id="quantidadePessoas" icone="pessoas" rotulo="Total de pessoas" tipo="number" placeholder="Ex.: 4" valor={dados.quantidadePessoas} onChange={(valor) => atualizar('quantidadePessoas', valor)} min="0" />
            </div>
            <div className={estilos.linhaTres}>
              <CampoTexto id="quantidadeCriancas" icone="crianca" rotulo="Quantidade de crianças" tipo="number" placeholder="Ex.: 2" valor={dados.quantidadeCriancas} onChange={(valor) => atualizar('quantidadeCriancas', valor)} min="0" />
              <CampoTexto id="quantidadeAdolescentes" icone="adolescente" rotulo="Quantidade de adolescentes" tipo="number" placeholder="Ex.: 2" valor={dados.quantidadeAdolescentes} onChange={(valor) => atualizar('quantidadeAdolescentes', valor)} min="0" /> 
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Endereço</legend>
            <div className={estilos.linhaTres}>
              <CampoTexto id="endereco" icone="endereco" rotulo="Endereço" placeholder="Rua, avenida, travessa..." valor={dados.endereco} onChange={(valor) => atualizar('endereco', valor)} />
              <CampoTexto id="numero" icone="numero" rotulo="Número" placeholder="Nº / S/N" valor={dados.numero} onChange={(valor) => atualizar('numero', valor)} />
              <CampoTexto id="pontoReferencia" icone="referencia" rotulo="Ponto de referência" placeholder="Próximo a..." valor={dados.pontoReferencia} onChange={(valor) => atualizar('pontoReferencia', valor)} />
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Período de registro</legend>
            <div className={estilos.linhaDatas}>
              <CampoTexto id="dataInicio" icone="calendario" rotulo="De" tipo="date" valor={dados.dataInicio} onChange={(valor) => atualizar('dataInicio', valor)} />
              <CampoTexto id="dataFim" icone="calendario" rotulo="Até" tipo="date" valor={dados.dataFim} onChange={(valor) => atualizar('dataFim', valor)} />
            </div>
          </fieldset>

          <div className={estilos.acoes}>
            <Botao type="button" variante="secundario" onClick={limpar}>Limpar</Botao>
            <Botao type="submit">Salvar registro</Botao>
          </div>
        </form>
      </section>
    </main>
  );
}

type CampoProps = {
  id: string;
  icone: NomeIconeCampo;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: 'text' | 'number' | 'date';
  min?: string;
  required?: boolean;
};

function CampoTexto({ id, icone, rotulo, valor, onChange, placeholder, tipo = 'text', min, required }: CampoProps) {
  return (
    <div className={estilos.campo}>
      <label htmlFor={id}><IconeCampo nome={icone} /> {rotulo}</label>
      <input id={id} name={id} type={tipo} value={valor} onChange={(evento) => onChange(evento.target.value)} placeholder={placeholder} min={min} required={required} />
    </div>
  );
}

type NomeIconeCampo = 'localizacao' | 'municipio' | 'comunidade' | 'pessoa' | 'pessoas' | 'adolescente' | 'crianca' | 'endereco' | 'numero' | 'referencia' | 'calendario';

function IconeCampo({ nome }: { nome: NomeIconeCampo }) {
  const propriedades = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  if (nome === 'localizacao' || nome === 'referencia') {
    return <svg {...propriedades}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  }

  if (nome === 'municipio' || nome === 'comunidade') {
    return <svg {...propriedades}><path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6M7 10h.01M12 10h.01M17 10h.01" /></svg>;
  }

  if (nome === 'pessoa' || nome === 'adolescente' || nome === 'crianca') {
    return <svg {...propriedades}><circle cx="12" cy="7" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>;
  }

  if (nome === 'pessoas') {
    return <svg {...propriedades}><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3 21a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 6" /></svg>;
  }

  if (nome === 'endereco') {
    return <svg {...propriedades}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></svg>;
  }

  if (nome === 'numero') {
    return <svg {...propriedades}><path d="M4 9h16M4 15h16M9 3 7 21M17 3l-2 18" /></svg>;
  }

  return <svg {...propriedades}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
}