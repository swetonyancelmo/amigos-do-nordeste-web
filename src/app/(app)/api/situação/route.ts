import { NextResponse } from "next/server";

export async function GET() {
  // Exemplo de mock dos cartões de vulnerabilidade
  const dadosMock = {
    totalFamilias: 142,
    totalPessoas: 538,
    extremaPobreza: 48,
    semSaneamento: 65,
    criancasEmIdadeEscolar: 120,
  };

  return NextResponse.json(dadosMock);
}
