type PessoaResumo = {
  id?: string;
  nome: string;
  familia: string;
  comunidade: string;
  dataNascimento?: string;
  idadeEstimada?: string;
  cadastroIncompleto: boolean;
  estuda: boolean;
  gestante: boolean;
};

type Props = {
  pessoas: PessoaResumo[];
};

import styles from '@/app/(app)/pessoas/pessoas.module.css';

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function calcularIdade(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;

  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
    idade -= 1;
  }

  return idade;
}

function exibirIdade(pessoa: PessoaResumo) {
  if (pessoa.dataNascimento) {
    return `${formatarData(pessoa.dataNascimento)} (${calcularIdade(pessoa.dataNascimento)} anos)`;
  }

  return pessoa.idadeEstimada ? `${pessoa.idadeEstimada} anos (estimada)` : '—';
}

export function ListaPessoas({ pessoas }: Props) {
  return (
    <div className={styles.tabelaRolagem}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Pessoa</th>
            <th>Família</th>
            <th>Comunidade</th>
            <th>Idade</th>
            <th>Status</th>
            <th><span className={styles.somenteLeitor}>Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {pessoas.map((pessoa) => (
            <tr key={pessoa.id ?? pessoa.nome}>
              <td className={styles.pessoaNome}>{pessoa.nome}</td>
              <td className={styles.familiaCelula}>{pessoa.familia}</td>
              <td>{pessoa.comunidade}</td>
              <td>{exibirIdade(pessoa)}</td>
              <td>
                <div className={styles.badges}>
                  {pessoa.cadastroIncompleto && <span className={`${styles.tag} ${styles['tag--incompleto']}`}>Incompleto</span>}
                  {pessoa.estuda && <span className={`${styles.tag} ${styles['tag--estuda']}`}>Estuda</span>}
                  {pessoa.gestante && <span className={`${styles.tag} ${styles['tag--gestante']}`}>Gestante</span>}
                </div>
              </td>
              <td className={styles.acoes}>
                <button type="button" className="botao botao--secundario">Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
