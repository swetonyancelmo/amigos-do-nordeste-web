"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import "@/app/globals.css";
// @ts-ignore
import "@/app/componentes.css";

interface ItemQuantidade {
  tamanho: string;
  quantidade: number;
}

interface DadosNecessidades {
  roupas: ItemQuantidade[];
  calcados: ItemQuantidade[];
}

interface DadosSituacao {
  totalFamilias: number;
  totalPessoas: number;
  extremaPobreza: number;
  semSaneamento: number;
  criancasEmIdadeEscolar: number;
}

export default function RelatorioNecessidadesPage() {
  const [comunidadeId, setComunidadeId] = useState<string>("");
  const [necessidades, setNecessidades] = useState<DadosNecessidades | null>(
    null,
  );
  const [situacao, setSituacao] = useState<DadosSituacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const [resNec, resSit] = await Promise.all([
          fetch(`/api/relatorios/necessidades?comunidadeId=${comunidadeId}`),
          fetch("/api/relatorios/situacao"),
        ]);

        if (!resNec.ok || !resSit.ok) {
          throw new Error(
            "Uma das rotas de API não foi encontrada ou retornou erro.",
          );
        }

        const dadosNec = await resNec.json();
        const dadosSit = await resSit.json();

        setNecessidades(dadosNec);
        setSituacao(dadosSit);
      } catch (err) {
        console.error("Erro ao carregar relatórios:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [comunidadeId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabeçalho de Ações no Navegador */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}
          >
            Necessidades da Comunidade
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
            Relatório consolidado para distribuição de suprimentos
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={comunidadeId}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              setComunidadeId(event.target.value)
            }
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="">Todas as Comunidades</option>
            <option value="com_1">Comunidade Sol Nascente</option>
            <option value="com_2">Sítio Boa Vista</option>
          </select>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Cabeçalho Visual Exclusivo para Impressão */}
      <div
        className="print-only"
        style={{ display: "none", marginBottom: "16px" }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
          Associação Amigos do Nordeste
        </h1>
        <h2 style={{ fontSize: "1rem" }}>
          Relatório de Entregas e Necessidades por Comunidade
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Data de emissão: {new Date().toLocaleDateString("pt-BR")}
        </p>
        <hr style={{ margin: "8px 0", borderColor: "#000000" }} />
      </div>

      {loading ? (
        <p>Carregando dados do relatório...</p>
      ) : (
        <>
          {/* Cartões de Indicadores */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Total de Famílias
              </span>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {situacao?.totalFamilias ?? 0}
              </p>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Total de Pessoas
              </span>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {situacao?.totalPessoas ?? 0}
              </p>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Extrema Pobreza
              </span>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#dc2626",
                }}
              >
                {situacao?.extremaPobreza ?? 0}
              </p>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Sem Saneamento
              </span>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#d97706",
                }}
              >
                {situacao?.semSaneamento ?? 0}
              </p>
            </div>
          </div>

          {/* Gráficos de Barras de Demandas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px",
            }}
          >
            {/* Seção Vestuário */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "bold",
                  marginBottom: "16px",
                }}
              >
                Demandas de Vestuário
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {necessidades?.roupas?.map((item: ItemQuantidade) => (
                  <div key={item.tamanho}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        marginBottom: "4px",
                        fontWeight: "500",
                      }}
                    >
                      <span>Tamanho {item.tamanho}</span>
                      <span>{item.quantidade} un.</span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#e5e7eb",
                        height: "16px",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#2563eb",
                          height: "100%",
                          width: `${Math.min(item.quantidade, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )) ?? <p>Nenhuma demanda de vestuário registrada.</p>}
              </div>
            </div>

            {/* Seção Calçados */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "bold",
                  marginBottom: "16px",
                }}
              >
                Demandas de Calçados
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {necessidades?.calcados?.map((item: ItemQuantidade) => (
                  <div key={item.tamanho}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        marginBottom: "4px",
                        fontWeight: "500",
                      }}
                    >
                      <span>Nº {item.tamanho}</span>
                      <span>{item.quantidade} pares</span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#e5e7eb",
                        height: "16px",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#059669",
                          height: "100%",
                          width: `${Math.min(item.quantidade, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )) ?? <p>Nenhuma demanda de calçados registrada.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
