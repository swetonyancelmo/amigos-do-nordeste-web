'use client';

import { useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { ListaPessoas } from '@/componentes/pessoas/ListaPessoas';
import { ModalPessoa, type PessoaFormulario } from '@/componentes/pessoas/ModalPessoa';
import styles from './pessoas.module.css';

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

  function handleSalvar(pessoa: PessoaFormulario) {
    setLista((atual) => [pessoa, ...atual]);
    setAberto(false);
  }

  return (
    <main className={styles.pagina}>
      <section className="cartao" style={{ padding: 24 }}>
        <header className={styles.cabecalho}>
          <div>
            <p className={styles.chamada}>Cadastro social</p>
            <h1 className={styles.titulo}>Pessoas atendidas</h1>
          </div>

          <Botao onClick={() => setAberto(true)}>Nova pessoa</Botao>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.busca}>
            <label className="campo__rotulo" htmlFor="buscar-pessoa">
              Buscar por nome
            </label>
            <input id="buscar-pessoa" className="campo__entrada" placeholder="Digite o nome" />
          </div>

          <div className={styles.filtrosInline}>
            <select className="campo__entrada" defaultValue="">
              <option value="">Todas as comunidades</option>
              <option value="jeritaco">Jeritacó</option>
              <option value="mulungu">Mulungu</option>
            </select>

            <select className="campo__entrada" defaultValue="">
              <option value="">Todos os status</option>
              <option value="incompleto">Cadastro incompleto</option>
              <option value="completo">Completo</option>
            </select>
          </div>
        </div>

        <ListaPessoas pessoas={lista} />
      </section>

      <ModalPessoa
        aberto={aberto}
        onFechar={() => setAberto(false)}
        onSalvar={handleSalvar}
      />
    </main>
  );
}
