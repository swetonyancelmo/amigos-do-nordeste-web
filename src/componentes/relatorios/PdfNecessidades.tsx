import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Sem isso o react-pdf hifeniza em inglês e quebra "COMU-NIDADE", "to-tal".
Font.registerHyphenationCallback((palavra) => [palavra]);

/**
 * O relatório de necessidades em PDF, pronto para mandar para prefeitura,
 * edital ou doador. Só números agregados: nenhum nome, CPF ou endereço de
 * família entra aqui.
 *
 * Carregado sob demanda por `gerarPdfNecessidades` (a biblioteca é pesada e
 * só faz sentido no clique de "Exportar PDF").
 */

/** Cores lidas dos tokens do globals.css na hora de gerar: o PDF não enxerga var(--x). */
export type CoresPdf = {
  laranja: string;
  laranjaEscuro: string;
  laranjaClaro: string;
  ambar: string;
  ambarClaro: string;
  verde: string;
  verdeClaro: string;
  textoForte: string;
  textoMedio: string;
  linha: string;
  pagina: string;
};

export type LinhaTabela = { rotulo: string; valor: number; parte: number };

export type DadosPdfNecessidades = {
  logo: string;
  geradoEm: string;
  comunidade: string;
  municipio: string;
  publico: string;
  tituloRoupa: string;
  resumo: { rotulo: string; valor: string; apoio?: string }[];
  roupa: LinhaTabela[];
  calcado: LinhaTabela[];
  semTamanho: number;
  semCalcado: number;
  totalFamilias: number;
  situacao: (LinhaTabela & { tom: 'laranja' | 'ambar' | 'verde' })[];
  completude: { rotulo: string; tem: number; de: number; parte: number }[];
};

const numero = (valor: number) => valor.toLocaleString('pt-BR');
const porcento = (valor: number) => `${Math.round(valor)}%`;

function estilosCom(c: CoresPdf) {
  return StyleSheet.create({
    pagina: {
      paddingTop: 28,
      paddingBottom: 64,
      paddingHorizontal: 32,
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: c.textoForte,
    },

    cabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.linha,
    },
    logo: { width: 58, height: 58, objectFit: 'contain' },
    titulos: { flex: 1, marginLeft: 14 },
    titulo: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: c.textoForte },
    subtitulo: { marginTop: 3, fontSize: 9, color: c.textoMedio },
    divisor: { width: 1, height: 36, backgroundColor: c.linha, marginHorizontal: 14 },
    municipio: { width: 130, fontSize: 9, color: c.textoMedio, textTransform: 'uppercase' },

    identificacao: {
      marginTop: 10,
      marginBottom: 12,
      fontSize: 9,
      color: c.textoForte,
      textTransform: 'uppercase',
    },

    resumos: { flexDirection: 'row', marginBottom: 14 },
    resumo: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: c.linha,
      borderTopWidth: 3,
      borderTopColor: c.ambar,
      borderRadius: 4,
    },
    resumoEspaco: { marginLeft: 8 },
    resumoRotulo: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.textoMedio, textTransform: 'uppercase' },
    resumoValor: { marginTop: 2, fontSize: 16, fontFamily: 'Helvetica-Bold' },
    resumoApoio: { marginTop: 1, fontSize: 7, color: c.textoMedio },

    secao: { marginBottom: 14 },
    secaoTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 4 },

    duasColunas: { flexDirection: 'row' },
    coluna: { flex: 1 },
    colunaEspaco: { marginLeft: 12 },

    tabela: { borderWidth: 1, borderColor: c.linha },
    linhaCabecalho: { flexDirection: 'row', backgroundColor: c.laranjaClaro },
    celulaCabecalho: { paddingVertical: 5, paddingHorizontal: 6, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
    linha: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.linha },
    linhaZebra: { backgroundColor: c.pagina },
    celula: { paddingVertical: 4, paddingHorizontal: 6 },
    linhaTotal: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.textoMedio },
    negrito: { fontFamily: 'Helvetica-Bold' },

    colRotulo: { flex: 1 },
    colValor: { width: 62, textAlign: 'center' },
    colParte: { width: 64, textAlign: 'center' },

    nota: { marginTop: 4, fontSize: 7.5, color: c.textoMedio },

    legenda: { marginTop: 4 },
    legendaTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    legendaItem: { fontSize: 8, color: c.textoMedio, marginBottom: 1 },

    rodape: {
      position: 'absolute',
      left: 32,
      right: 32,
      bottom: 22,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: c.linha,
      fontSize: 7.5,
      color: c.textoMedio,
    },
    rodapeLado: { width: 140 },
    rodapeCentro: { flex: 1, textAlign: 'center' },
    rodapePagina: { width: 140, textAlign: 'right' },
  });
}

