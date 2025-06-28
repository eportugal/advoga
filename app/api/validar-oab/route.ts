import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { number, uf, nome } = await req.json();

    if (!number || !uf || !nome) {
      return NextResponse.json(
        { success: false, error: "Número, UF e nome são obrigatórios." },
        { status: 400 }
      );
    }

    const res = await fetch("https://cna.oab.org.br/Home/Search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Insc: number,
        Uf: uf,
        NomeAdvo: "",
      }),
    });

    const raw = await res.json();
    console.log("🔍 Resposta da OAB CNA:", JSON.stringify(raw, null, 2));

    const isDataArray = Array.isArray(raw?.Data);
    const hasData = isDataArray && raw.Data.length > 0;
    const valid = raw?.Success === true && hasData;

    let nomeCoincide = false;

    if (valid && nome) {
      const nomeInput = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const nomeRetornado = raw.Data[0]?.Nome?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      nomeCoincide = nomeRetornado?.includes(nomeInput);
    }

    return NextResponse.json({
      success: true,
      valid,
      nomeCoincide,
      data: raw?.Data || [],
      raw,
    });
  } catch (err) {
    console.error("❌ Erro ao validar OAB:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
