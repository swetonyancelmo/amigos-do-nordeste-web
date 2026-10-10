import Link from 'next/link';
import type { AvaliacaoVulnerabilidade, ItemExplicacao } from '@/tipos/dominio';
import {
  ANCORA_COMO_CALCULA,
  DADOS_INSUFICIENTES,
  FRASE_SUGESTAO,
  REFERENCIA_INSTRUMENTO,
  campoForaDoFormulario,
  nomeDoCampo,
} from '@/lib/vulnerabilidade';
import { SeloEstrato } from './SeloEstrato';
import styles from './PainelExplicacao.module.css';

/*
 * A justificativa da sugestão de prioridade de UMA família (ADR-0010 da API).
 *
 * Tudo aqui é o que a API devolveu: estrato, rótulo, pontos e o motivo de
 * cada sentinela. Nada é somado nem decidido no front. O escore nunca
 * aparece sozinho: vem sempre com a lista do que o compôs.
 *
 * Três listas, separadas de propósito:
 *  - o que pesou (presentes, com os pontos);
 *  - o que não deu para avaliar (falta dado: NÃO é "não se aplica");
 *  - o que foi avaliado e não se aplica.
 */

const pontos = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

function ListaCampos({ campos }: { campos: string[] }) {
  return (
    <ul className={styles.campos}>
      {campos.map((campo) => (
        <li key={campo}>
          {nomeDoCampo(campo)}
          {campoForaDoFormulario(campo) && (
            <span className={styles.foraDoFormulario}> (ainda não dá para preencher pelo painel)</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Sentinela({ item }: { item: ItemExplicacao }) {
  return (
    <li className={styles.item}>
      <span className={styles.itemNome}>{item.nome}</span>
      {item.pontos !== null && item.constatacao === 'PRESENTE' && (
        <span className={styles.itemPontos}>+{pontos(item.pontos)}</span>
      )}
      {item.detalhe && <span className={styles.itemDetalhe}>{item.detalhe}</span>}
    </li>
  );
}

type Props = {
  avaliacao: AvaliacaoVulnerabilidade;
  familiaId: string;
};

export function PainelExplicacao({ avaliacao, familiaId }: Props) {
  const {
    estrato, rotulo, escore, pontosConfirmados, pontosEmAberto, escoreMaximoAlcancavel,
    sentinelasPresentes, sentinelasAusentes, sentinelasIndeterminadas, camposFaltantes,
  } = avaliacao;
  const incompleto = estrato === DADOS_INSUFICIENTES;
  const algumCampoNoFormulario = camposFaltantes.some((c) => !campoForaDoFormulario(c));

  return (
    <section className={styles.painel} aria-labelledby="titulo-prioridade">
      <h3 id="titulo-prioridade" className={styles.titulo}>Prioridade sugerida</h3>

      <p className={styles.frase}>{FRASE_SUGESTAO}</p>

      <div className={styles.resultado}>
        <SeloEstrato estrato={estrato} rotulo={rotulo} tamanho="grande" />
        {escore !== null && (
          <p className={styles.escore}>
            Soma <strong>{pontos(escore)}</strong> de {escoreMaximoAlcancavel} possíveis
            {sentinelasPresentes.length > 0 ? ', pelos motivos abaixo.' : '.'}
          </p>
        )}
      </div>

      {incompleto && (
        <div className={styles.pendencia}>
          <p className={styles.pendenciaTitulo}>Cadastro incompleto — completar para avaliar</p>
          <p className={styles.pendenciaTexto}>
            Com o que está cadastrado, não dá para saber a prioridade desta família: os dados que faltam
            podem mudar o resultado. Ela não está &quot;sem risco&quot;; ela ainda não foi avaliada.
            {pontosConfirmados > 0 && (
              <> Já soma {pontos(pontosConfirmados)} com o que se sabe, e pode somar até mais {pontosEmAberto}.</>
            )}
          </p>
          <p className={styles.pendenciaTexto}>Falta preencher:</p>
          <ListaCampos campos={camposFaltantes} />
          {algumCampoNoFormulario && (
            <Link href={`/familias/${familiaId}/editar`} className="botao botao--primario">
              Completar cadastro
            </Link>
          )}
        </div>
      )}

      <div className={styles.grupo}>
        <h4 className={styles.subtitulo}>O que pesou</h4>
        {sentinelasPresentes.length === 0 ? (
          <p className={styles.vazio}>Nenhum critério da escala foi encontrado com os dados cadastrados.</p>
        ) : (
          <ul className={styles.lista}>
            {sentinelasPresentes.map((item) => <Sentinela key={item.codigo} item={item} />)}
          </ul>
        )}
      </div>

      {sentinelasIndeterminadas.length > 0 && (
        <div className={styles.grupo}>
          <h4 className={styles.subtitulo}>Não deu para avaliar: falta dado no cadastro</h4>
          <ul className={styles.lista}>
            {sentinelasIndeterminadas.map((item) => <Sentinela key={item.codigo} item={item} />)}
          </ul>
          {!incompleto && (
            <>
              <p className={styles.vazio}>
                Mesmo preenchidos, estes dados não mudariam a prioridade sugerida. Para completar, falta:
              </p>
              <ListaCampos campos={camposFaltantes} />
            </>
          )}
        </div>
      )}

      {sentinelasAusentes.length > 0 && (
        <div className={styles.grupo}>
          <h4 className={styles.subtitulo}>Avaliado e não se aplica</h4>
          <ul className={styles.lista}>
            {sentinelasAusentes.map((item) => <Sentinela key={item.codigo} item={item} />)}
          </ul>
        </div>
      )}

      <p className={styles.instrumento}>
        <strong>Instrumento:</strong> {REFERENCIA_INSTRUMENTO} A avaliação usa só o que o cadastro tem;
        condições de saúde não são coletadas e não entram na conta, então uma família pode precisar de
        apoio por motivos que a escala não vê.{' '}
        <Link href={`/priorizacao#${ANCORA_COMO_CALCULA}`}>Ver a tabela completa de pontos</Link>
      </p>
    </section>
  );
}
