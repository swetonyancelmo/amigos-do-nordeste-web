'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Aviso } from '@/componentes/Aviso';
import { Dado } from '@/componentes/Dados';
import { Carregando, mensagemDeFalha } from '@/componentes/EstadoCarga';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import { ConfirmarAcao } from '@/componentes/ui/confirmar-acao';
import { FalhaAoCarregar } from '@/componentes/ui/falha-ao-carregar';
import { PainelExplicacao } from '@/componentes/vulnerabilidade/PainelExplicacao';
import { api } from '@/lib/api';
import { data } from '@/lib/datas';
import { useMetadados } from '@/lib/metadados';
import type { FamiliaDetalhe, Opcao, Pessoa } from '@/tipos/dominio';

function rotuloDe(lista: Opcao[] | undefined, valor: string | null | undefined) {
  if (!valor) return '';
  return lista?.find((o) => o.valor === valor)?.rotulo ?? valor;
}

/** A idade vem calculada da API; aqui só se diz de onde ela saiu. */
function exibirIdade(pessoa: Pessoa) {
  if (pessoa.idade === null) return '';
  if (pessoa.dataNascimento) return `${pessoa.idade} anos (nasceu em ${data(pessoa.dataNascimento)})`;
  return `uns ${pessoa.idade} anos (estimada)`;
}

const simNao = (v: boolean | null) => (v === null ? 'Não informado' : v ? 'Sim' : 'Não');

const mensagemDeErro = (e: unknown, padrao: string) => (e instanceof Error ? e.message : padrao);

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="border-b pb-2 font-heading text-sm font-extrabold tracking-wide text-primary uppercase">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

const CARTAO = 'grid gap-3 rounded-lg border p-4';
const VAZIO = 'text-sm text-muted-foreground';

/**
 * Tudo o que está cadastrado da família: carrega a ficha ao abrir o modal.
 * Daqui também se inativa e reativa (família não se apaga, issue #43 da API);
 * `onSituacaoMudou` recebe o recado para a lista.
 */
