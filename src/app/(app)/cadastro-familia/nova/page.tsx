"use client";

import { useMemo, useState } from "react";
import {
  MapPin,
  Building2,
  User,
  Users,
  Phone,
  FileText,
  Compass,
  Calendar,
  GraduationCap,
  Shirt,
  Footprints,
  Droplets,
  Home,
  DollarSign,
  Plus,
} from "lucide-react";

import { useMetadados } from "@/lib/metadados";
import type { FaixaRenda, Opcao } from "@/tipos/dominio";

interface Membro {
  id: string;
  nome: string;
  sexo: string;
  dataNascimento: string;
  serie: string;
  tamanhoRoupa: string;
  numeroCalcado: string;
}

interface FonteRenda {
  id: string;
  tipo: string;
  quemRecebe: string;
  faixa: string;
  faixaEditada: boolean; // true quando o usuário mexeu na faixa manualmente
  observacao: string;
}

const gerarId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const novoMembro = (): Membro => ({
  id: gerarId(),
  nome: "",
  sexo: "",
  dataNascimento: "",
  serie: "",
  tamanhoRoupa: "",
  numeroCalcado: "",
});

const novaRenda = (): FonteRenda => ({
  id: gerarId(),
  tipo: "",
  quemRecebe: "",
  faixa: "",
  faixaEditada: false,
  observacao: "",
});

// ---------------------------------------------------------------------------
// Opções extras dos selects, pensadas na realidade das famílias do interior.
// Elas se juntam ao que vem de GET /api/metadados (a API tem prioridade nos
// rótulos). ATENÇÃO: o backend só aceita valores que existam nos enums dele —
// opções novas precisam ser cadastradas lá também.
// ---------------------------------------------------------------------------
const TEXTOS_RENDA = [
  "Bolsa Família",
  "BPC",
  "Aposentadoria",
  "Aposentadoria rural",
  "Pensão",
  "Pensão por morte",
  "Auxílio-doença",
  "Salário-maternidade",
  "Seguro-defeso",
  "Garantia-Safra",
  "Bolsa Estiagem",
  "Programa estadual ou municipal",
  "Trabalho fixo",
  "Trabalho sazonal",
  "Trabalho informal",
  "Agricultura de subsistência",
  "Venda de produtos da roça",
  "Pesca artesanal",
  "Criação de animais",
  "Artesanato",
  "Diarista ou doméstica",
  "Construção civil",
  "Comércio informal",
  "Ajuda de familiares",
  "Doações",
  "Nenhuma",
  "Outra",
];

// Valores iguais aos enums da API (TamanhoRoupa); os que não existem lá (INFANTIL_16,
// ADULTO_G1..G3) são novos. Na ordem convencional: bebê, infantil, adulto, plus size.
const OPCOES_ROUPA: Opcao[] = [
  { valor: "RN", rotulo: "RN (recém-nascido)" },
  { valor: "BEBE_P", rotulo: "Bebê P" },
  { valor: "BEBE_M", rotulo: "Bebê M" },
  { valor: "BEBE_G", rotulo: "Bebê G" },
  { valor: "INFANTIL_2", rotulo: "Infantil 2" },
  { valor: "INFANTIL_4", rotulo: "Infantil 4" },
  { valor: "INFANTIL_6", rotulo: "Infantil 6" },
  { valor: "INFANTIL_8", rotulo: "Infantil 8" },
  { valor: "INFANTIL_10", rotulo: "Infantil 10" },
  { valor: "INFANTIL_12", rotulo: "Infantil 12" },
  { valor: "INFANTIL_14", rotulo: "Infantil 14" },
  { valor: "INFANTIL_16", rotulo: "Infantil 16" },
  { valor: "ADULTO_PP", rotulo: "Adulto PP" },
  { valor: "ADULTO_P", rotulo: "Adulto P" },
  { valor: "ADULTO_M", rotulo: "Adulto M" },
  { valor: "ADULTO_G", rotulo: "Adulto G" },
  { valor: "ADULTO_GG", rotulo: "Adulto GG" },
  { valor: "ADULTO_XG", rotulo: "Adulto XG" },
  { valor: "ADULTO_XGG", rotulo: "Adulto XGG" },
  { valor: "ADULTO_G1", rotulo: "Adulto G1 (plus size)" },
  { valor: "ADULTO_G2", rotulo: "Adulto G2 (plus size)" },
  { valor: "ADULTO_G3", rotulo: "Adulto G3 (plus size)" },
];

