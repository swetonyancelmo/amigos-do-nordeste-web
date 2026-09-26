'use client';

import { useMemo, useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { useCabecalho } from '@/componentes/ContextoCabecalho';
import { ListaPessoas } from '@/componentes/pessoas/ListaPessoas';
import { ModalPessoa, type PessoaFormulario } from '@/componentes/pessoas/ModalPessoa';
import styles from './pessoas.module.css';

function IconeFiltro({ tipo }: { tipo: 'busca' | 'comunidade' | 'status' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {tipo === 'busca' && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>}
      {tipo === 'comunidade' && <><path d="m3 11 9-7 9 7" /><path d="M5 10v9h14v-9M9 19v-5h6v5" /></>}
      {tipo === 'status' && <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>}
    </svg>
  );
}

const pessoasIniciais: PessoaFormulario[] = [
  {
    id: 'p-1',
    nome: 'Maria da Silva',
    sexo: 'F',
    dataNascimento: '2014-05-11',
    idadeEstimada: '',
    parentesco: 'FILHA',
    estuda: true,
    serie: 'FUNDAMENTAL_1',
    tamanhoRoupa: 'M',
    numeroCalcado: '31',
    gestante: false,
    observacoes: 'Participa do acompanhamento escolar da comunidade.',
    familia: 'Família da Joana',
    comunidade: 'Jeritacó',
    cadastroIncompleto: false,
  },
  {
    id: 'p-2',
    nome: 'João Pereira',
    sexo: 'M',
    dataNascimento: '',
    idadeEstimada: '11',
    parentesco: 'FILHO',
    estuda: false,
    serie: '',
    tamanhoRoupa: 'G',
    numeroCalcado: '33',
    gestante: false,
    observacoes: 'Falta confirmar a data de nascimento com a responsável.',
    familia: 'Família da Joana',
    comunidade: 'Jeritacó',
    cadastroIncompleto: true,
  },
];

export default function PessoasPage() {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<PessoaFormulario[]>(pessoasIniciais);
  const acoes = useMemo(
    () => <Botao onClick={() => setAberto(true)}>Nova pessoa</Botao>,
    [],
  );

  useCabecalho('Pessoas', acoes);

  function handleSalvar(pessoa: PessoaFormulario) {
    setLista((atual) => [pessoa, ...atual]);
    setAberto(false);
  }

  return (
    <main className={`${styles.pagina} pagina-pessoas`}>
      <section className={styles.conteudo}>
        <div className={styles.toolbar}>
          <div className={styles.busca}>
            <label className={styles.filtroRotulo} htmlFor="buscar-pessoa">
              <IconeFiltro tipo="busca" />
              Buscar por nome
            </label>
            <input id="buscar-pessoa" className={styles.filtroEntrada} placeholder="Digite o nome" />
          </div>

          <div className={styles.filtrosInline}>
            <label className={styles.filtroCampo}>
              <span className={styles.filtroRotulo}><IconeFiltro tipo="comunidade" /> Comunidade</span>
              <select className={`${styles.filtroEntrada} ${styles.select}`} defaultValue="">
              <option value="">Todas as comunidades</option>
              <option value="jeritaco">Jeritacó</option>
              <option value="mulungu">Mulungu</option>
              </select>
            </label>

            <label className={styles.filtroCampo}>
              <span className={styles.filtroRotulo}><IconeFiltro tipo="status" /> Status</span>
              <select className={`${styles.filtroEntrada} ${styles.select}`} defaultValue="">
              <option value="">Todos os status</option>
              <option value="incompleto">Cadastro incompleto</option>
              <option value="completo">Completo</option>
              </select>
            </label>
          </div>
        </div>

        <ListaPessoas pessoas={lista} />

        <nav className={styles.paginacao} aria-label="Paginação da lista de pessoas">
          <span className={styles.contadorPagina}>Página 1 de 1</span>

          <div className={styles.controlesPagina}>
            <button type="button" className={styles.botaoPagina} disabled aria-label="Página anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Anterior
            </button>
            <button type="button" className={styles.botaoPagina} disabled aria-label="Próxima página">
              Próxima
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </nav>
      </section>

      <ModalPessoa
        aberto={aberto}
        onFechar={() => setAberto(false)}
        onSalvar={handleSalvar}
      />
    </main>
  );
}