export function PdfNecessidades({ dados, cores }: { dados: DadosPdfNecessidades; cores: CoresPdf }) {
  const e = estilosCom(cores);
  const corDoTom = { laranja: cores.laranjaEscuro, ambar: cores.laranjaEscuro, verde: cores.verde };

  function Tabela({ cabecalho, linhas, unidade, total }: {
    cabecalho: [string, string, string];
    linhas: LinhaTabela[];
    unidade?: string;
    total?: number;
  }) {
    return (
      <View style={e.tabela}>
        <View style={e.linhaCabecalho}>
          <Text style={[e.celulaCabecalho, e.colRotulo]}>{cabecalho[0]}</Text>
          <Text style={[e.celulaCabecalho, e.colValor]}>{cabecalho[1]}</Text>
          <Text style={[e.celulaCabecalho, e.colParte]}>{cabecalho[2]}</Text>
        </View>
        {linhas.length === 0 && (
          <View style={e.linha}>
            <Text style={[e.celula, e.colRotulo, { color: cores.textoMedio }]}>Nada informado neste filtro.</Text>
          </View>
        )}
        {linhas.map((linha, i) => (
          <View key={linha.rotulo} style={i % 2 === 1 ? [e.linha, e.linhaZebra] : e.linha} wrap={false}>
            <Text style={[e.celula, e.colRotulo]}>{linha.rotulo}</Text>
            <Text style={[e.celula, e.colValor, e.negrito]}>{numero(linha.valor)}</Text>
            <Text style={[e.celula, e.colParte, { color: cores.textoMedio }]}>{porcento(linha.parte)}</Text>
          </View>
        ))}
        {total !== undefined && (
          <View style={e.linhaTotal}>
            <Text style={[e.celula, e.colRotulo, e.negrito]}>Total{unidade ? ` (${unidade})` : ''}</Text>
            <Text style={[e.celula, e.colValor, e.negrito]}>{numero(total)}</Text>
            <Text style={[e.celula, e.colParte]}>100%</Text>
          </View>
        )}
      </View>
    );
  }

  const soma = (linhas: LinhaTabela[]) => linhas.reduce((t, l) => t + l.valor, 0);

  return (
    <Document
      title={`Necessidades — ${dados.comunidade}`}
      author="Associação Amigos do Nordeste"
      subject="Relatório de necessidades da comunidade"
      language="pt-BR"
    >
      <Page size="A4" style={e.pagina}>
        {/* ------------------------------------------------ cabeçalho */}
        <View style={e.cabecalho} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt */}
          <Image src={dados.logo} style={e.logo} />
          <View style={e.titulos}>
            <Text style={e.titulo}>RELATÓRIO DE NECESSIDADES DA COMUNIDADE</Text>
            <Text style={e.subtitulo}>Associação Amigos do Nordeste · Sertão do Moxotó — PE</Text>
          </View>
          <View style={e.divisor} />
          <Text style={e.municipio}>Município: {dados.municipio}</Text>
        </View>

        <Text style={e.identificacao}>
          Comunidade: {dados.comunidade}   |   Faixa etária: {dados.publico}   |   Famílias ativas: {numero(dados.totalFamilias)}
        </Text>

        {/* ---------------------------------------------------- resumo */}
        <View style={e.resumos} wrap={false}>
          {dados.resumo.map((r, i) => (
            <View key={r.rotulo} style={i > 0 ? [e.resumo, e.resumoEspaco] : e.resumo}>
              <Text style={e.resumoRotulo}>{r.rotulo}</Text>
              <Text style={e.resumoValor}>{r.valor}</Text>
              {r.apoio && <Text style={e.resumoApoio}>{r.apoio}</Text>}
            </View>
          ))}
        </View>

        {/* ------------------------------------------ lista de compras */}
        <View style={[e.secao, e.duasColunas]}>
          <View style={e.coluna}>
            <Text style={e.secaoTitulo}>{dados.tituloRoupa} — peças por tamanho</Text>
            <Tabela cabecalho={['Tamanho', 'Peças', '%']} linhas={dados.roupa} unidade="peças" total={soma(dados.roupa)} />
            {dados.semTamanho > 0 && (
              <Text style={e.nota}>+ {numero(dados.semTamanho)} sem tamanho informado (fora da conta)</Text>
            )}
          </View>
          <View style={[e.coluna, e.colunaEspaco]}>
            <Text style={e.secaoTitulo}>Calçado — pares por numeração</Text>
            <Tabela cabecalho={['Numeração', 'Pares', '%']} linhas={dados.calcado} unidade="pares" total={soma(dados.calcado)} />
            {dados.semCalcado > 0 && (
              <Text style={e.nota}>+ {numero(dados.semCalcado)} sem numeração informada (fora da conta)</Text>
            )}
          </View>
        </View>

        {/* -------------------------------------------------- situação */}
        <View style={e.secao} wrap={false}>
          <Text style={e.secaoTitulo}>Situação das famílias</Text>
          <View style={e.tabela}>
            <View style={e.linhaCabecalho}>
              <Text style={[e.celulaCabecalho, e.colRotulo]}>Indicador</Text>
              <Text style={[e.celulaCabecalho, e.colValor]}>Famílias</Text>
              <Text style={[e.celulaCabecalho, e.colParte]}>% do total</Text>
            </View>
            {dados.situacao.map((linha, i) => (
              <View key={linha.rotulo} style={i % 2 === 1 ? [e.linha, e.linhaZebra] : e.linha}>
                <Text style={[e.celula, e.colRotulo]}>{linha.rotulo}</Text>
                {/* Zero não é alerta: sai na cor neutra. */}
                <Text style={[e.celula, e.colValor, e.negrito, { color: linha.valor > 0 ? corDoTom[linha.tom] : cores.textoMedio }]}>
                  {numero(linha.valor)}
                </Text>
                <Text style={[e.celula, e.colParte, { color: linha.valor > 0 ? corDoTom[linha.tom] : cores.textoMedio }]}>
                  {porcento(linha.parte)}
                </Text>
              </View>
            ))}
            <View style={e.linhaTotal}>
              <Text style={[e.celula, e.colRotulo, e.negrito]}>Famílias ativas no filtro</Text>
              <Text style={[e.celula, e.colValor, e.negrito]}>{numero(dados.totalFamilias)}</Text>
              <Text style={[e.celula, e.colParte]}>100%</Text>
            </View>
          </View>
        </View>

        {/* --------------------------------------- qualidade do cadastro */}
        <View style={e.secao} wrap={false}>
          <Text style={e.secaoTitulo}>Qualidade do cadastro</Text>
          <View style={e.tabela}>
            <View style={e.linhaCabecalho}>
              <Text style={[e.celulaCabecalho, e.colRotulo]}>Dado</Text>
              <Text style={[e.celulaCabecalho, e.colValor]}>Informado</Text>
              <Text style={[e.celulaCabecalho, e.colParte]}>%</Text>
            </View>
            {dados.completude.map((linha, i) => (
              <View key={linha.rotulo} style={i % 2 === 1 ? [e.linha, e.linhaZebra] : e.linha}>
                <Text style={[e.celula, e.colRotulo]}>{linha.rotulo}</Text>
                <Text style={[e.celula, e.colValor]}>{numero(linha.tem)} de {numero(linha.de)}</Text>
                <Text style={[e.celula, e.colParte, e.negrito, {
                  color: linha.parte >= 90 ? cores.verde : cores.laranjaEscuro,
                }]}
                >
                  {porcento(linha.parte)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* --------------------------------------------------- legenda */}
        <View style={e.legenda} wrap={false}>
          <Text style={e.legendaTitulo}>Como ler este relatório</Text>
          <Text style={e.legendaItem}>
            · As contagens são feitas pelo sistema no momento da extração; famílias inativas não entram.
          </Text>
          <Text style={e.legendaItem}>
            · Peças e pares contam só quem tem tamanho ou numeração preenchidos; os demais aparecem à parte.
          </Text>
          <Text style={e.legendaItem}>
            · Na faixa &quot;Crianças até 12 anos&quot;, quem está sem data de nascimento nem idade estimada não entra.
          </Text>
        </View>

        {/* ---------------------------------------------------- rodapé */}
        <View style={e.rodape} fixed>
          <Text style={e.rodapeLado}>EXTRAÍDO EM: {dados.geradoEm}</Text>
          <Text style={e.rodapeCentro}>Associação Amigos do Nordeste · Cadastro de Famílias</Text>
          <Text
            style={e.rodapePagina}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