export function DetalhesFamilia({ id, onSituacaoMudou }: { id: string; onSituacaoMudou: (recado: string) => void }) {
  const { metadados } = useMetadados();
  const [ficha, setFicha] = useState<FamiliaDetalhe | null>(null);
  const [erro, setErro] = useState('');
  const [erroSituacao, setErroSituacao] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro('');
    api
      .get<FamiliaDetalhe>(`/familias/${id}`)
      .then((dado) => ativo && setFicha(dado))
      .catch((e) => ativo && setErro(mensagemDeFalha(e, 'Não foi possível carregar a família. Tente de novo.')));
    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  if (erro) return <FalhaAoCarregar mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />;
  if (!ficha) return <Carregando mensagem="Carregando a ficha da família" linhas={6} />;

  const { totais, pessoas, fontesRenda } = ficha;
  const inativar = ficha.ativa;

  async function alternarSituacao() {
    if (!ficha) return;
    setErroSituacao('');
    try {
      await api.post(`/familias/${ficha.id}/${inativar ? 'inativar' : 'reativar'}`);
      onSituacaoMudou(inativar ? 'Família inativada.' : 'Família reativada.');
    } catch (e) {
      setErroSituacao(mensagemDeErro(e, 'Não foi possível mudar a situação da família.'));
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          <ConfirmarAcao
            gatilho={
              <Button
                type="button"
                variant="outline"
                aria-label={`${inativar ? 'Inativar' : 'Reativar'} família de ${ficha.responsavelNome}`}
              >
                {inativar ? 'Inativar' : 'Reativar'}
              </Button>
            }
            titulo={`${inativar ? 'Inativar' : 'Reativar'} a família de ${ficha.responsavelNome}?`}
            descricao={
              inativar
                ? 'Ela sai das listas e dos relatórios, mas não é apagada: dá para reativar depois, em "Incluir inativas".'
                : 'Ela volta para as listas e os relatórios.'
            }
            rotuloConfirmar={inativar ? 'Inativar' : 'Reativar'}
            destrutivo={inativar}
            onConfirmar={alternarSituacao}
          />
          <Button asChild variant="outline">
            <Link href={`/familias/${ficha.id}/editar`} aria-label={`Editar família de ${ficha.responsavelNome}`}>
              Editar
            </Link>
          </Button>
        </div>
        {erroSituacao && <Aviso tom="erro">{erroSituacao}</Aviso>}
      </div>

      {ficha.vulnerabilidade && <PainelExplicacao avaliacao={ficha.vulnerabilidade} familiaId={ficha.id} />}

      <Secao titulo="Família">
        <dl className="dados">
          <Dado rotulo="Responsável">{ficha.responsavelNome}</Dado>
          <Dado rotulo="CPF">{ficha.responsavelCpf}</Dado>
          <Dado rotulo="Telefone">{ficha.telefone}</Dado>
          <Dado rotulo="Situação">{ficha.ativa ? 'Ativa' : 'Inativa'}</Dado>
          <Dado rotulo="Comunidade">{ficha.comunidade.nome}</Dado>
          <Dado rotulo="Município">{ficha.comunidade.municipioNome}</Dado>
          <Dado rotulo="Ponto de referência" larga>
            {ficha.pontoReferencia}
          </Dado>
          {ficha.observacoes && (
            <Dado rotulo="Observações" larga>
              {ficha.observacoes}
            </Dado>
          )}
        </dl>
      </Secao>

      <Secao titulo="Moradia">
        <dl className="dados">
          <Dado rotulo="Abastecimento de água">
            {ficha.abastecimentoAgua.map((v) => rotuloDe(metadados?.abastecimentoAgua, v)).join(', ')}
          </Dado>
          <Dado rotulo="Tratamento da água">{rotuloDe(metadados?.tratamentoAgua, ficha.tratamentoAgua)}</Dado>
          <Dado rotulo="Tem banheiro">{simNao(ficha.temBanheiro)}</Dado>
          <Dado rotulo="Escoamento sanitário">
            {rotuloDe(metadados?.escoamentoSanitario, ficha.escoamentoSanitario)}
          </Dado>
        </dl>
      </Secao>

      <Secao titulo="Totais">
        <div className="grid grid-cols-5 gap-2 celular:grid-cols-2">
          {[
            ['Pessoas', totais.totalPessoas],
            ['Até 12 anos', totais.totalAte12Anos],
            ['13 a 59 anos', totais.totalDe13A59Anos],
            ['60 anos ou mais', totais.total60AnosOuMais],
            ['Sem idade', totais.totalSemIdadeConhecida],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-lg border px-2 py-3 text-center">
              <span className="block font-heading text-2xl font-extrabold text-primary">{valor}</span>
              <span className="text-[0.8rem] text-muted-foreground">{rotulo}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo={`Pessoas (${pessoas.length})`}>
        {pessoas.length === 0 ? (
          <p className={VAZIO}>Nenhuma pessoa cadastrada.</p>
        ) : (
          <div className="grid gap-3">
            {pessoas.map((pessoa) => (
              <article key={pessoa.id} className={CARTAO}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-heading text-base font-extrabold text-foreground">{pessoa.nome ?? 'Sem nome'}</span>
                  <div className="flex flex-wrap gap-2">
                    {pessoa.cadastroIncompleto && <Badge variant="destructive">Incompleto</Badge>}
                    {pessoa.estuda && (
                      <Badge variant="outline" className="border-success/40 bg-success-foreground text-success">
                        Estuda
                      </Badge>
                    )}
                    {pessoa.gestante && (
                      <Badge variant="outline" className="border-warning/40 bg-warning-foreground text-warning">
                        Gestante
                      </Badge>
                    )}
                  </div>
                </div>
                <dl className="dados">
                  <Dado rotulo="Parentesco">{rotuloDe(metadados?.parentesco, pessoa.parentesco)}</Dado>
                  <Dado rotulo="Sexo">{rotuloDe(metadados?.sexo, pessoa.sexo)}</Dado>
                  <Dado rotulo="Idade">{exibirIdade(pessoa)}</Dado>
                  <Dado rotulo="Série">
                    {pessoa.estuda === false ? 'Não estuda' : rotuloDe(metadados?.serie, pessoa.serie)}
                  </Dado>
                  <Dado rotulo="Tamanho da roupa">{rotuloDe(metadados?.tamanhoRoupa, pessoa.tamanhoRoupa)}</Dado>
                  <Dado rotulo="Número do calçado">{pessoa.numeroCalcado}</Dado>
                  {pessoa.observacoes && (
                    <Dado rotulo="Observações" larga>
                      {pessoa.observacoes}
                    </Dado>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="Renda">
        <dl className="dados">
          <Dado rotulo="Quanto entra por mês, somando tudo" larga>
            {rotuloDe(metadados?.faixaRenda, ficha.faixaRenda)}
          </Dado>
        </dl>
        {fontesRenda.length === 0 ? (
          <p className={VAZIO}>Nenhuma fonte de renda cadastrada.</p>
        ) : (
          <div className="grid gap-3">
            {fontesRenda.map((renda) => (
              <article key={renda.id} className={CARTAO}>
                <dl className="dados">
                  <Dado rotulo="De onde vem">{rotuloDe(metadados?.tipoFonteRenda, renda.tipo)}</Dado>
                  <Dado rotulo="Quem recebe">
                    {renda.pessoaId === null
                      ? 'A família'
                      : (pessoas.find((p) => p.id === renda.pessoaId)?.nome ?? 'Sem nome')}
                  </Dado>
                  {renda.observacao && (
                    <Dado rotulo="Observação" larga>
                      {renda.observacao}
                    </Dado>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}
      </Secao>
    </div>
  );
}