// Calçado em pares de dois dígitos: 15/16, 17/18 ... 45/46
const TEXTOS_CALCADO = Array.from(
  { length: 16 },
  (_, i) => `${15 + i * 2}/${16 + i * 2}`,
);

// Séries agrupadas por etapa de ensino (valores ANO_1..ANO_9, PRE, ENSINO_MEDIO e
// NAO_SE_APLICA já existem na API; os demais são novos).
const GRUPOS_SERIE: { titulo: string; itens: Opcao[] }[] = [
  {
    titulo: "Educação infantil",
    itens: [
      { valor: "CRECHE", rotulo: "Creche" },
      { valor: "PRE", rotulo: "Pré-escola" },
    ],
  },
  {
    titulo: "Ensino fundamental",
    itens: Array.from({ length: 9 }, (_, i) => ({
      valor: `ANO_${i + 1}`,
      rotulo: `${i + 1}º ano`,
    })),
  },
  {
    titulo: "Ensino médio",
    itens: [
      { valor: "ENSINO_MEDIO_1_ANO", rotulo: "1º ano" },
      { valor: "ENSINO_MEDIO_2_ANO", rotulo: "2º ano" },
      { valor: "ENSINO_MEDIO_3_ANO", rotulo: "3º ano" },
      { valor: "ENSINO_MEDIO", rotulo: "Ensino médio (ano não informado)" },
    ],
  },
  {
    titulo: "EJA (Educação de Jovens e Adultos)",
    itens: [
      { valor: "ALFABETIZACAO_DE_ADULTOS", rotulo: "Alfabetização de adultos" },
      { valor: "EJA_ENSINO_FUNDAMENTAL", rotulo: "EJA - Ensino fundamental" },
      { valor: "EJA_ENSINO_MEDIO", rotulo: "EJA - Ensino médio" },
    ],
  },
  {
    titulo: "Técnico e superior",
    itens: [
      { valor: "CURSO_TECNICO", rotulo: "Curso técnico" },
      { valor: "ENSINO_SUPERIOR", rotulo: "Ensino superior" },
    ],
  },
  {
    titulo: "Outros",
    itens: [{ valor: "NAO_SE_APLICA", rotulo: "Não se aplica" }],
  },
];

/** Aplica os rótulos da API e põe em "Outros" qualquer série que a API tenha e a lista não. */
function agruparSeries(api: Opcao[] | undefined) {
  const rotuloDaApi = new Map((api ?? []).map((o) => [o.valor, o.rotulo]));
  const conhecidos = new Set(
    GRUPOS_SERIE.flatMap((g) => g.itens.map((o) => o.valor)),
  );
  const extrasDaApi = (api ?? []).filter((o) => !conhecidos.has(o.valor));
  return GRUPOS_SERIE.map((g) => ({
    titulo: g.titulo,
    itens: [
      ...g.itens.map((o) => ({
        valor: o.valor,
        rotulo: rotuloDaApi.get(o.valor) ?? o.rotulo,
      })),
      ...(g.titulo === "Outros" ? extrasDaApi : []),
    ].sort(porRotulo),
  })).sort((a, b) => porRotulo({ rotulo: a.titulo }, { rotulo: b.titulo }));
}

// Ordem alfanumérica pelo rótulo, com números em ordem natural (2 vem antes de 10).
const porRotulo = (a: { rotulo: string }, b: { rotulo: string }) =>
  a.rotulo.localeCompare(b.rotulo, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });

