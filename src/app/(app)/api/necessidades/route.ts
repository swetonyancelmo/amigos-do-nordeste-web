import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const comunidadeId = searchParams.get("comunidadeId");

  // Exemplo de mock para contagem de tamanhos de roupas e calçados
  const dadosMock = {
    comunidadeId: comunidadeId || "todas",
    roupas: [
      { tamanho: "P", quantidade: 42 },
      { tamanho: "M", quantidade: 85 },
      { tamanho: "G", quantidade: 60 },
      { tamanho: "GG", quantidade: 28 },
      { tamanho: "Infantil (2-6)", quantidade: 34 },
      { tamanho: "Infantil (8-12)", quantidade: 45 },
    ],
    calcados: [
      { tamanho: "34-36", quantidade: 50 },
      { tamanho: "37-39", quantidade: 92 },
      { tamanho: "40-42", quantidade: 64 },
      { tamanho: "Infantil (20-28)", quantidade: 38 },
    ],
  };

  return NextResponse.json(dadosMock);
}
