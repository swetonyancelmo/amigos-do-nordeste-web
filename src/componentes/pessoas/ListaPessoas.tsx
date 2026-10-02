import { data } from '@/lib/datas';
import type { PessoaResumo } from '@/tipos/dominio';
import styles from '@/app/(app)/pessoas/pessoas.module.css';

type Props = {
  pessoas: PessoaResumo[];
  onAbrir: (id: string) => void;
};

/** A idade vem calculada da API; aqui só se escreve. */
function exibirIdade(pessoa: PessoaResumo) {
  if (pessoa.idade === null) return '—';
  if (pessoa.idadeEstimada) return `${pessoa.idade} anos (estimada)`;
  return `${data(pessoa.dataNascimento)} (${pessoa.idade} anos)`;
}

export function ListaPessoas({ pessoas, onAbrir }: Props) {
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
            <tr key={pessoa.id}>
              <td className={styles.pessoaNome}>{pessoa.nome ?? 'Sem nome'}</td>
              <td className={styles.familiaCelula}>Família de {pessoa.familia.responsavelNome}</td>
              <td>{pessoa.comunidade.nome}</td>
              <td>{exibirIdade(pessoa)}</td>
              <td>
                <div className={styles.badges}>
                  {pessoa.cadastroIncompleto && <span className={`${styles.tag} ${styles['tag--incompleto']}`}>Incompleto</span>}
                  {pessoa.estuda && <span className={`${styles.tag} ${styles['tag--estuda']}`}>Estuda</span>}
                </div>
              </td>
              <td className={styles.acoes}>
                <button type="button" className="botao botao--secundario" onClick={() => onAbrir(pessoa.id)}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