// "Auxílio-doença" -> "AUXILIO_DOENCA" (mesmo padrão dos enums da API)
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Junta a lista da API com a lista local, sem repetir valores.
 * `ordem`: "locais" segue a ordem da lista local (e a API completa o resto);
 *          "api" mantém a ordem da API e acrescenta as locais no fim.
 * `ultimos`: valores que ficam sempre no final (ex.: "Outra", "Nenhuma").
 */
function mesclarOpcoes(
  api: Opcao[] | undefined,
  locais: Opcao[],
  ordem: "locais" | "api",
  ultimos: string[] = [],
): Opcao[] {
  const daApi = api ?? [];
  const rotuloDaApi = new Map(daApi.map((o) => [o.valor, o.rotulo]));
  const doLocal = locais.map((o) => ({
    valor: o.valor,
    rotulo: rotuloDaApi.get(o.valor) ?? o.rotulo,
  }));
  const valoresLocais = new Set(doLocal.map((o) => o.valor));
  const soDaApi = daApi.filter((o) => !valoresLocais.has(o.valor));
  const valoresApi = new Set(daApi.map((o) => o.valor));
  const soLocais = doLocal.filter((o) => !valoresApi.has(o.valor));

  const lista =
    ordem === "locais" ? [...doLocal, ...soDaApi] : [...daApi, ...soLocais];
  return [
    ...lista.filter((o) => !ultimos.includes(o.valor)),
    ...lista.filter((o) => ultimos.includes(o.valor)),
  ];
}

const opcoesRendaLocais: Opcao[] = TEXTOS_RENDA.map((t) => ({
  valor: normalizar(t),
  rotulo: t,
}));
const opcoesRoupaLocais: Opcao[] = OPCOES_ROUPA;
const opcoesCalcadoLocais: Opcao[] = TEXTOS_CALCADO.map((t) => ({
  valor: t,
  rotulo: t,
}));
// O calçado usa só os pares acima (não mistura com a lista de números soltos da API).
const opcoesCalcado = opcoesCalcadoLocais;
// Faixa que já é conhecida a partir do tipo de renda (o usuário pode alterar).
const FAIXA_SUGERIDA: Record<string, FaixaRenda> = {
  NENHUMA: "SEM_RENDA_FIXA",
  BPC: "ATE_1_SALARIO",
  BOLSA_FAMILIA: "ATE_1_SALARIO",
  SEGURO_DEFESO: "ATE_1_SALARIO",
  GARANTIA_SAFRA: "ATE_1_SALARIO",
  BOLSA_ESTIAGEM: "ATE_1_SALARIO",
};

// Idade calculada pela data de nascimento (recalcula sozinha a cada dia).
function calcularIdade(dataNascimento: string): number | null {
  if (!dataNascimento) return null;
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const jaFezAniversario =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() >= nascimento.getDate());
  if (!jaFezAniversario) idade -= 1;
  return idade >= 0 ? idade : null;
}

const estiloCampo = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
} as const;

const estiloBotaoAdicionar = {
  color: "#ea580c",
  border: "1px solid #fdba74",
  padding: "6px 12px",
  borderRadius: "6px",
  background: "#fff",
  cursor: "pointer",
  fontSize: "0.875rem",
  display: "flex",
  alignItems: "center",
  gap: "4px",
} as const;

const estiloBotaoRemover = {
  border: "1px solid #fecaca",
  background: "#fff",
  color: "#b91c1c",
  borderRadius: "6px",
  padding: "4px 10px",
  fontSize: "0.75rem",
  cursor: "pointer",
} as const;

