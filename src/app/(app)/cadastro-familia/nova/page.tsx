"use client";

import { useState } from "react";
// @ts-ignore
import "@/app/globals.css";
// @ts-ignore
import "@/app/componentes.css";

interface Membro {
  id: string;
  nome: string;
  sexo: string;
  nascimento: string;
  idade: number;
  serie: string;
  roupa: string;
  calcado: number;
}

interface FonteRenda {
  id: string;
  tipo: string;
  quemRecebe: string;
  faixa: string;
  observacao: string;
}

export default function NovaFamiliaPage() {
  const [sidebarAberta, setSidebarAberta] = useState(false);

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

  // Membros
  const [membros, setMembros] = useState<Membro[]>([
    {
      id: Date.now().toString(),
      nome: "",
      sexo: "",
      nascimento: "",
      idade: 0,
      serie: "",
      roupa: "",
      calcado: 0,
    },
  ]);

  // Renda
  const [rendas, setRendas] = useState<FonteRenda[]>([
    {
      id: Date.now().toString(),
      tipo: "",
      quemRecebe: "",
      faixa: "",
      observacao: "",
    },
  ]);

  const [salvando, setSalvando] = useState(false);

  // Manipuladores de Mudança para Membros
  const handleMembroChange = (
    index: number,
    field: keyof Membro,
    value: string | number,
  ) => {
    const novosMembros = [...membros];
    novosMembros[index] = {
      ...novosMembros[index],
      [field]: field === "idade" ? Number(value) : value,
    };
    setMembros(novosMembros);
  };

  // Manipuladores de Mudança para Rendas
  const handleRendaChange = (
    index: number,
    field: keyof FonteRenda,
    value: string,
  ) => {
    const novasRendas = [...rendas];
    novasRendas[index] = {
      ...novasRendas[index],
      [field]: value,
    };
    setRendas(novasRendas);
  };

  // Cálculos Automáticos de Idade/Faixas Etárias
  const totalPessoas = membros.length;
  const ate12Anos = membros.filter((m) => m.idade <= 12).length;
  const de13a59Anos = membros.filter(
    (m) => m.idade >= 13 && m.idade <= 59,
  ).length;
  const mais60Anos = membros.filter((m) => m.idade >= 60).length;

  const toggleAbastecimento = (opcao: string) => {
    setAbastecimento((prev) =>
      prev.includes(opcao)
        ? prev.filter((item) => item !== opcao)
        : [...prev, opcao],
    );
  };

  const adicionarMembro = () => {
    const novo: Membro = {
      id: Date.now().toString(),
      nome: "",
      sexo: "",
      nascimento: "",
      idade: 0,
      serie: "",
      roupa: "",
      calcado: 0,
    };
    setMembros([...membros, novo]);
  };

  const adicionarRenda = () => {
    const nova: FonteRenda = {
      id: Date.now().toString(),
      tipo: "",
      quemRecebe: "",
      faixa: "",
      observacao: "",
    };
    setRendas([...rendas, nova]);
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
      membros,
      rendas,
      totaisCalculados: { totalPessoas, ate12Anos, de13a59Anos, mais60Anos },
    };

    const [sidebarAberta, setSidebarAberta] = useState(false);

    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          minHeight: "100vh",
          backgroundColor: "#f5f3ef",
          position: "relative",
        }}
      ></div>
    );

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
      /* Esconde botão de menu e overlay por padrão no computador */
      .btn-menu-mobile,
      .sidebar-overlay {
        display: none !important;
      }

      /* ===================================================
         1. COMPORTAMENTO DA SIDEBAR RESPONSIVA
         =================================================== */

      /* Regras para Telemóvel e Tablet (Até 768px) */
      @media (max-width: 768px) {
        .btn-menu-mobile {
          display: flex !important;
        }

        .sidebar-container {
          position: fixed !important;
          top: 0;
          left: 0;
          bottom: 0;
          height: 100vh;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          box-shadow: 4px 0 12px rgba(0,0,0,0.15);
        }

        .sidebar-container.aberta {
          transform: translateX(0) !important;
        }

        .sidebar-overlay.aberta {
          display: block !important;
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 40;
        }
      }

      /* Regras para Computador (Maior que 768px) */
      @media (min-width: 769px) {
        .sidebar-container {
          position: relative !important;
          transform: none !important;
          display: flex !important;
        }
      }

      /* ===================================================
         2. ESTILOS DE NAVEGAÇÃO (SIDEBAR)
         =================================================== */
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 8px;
        color: #4b5563;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 0.2s, color 0.2s;
      }

      .nav-item:hover {
        background-color: #f9fafb;
      }

      .nav-item.active {
        background-color: #ffedd5;
        color: #ea580c;
        font-weight: 600;
      }

      .nav-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #d1d5db;
      }

      .nav-item.active .nav-dot {
        background-color: #ea580c;
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
        {/* Overlay escuro de fundo no Mobile (clicar fora fecha o menu) */}
        <div
          className={`sidebar-overlay ${sidebarAberta ? "aberta" : ""}`}
          onClick={() => setSidebarAberta(false)}
        />
        <aside
          className={`sidebar-container ${sidebarAberta ? "aberta" : ""}`}
          style={{
            width: "240px",
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <img
                  src="/logo-amigos-do-nordeste.jpeg"
                  alt="Logótipo Amigos do Nordeste"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      color: "#ea580c",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    Amigos do Nordeste
                  </h2>
                  <p
                    style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}
                  >
                    cadastro de famílias
                  </p>
                </div>
              </div>

              {/* Botão "X" para fechar no celular */}
              <button
                className="btn-menu-mobile"
                onClick={() => setSidebarAberta(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            <nav
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div className="nav-item">
                <span className="nav-dot"></span>Início
              </div>
              <div className="nav-item active">
                <span className="nav-dot"></span>Famílias
              </div>
              <div className="nav-item">
                <span className="nav-dot"></span>Comunidades
              </div>
              <div className="nav-item">
                <span className="nav-dot"></span>Relatórios
              </div>
              <div className="nav-item">
                <span className="nav-dot"></span>Configurações
              </div>
            </nav>
          </div>

          {/* Perfil do Rodapé */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              DA
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  color: "#374151",
                  margin: 0,
                }}
              >
                Dona da associação
              </p>
              <p style={{ fontSize: "0.7rem", color: "#9ca3af", margin: 0 }}>
                único acesso
              </p>
            </div>
          </div>
        </aside>
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
            <button
              className="btn-menu-mobile"
              onClick={() => setSidebarAberta(true)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              ☰
            </button>
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                Nova família
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
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
                fontSize: "0.75rem",
                color: "#c2410c",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              DADOS DA FAMÍLIA
            </h3>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  MUNICÍPIO
                </label>
                <input
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Ibimirim-PE"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  COMUNIDADE
                </label>
                <input
                  value={comunidade}
                  onChange={(e) => setComunidade(e.target.value)}
                  placeholder="Jeritacó"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  RESPONSÁVEL
                </label>
                <input
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Maria Rizeuda da Silva"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  TELEFONE
                </label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(81) 9 9999-9999"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  CPF DA RESPONSÁVEL (OPCIONAL)
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  PONTO DE REFERÊNCIA
                </label>
                <input
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  placeholder="Perto da igreja, subindo a ladeira"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
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
                  fontSize: "0.75rem",
                  color: "#c2410c",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                MEMBROS DA FAMÍLIA
              </h3>
              <button
                onClick={adicionarMembro}
                style={{
                  color: "#ea580c",
                  border: "1px solid #fdba74",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                + Adicionar membro
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
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      color: "#6b7280",
                      marginBottom: "12px",
                    }}
                  >
                    MEMBRO #{index + 1}
                  </p>

                  <div className="grid-2-colunas">
                    {/* Coluna da Esquerda */}
                    <div className="coluna-inputs">
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          NOME DO MEMBRO
                        </label>
                        <input
                          type="text"
                          value={m.nome}
                          onChange={(e) =>
                            handleMembroChange(index, "nome", e.target.value)
                          }
                          placeholder="Digite o nome"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          SEXO
                        </label>
                        <input
                          type="text"
                          value={m.sexo}
                          onChange={(e) =>
                            handleMembroChange(index, "sexo", e.target.value)
                          }
                          placeholder="M ou F"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          IDADE
                        </label>
                        <input
                          type="number"
                          value={m.idade || ""}
                          onChange={(e) =>
                            handleMembroChange(index, "idade", e.target.value)
                          }
                          placeholder="Ex: 8"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </div>
                    </div>

                    {/* Coluna da Direita */}
                    <div className="coluna-inputs">
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          SÉRIE
                        </label>
                        <input
                          type="text"
                          value={m.serie}
                          onChange={(e) =>
                            handleMembroChange(index, "serie", e.target.value)
                          }
                          placeholder="Ex: 8º Ano"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          ROUPA
                        </label>
                        <input
                          type="text"
                          value={m.roupa}
                          onChange={(e) =>
                            handleMembroChange(index, "roupa", e.target.value)
                          }
                          placeholder="Ex: M"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          CALÇADO
                        </label>
                        <input
                          type="text"
                          value={m.calcado || ""}
                          onChange={(e) =>
                            handleMembroChange(index, "calcado", e.target.value)
                          }
                          placeholder="Ex: 35"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
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
                fontSize: "0.75rem",
                color: "#c2410c",
                fontWeight: "bold",
              }}
            >
              MORADIA
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginBottom: "12px",
              }}
            >
              Categorias iguais às da Ficha de Cadastro Domiciliar do e-SUS
            </p>

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                ABASTECIMENTO DE ÁGUA — MARQUE QUANTAS FOREM NESCESSARIO
              </p>
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
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  TEM BANHEIRO?
                </label>
                <select
                  value={temBanheiro}
                  onChange={(e) => setTemBanheiro(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  ESCOAMENTO DO BANHEIRO
                </label>
                <select
                  value={escoamento}
                  onChange={(e) => setEscoamento(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="Fossa rudimentar">Fossa rudimentar</option>
                  <option value="Rede de esgoto">Rede de esgoto</option>
                  <option value="Céu aberto">Céu aberto</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  TRATAMENTO DA ÁGUA
                </label>
                <select
                  value={tratamentoAgua}
                  onChange={(e) => setTratamentoAgua(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
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
                    fontSize: "0.75rem",
                    color: "#c2410c",
                    fontWeight: "bold",
                  }}
                >
                  FONTES DE RENDA
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  Uma linha por fonte. Quem recebe é opcional.
                </p>
              </div>
              <button
                onClick={adicionarRenda}
                style={{
                  color: "#ea580c",
                  border: "1px solid #fdba74",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                + Adicionar fonte
              </button>
            </div>

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
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                      color: "#6b7280",
                    }}
                  >
                    <th style={{ padding: "8px", textAlign: "left" }}>Tipo</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Quem recebe (Opcional)
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Faixa</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Observação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rendas.map((r, index) => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "4px" }}>
                        <input
                          type="text"
                          value={r.tipo}
                          onChange={(e) =>
                            handleRendaChange(index, "tipo", e.target.value)
                          }
                          placeholder="Ex: Salário"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
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
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="text"
                          value={r.faixa}
                          onChange={(e) =>
                            handleRendaChange(index, "faixa", e.target.value)
                          }
                          placeholder="Ex: Até 1 Salário"
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
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
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                          }}
                        />
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
                <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>pessoas</p>
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
                <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>
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
                <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>13 a 59</p>
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
                <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                  60 ou mais
                </p>
              </div>
            </div>

            <div className="rodape-acoes">
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
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
                  borderRadius: "4px",
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
