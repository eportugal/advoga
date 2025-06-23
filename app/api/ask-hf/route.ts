import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    // 1) Busca um texto real (exemplo fictício)
    const raw = await fetch(
      "https://www.planalto.gov.br/ccivil_03/Constituicao/Constituicao.htm"
    ).then((r) => r.text());
    const contexto = raw.slice(0, 1000); // Limita pra não explodir o prompt

    // 2) Monta o prompt
    const response = await fetch(
      "https://router.huggingface.co/featherless-ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente jurídico, responda em português usando o contexto fornecido.",
            },
            {
              role: "system",
              content: `Contexto: ${contexto}`,
            },
            {
              role: "user",
              content: question,
            },
          ],
          stream: false,
        }),
      }
    );

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