export default function NovaFamiliaPage() {
  // Dados Básicos
  const [municipio, setMunicipio] = useState("");
  const [comunidade, setComunidade] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [pontoReferencia, setPontoReferencia] = useState("");

  // Moradia
  const [abastecimento, setAbastecimento] = useState<string[]>([]);
  const [temBanheiro, setTemBanheiro] = useState("Sim");
  const [escoamento, setEscoamento] = useState("Rede de esgoto");
  const [tratamentoAgua, setTratamentoAgua] = useState("Cloração");

  const { metadados } = useMetadados();

  const opcoesRenda = useMemo(
    () =>
      mesclarOpcoes(
        metadados?.tipoFonteRenda,
        opcoesRendaLocais,
        "locais",
      ).sort(porRotulo),
    [metadados],
  );
  // Tamanho de roupa segue a ordem convencional (RN, infantil, PP...XGG, plus size),
  // não a alfabética.
  const opcoesRoupa = useMemo(
    () => mesclarOpcoes(metadados?.tamanhoRoupa, opcoesRoupaLocais, "locais"),
    [metadados],
  );
  const gruposSerie = useMemo(
    () => agruparSeries(metadados?.serie),
    [metadados],
  );

  // Membros e rendas (uma linha em branco para começar)
  const [membros, setMembros] = useState<Membro[]>(() => [novoMembro()]);
  const [rendas, setRendas] = useState<FonteRenda[]>(() => [novaRenda()]);

  const [salvando, setSalvando] = useState(false);

  const rotuloFaixa = (valor: FaixaRenda) =>
    metadados?.faixaRenda.find((o) => o.valor === valor)?.rotulo ?? "";

  // O campo de faixa é livre; se o texto bater com uma opção da API, envia o valor dela.
  const faixaParaEnvio = (texto: string) => {
    const t = texto.trim();
    if (!t) return null;
    return (
      metadados?.faixaRenda.find(
        (o) => o.rotulo.toLowerCase() === t.toLowerCase(),
      )?.valor ?? t
    );
  };

  const handleMembroChange = (
    index: number,
    campo: keyof Membro,
    valor: string,
  ) => {
    setMembros((atual) =>
      atual.map((m, i) => (i === index ? { ...m, [campo]: valor } : m)),
    );
  };

  const handleRendaChange = (
    index: number,
    campo: keyof FonteRenda,
    valor: string,
  ) => {
    setRendas((atual) =>
      atual.map((r, i) => {
        if (i !== index) return r;
        if (campo === "tipo") {
          // Preenche a faixa quando ela é conhecida, a menos que o usuário já tenha editado
          const sugerida = FAIXA_SUGERIDA[valor];
          return {
            ...r,
            tipo: valor,
            faixa: r.faixaEditada
              ? r.faixa
              : sugerida
                ? rotuloFaixa(sugerida)
                : "",
          };
        }
        if (campo === "faixa") {
          return { ...r, faixa: valor, faixaEditada: valor !== "" };
        }
        return { ...r, [campo]: valor };
      }),
    );
  };

  const adicionarMembro = () => setMembros((atual) => [...atual, novoMembro()]);
  const removerMembro = (index: number) =>
    setMembros((atual) => atual.filter((_, i) => i !== index));

  const adicionarRenda = () => setRendas((atual) => [...atual, novaRenda()]);
  const removerRenda = (index: number) =>
    setRendas((atual) => atual.filter((_, i) => i !== index));

  // Cálculos Automáticos de Idade/Faixas Etárias
  const idades = membros.map((m) => calcularIdade(m.dataNascimento));
  const totalPessoas = membros.length;
  const ate12Anos = idades.filter((i) => i !== null && i <= 12).length;
  const de13a59Anos = idades.filter(
    (i) => i !== null && i >= 13 && i <= 59,
  ).length;
  const mais60Anos = idades.filter((i) => i !== null && i >= 60).length;

  const toggleAbastecimento = (opcao: string) => {
    setAbastecimento((prev) =>
      prev.includes(opcao)
        ? prev.filter((item) => item !== opcao)
        : [...prev, opcao],
    );
  };

  const handleSubmit = async () => {
    setSalvando(true);
    const payload = {
      municipio,
      comunidade,
      responsavel,
      telefone,
      cpf,
      pontoReferencia,
      moradia: { abastecimento, temBanheiro, escoamento, tratamentoAgua },
      membros: membros.map((m, i) => ({
        nome: m.nome,
        sexo: m.sexo,
        dataNascimento: m.dataNascimento || null,
        idade: idades[i],
        serie: m.serie,
        tamanhoRoupa: m.tamanhoRoupa || null,
        numeroCalcado: m.numeroCalcado || null,
      })),
      rendas: rendas.map((r) => ({
        tipo: r.tipo,
        quemRecebe: r.quemRecebe,
        faixa: faixaParaEnvio(r.faixa),
        observacao: r.observacao,
      })),
      totaisCalculados: { totalPessoas, ate12Anos, de13a59Anos, mais60Anos },
    };

    try {
      const res = await fetch("/api/familias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Família cadastrada com sucesso!");
      } else {
        alert("Erro ao cadastrar família.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f3ef",
        minHeight: "100vh",
        padding: "16px",
      }}
    >
      {/* Regras CSS Responsivas via Media Queries */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
      /* Estilo dos rótulos com ícones */
      .label-com-icone {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: #4b5563;
        font-weight: 600;
        margin-bottom: 4px;
      }

      /* ===================================================
         3. GRIDS E LAYOUT DO FORMULÁRIO
         =================================================== */
      .grid-2-colunas {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .coluna-inputs {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .grid-2, .grid-3 {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr;
      }

      .rodape-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .rodape-acoes {
        display: flex;
        width: 100%;
        gap: 12px;
      }

      .rodape-acoes button {
        flex: 1;
      }

      .tabela-overflow {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* Telas Médias e Grandes (Tablets e Desktops) */
      @media (min-width: 640px) {
        .grid-2-colunas {
          grid-template-columns: repeat(2, 1fr);
        }
        .grid-2 {
          grid-template-columns: 1fr 1fr;
        }
        .grid-3 {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .rodape-container {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
        .rodape-acoes {
          width: auto;
        }
        .rodape-acoes button {
          flex: initial;
        }
      }
    `,
        }}
      />

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          minHeight: "100vh",
          backgroundColor: "#f5f3ef",
        }}
      >
        <main
          style={{
            flex: 1,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                  margin: 0,
                }}
              >
                Nova família
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                Famílias › Nova
              </p>
            </div>
          </div>

          {/* Bloco 1: Dados da Família */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: "0.85rem",
                color: "#c2410c",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              Dados da família
            </h3>
            <div className="grid-2">
              <div>
                <label className="label-com-icone">
                  <Building2 size={16} color="#FFA500" />
                  Município
                </label>
                <input
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Ibimirim-PE"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label className="label-com-icone">
                  <MapPin size={16} color="#FFA500" />
                  Comunidade
                </label>
                <input
                  value={comunidade}
                  onChange={(e) => setComunidade(e.target.value)}
                  placeholder="Jeritacó"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label className="label-com-icone">
                  <User size={16} color="#FFA500" />
                  Responsável
                </label>
                <input
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Maria josefa da Silva"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label className="label-com-icone">
                  <Phone size={16} color="#FFA500" />
                  Telefone
                </label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(81) 9 9999-9999"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label className="label-com-icone">
                  <FileText size={16} color="#FFA500" />
                  Cpf da responsável (opcional)
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label className="label-com-icone">
                  <Compass size={16} color="#FFA500" />
                  Ponto de referência
                </label>
                <input
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  placeholder="Perto da igreja, subindo a ladeira"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bloco 2: Membros da Família */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.85rem",
                  color: "#c2410c",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                Membros da família
              </h3>
              <button
                type="button"
                onClick={adicionarMembro}
                style={estiloBotaoAdicionar}
              >
                <Plus size={16} color="#FFA500" /> Adicionar membro
              </button>
            </div>

            {/* Lista de Membros em Formato de Cartão/Grid */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {membros.map((m, index) => (
                <div
                  key={m.id}
                  style={{
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        margin: 0,
                      }}
                    >
                      Membro #{index + 1}
                    </p>
                    {membros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerMembro(index)}
                        style={estiloBotaoRemover}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid-2-colunas">
                    {/* Coluna da Esquerda */}
                    <div className="coluna-inputs">
                      <div>
                        <label className="label-com-icone">
                          <User size={15} color="#FFA500" /> Nome do membro
                        </label>
                        <input
                          type="text"
                          value={m.nome}
                          onChange={(e) =>
                            handleMembroChange(index, "nome", e.target.value)
                          }
                          placeholder="Digite o nome"
                          style={estiloCampo}
                        />
                      </div>
                      <div>
                        <label className="label-com-icone">
                          <Users size={15} color="#FFA500" /> Sexo
                        </label>
                        <input
                          type="text"
                          value={m.sexo}
                          onChange={(e) =>
                            handleMembroChange(index, "sexo", e.target.value)
                          }
                          placeholder="M ou F"
                          style={estiloCampo}
                        />
                      </div>
                      <div>
                        <label className="label-com-icone">
                          <Calendar size={15} color="#FFA500" /> Data de
                          nascimento
                        </label>
                        <input
                          type="date"
                          value={m.dataNascimento}
                          onChange={(e) =>
                            handleMembroChange(
                              index,
                              "dataNascimento",
                              e.target.value,
                            )
                          }
                          placeholder=""
                          style={estiloCampo}
                        />
                      </div>
                      <div>
                        <label className="label-com-icone">
                          <User size={15} color="#FFA500" /> Idade (calculada)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={
                            idades[index] !== null
                              ? `${idades[index]} anos`
                              : ""
                          }
                          placeholder="Preenchida pela data de nascimento"
                          style={{
                            ...estiloCampo,
                            background: "#f3f4f6",
                            color: "#4b5563",
                          }}
                        />
                      </div>
                    </div>

                    {/* Coluna da Direita */}
                    <div className="coluna-inputs">
                      <div>
                        <label className="label-com-icone">
                          <GraduationCap size={15} color="#FFA500" /> Série
                        </label>
                        <select
                          value={m.serie}
                          onChange={(e) =>
                            handleMembroChange(index, "serie", e.target.value)
                          }
                          style={estiloCampo}
                        >
                          <option value="">Selecione</option>
                          {gruposSerie.map((g) => (
                            <optgroup key={g.titulo} label={g.titulo}>
                              {g.itens.map((o) => (
                                <option key={o.valor} value={o.valor}>
                                  {o.rotulo}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-com-icone">
                          <Shirt size={15} color="#FFA500" /> Tamanho da roupa
                        </label>
                        <select
                          value={m.tamanhoRoupa}
                          onChange={(e) =>
                            handleMembroChange(
                              index,
                              "tamanhoRoupa",
                              e.target.value,
                            )
                          }
                          style={estiloCampo}
                        >
                          <option value="">Selecione</option>
                          {opcoesRoupa.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-com-icone">
                          <Footprints size={15} color="#FFA500" /> Número do
                          calçado
                        </label>
                        <select
                          value={m.numeroCalcado}
                          onChange={(e) =>
                            handleMembroChange(
                              index,
                              "numeroCalcado",
                              e.target.value,
                            )
                          }
                          style={estiloCampo}
                        >
                          <option value="">Selecione</option>
                          {opcoesCalcado.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 3: Moradia */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: "0.85rem",
                color: "#c2410c",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              Moradia
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginBottom: "16px",
              }}
            >
              Categorias iguais às da Ficha de Cadastro Domiciliar do e-SUS
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label
                className="label-com-icone"
                style={{ marginBottom: "8px" }}
              >
                <Droplets size={16} color="#FFA500" />
                Abastecimento de água — Marque quantas forem necessárias
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  "Rede encanada até o domicílio",
                  "Poço ou nascente",
                  "Cisterna",
                  "Carro-pipa",
                  "Outro",
                ].map((item) => {
                  const ativo = abastecimento.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAbastecimento(item)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "16px",
                        border: ativo
                          ? "1px solid #16a34a"
                          : "1px solid #d1d5db",
                        background: ativo ? "#dcfce7" : "#fff",
                        color: ativo ? "#15803d" : "#374151",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid-3">
              <div>
                <label className="label-com-icone">
                  <Home size={16} color="#FFA500" />
                  Tem banheiro?
                </label>
                <select
                  value={temBanheiro}
                  onChange={(e) => setTemBanheiro(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
              <div>
                <label className="label-com-icone">
                  <Droplets size={16} color="#FFA500" />
                  Escoamento do banheiro
                </label>
                <select
                  value={escoamento}
                  onChange={(e) => setEscoamento(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="Fossa rudimentar">Fossa rudimentar</option>
                  <option value="Rede de esgoto">Rede de esgoto</option>
                  <option value="Céu aberto">Céu aberto</option>
                </select>
              </div>
              <div>
                <label className="label-com-icone">
                  <Droplets size={16} color="#FFA500" />
                  Tratamento da água
                </label>
                <select
                  value={tratamentoAgua}
                  onChange={(e) => setTratamentoAgua(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="Sem tratamento">Sem tratamento</option>
                  <option value="Filtração">Filtração</option>
                  <option value="Cloração">Cloração</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloco 4: Fontes de Renda */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "0.85rem",
                    color: "#c2410c",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  Fontes de renda
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                  Uma linha por fonte. Quem recebe é opcional.
                </p>
              </div>
              <button
                type="button"
                onClick={adicionarRenda}
                style={estiloBotaoAdicionar}
              >
                <Plus size={16} color="#FFA500" /> Adicionar fonte
              </button>
            </div>

            {/* Sugestões para o campo de faixa (continua sendo texto livre) */}
            <datalist id="faixas-renda">
              {metadados?.faixaRenda.map((o) => (
                <option key={o.valor} value={o.rotulo} />
              ))}
            </datalist>

            {/* Envoltório para permitir Scroll Horizontal em telas pequenas */}
            <div className="tabela-overflow">
              <table
                style={{
                  width: "100%",
                  minWidth: "600px",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      fontSize: "0.75rem",
                      color: "#6b7280",
                    }}
                  >
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      <span className="label-com-icone">
                        <DollarSign size={14} color="#FFA500" /> Tipo
                      </span>
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      <span className="label-com-icone">
                        <User size={14} color="#FFA500" /> Quem recebe
                        (opcional)
                      </span>
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      <span className="label-com-icone">
                        <DollarSign size={14} color="#FFA500" /> Faixa
                      </span>
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      <span className="label-com-icone">
                        <FileText size={14} color="#FFA500" /> Observação
                      </span>
                    </th>
                    <th style={{ padding: "8px" }} />
                  </tr>
                </thead>
                <tbody>
                  {rendas.map((r, index) => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "4px" }}>
                        <select
                          value={r.tipo}
                          onChange={(e) =>
                            handleRendaChange(index, "tipo", e.target.value)
                          }
                          style={estiloCampo}
                        >
                          <option value="">Selecione</option>
                          {opcoesRenda.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="text"
                          value={r.quemRecebe}
                          onChange={(e) =>
                            handleRendaChange(
                              index,
                              "quemRecebe",
                              e.target.value,
                            )
                          }
                          placeholder="Ex: Maria"
                          style={estiloCampo}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="text"
                          value={r.faixa}
                          onChange={(e) =>
                            handleRendaChange(index, "faixa", e.target.value)
                          }
                          placeholder="Ex: Até 1 salário"
                          list="faixas-renda"
                          style={estiloCampo}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="text"
                          value={r.observacao}
                          onChange={(e) =>
                            handleRendaChange(
                              index,
                              "observacao",
                              e.target.value,
                            )
                          }
                          placeholder="Observações..."
                          style={estiloCampo}
                        />
                      </td>
                      <td style={{ padding: "4px", textAlign: "right" }}>
                        {rendas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerRenda(index)}
                            style={estiloBotaoRemover}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé Fixo de Contadores e Ações */}
          <div
            className="rodape-container"
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#ea580c",
                  }}
                >
                  {totalPessoas}
                </span>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>
                  pessoas
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#ea580c",
                  }}
                >
                  {ate12Anos}
                </span>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>
                  até 12 anos
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#ea580c",
                  }}
                >
                  {de13a59Anos}
                </span>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>
                  13 a 59 anos
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#ea580c",
                  }}
                >
                  {mais60Anos}
                </span>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>
                  60 anos ou mais
                </p>
              </div>
            </div>

            <div className="rodape-acoes">
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={salvando}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#ea580c",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {salvando ? "Salvando..." : "Salvar família"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
