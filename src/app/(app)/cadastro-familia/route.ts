import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação básica do responsável
    if (!body.responsavel || !body.municipio || !body.comunidade) {
      return NextResponse.json(
        { erro: "Município, comunidade e responsável são obrigatórios." },
        { status: 400 },
      );
    }

    // Aqui você conectará com o Supabase ou seu Banco de Dados
    console.log("Dados da família recebidos:", body);

    return NextResponse.json(
      { mensagem: "Família cadastrada com sucesso!", id: "fam_" + Date.now() },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro interno ao salvar família." },
      { status: 500 },
    );
  }
}
