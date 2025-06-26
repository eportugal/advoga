import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";

const openai = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

async function searchDuckDuckGo(query: string): Promise<string> {
  const response = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  );
  const html = await response.text();
  const $ = cheerio.load(html);

  const results: string[] = [];

  $(".result")
    .slice(0, 5)
    .each((_, elem) => {
      const title = $(elem).find(".result__a").text();
      const url = $(elem).find(".result__a").attr("href");
      const snippet = $(elem).find(".result__snippet").text();
      results.push(`**${title}**\n${snippet}\nURL: ${url}`);
    });

  return results.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const { question, userId } = await req.json();

    if (!question || !userId) {
      return NextResponse.json(
        { success: false, error: "Parâmetros ausentes: question ou userId." },
        { status: 400 }
      );
    }

    const webContext = await searchDuckDuckGo(question);

    const prompt = `
Classifique a seguinte dúvida jurídica em uma das seguintes áreas:
"Direito de Família", "Direito Penal", "Direito Civil", "Direito Trabalhista", 
"Direito Previdenciário", "Direito Tributário", "Direito Empresarial", "Outro".

Depois, gere:
1. Um breve resumo da dúvida para ser mostrado ao usuário. Apenas para que fique fácil ele reconhecer o assunto numa página com vários tickets;
2. Uma breve explicação técnica resumida sobre a dúvida, como se fosse para outro advogado entender rapidamente o contexto. Sem fazer inferências, só descrever o que o cliente disse;
3. Uma resposta útil e completa à dúvida com base nas informações abaixo.

Use o seguinte formato JSON (sem texto extra, sem comentários, apenas o JSON puro):

{
  "area": "Área jurídica",
  "summary": "Resumo para o usuário",
  "explanation": "Explicação técnica para o advogado",
  "answerIA": "Resposta completa formatada"
}

DÚVIDA:
"${question}"

INFORMAÇÕES DISPONÍVEIS:
${webContext}
    `;

    const completion = await openai.chat.completions.create({
      model: "mistral-medium",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = completion.choices[0].message.content?.trim() || "";

    // 💡 Limpeza robusta para qualquer formato com crase, aspas ou newline
    const cleaned = raw
      .replace(/(^```json|```$|^```)/g, "") // remove blocos de código
      .replace(/\\n/g, "\n") // transforma '\n' em quebras de linha reais
      .replace(/\\"/g, '"') // corrige aspas escapadas
      .replace(/\n/g, "") // remove quebras de linha finais
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: "A resposta da IA não está em formato JSON válido.",
          raw: raw,
          cleaned: cleaned, // 🔍 para debugging
        },
        { status: 500 }
      );
    }

    console.log("🧠 Resposta parseada:", parsed);

    return NextResponse.json({
      success: true,
      ...parsed,
    });
  } catch (error: any) {
    console.error("❌ Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno",
        raw: error?.response?.choices?.[0]?.message?.content || "",
      },
      { status: 500 }
    );
  }
}
