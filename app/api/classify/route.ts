import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function POST(req: NextRequest) {
  console.log("🌐 [API] POST /api/classify called");

  const { question } = await req.json();
  console.log("❓ [API] Received question:", question);

  if (!question || typeof question !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid question" }),
      { status: 400 }
    );
  }

  const prompt = `
Classifique a seguinte dúvida jurídica em uma das seguintes áreas:
"Direito de Família", "Direito Penal", "Direito Civil", "Direito Trabalhista", 
"Direito Previdenciário", "Direito Tributário", "Direito Empresarial", "Outro".

Depois, gere um resumo breve da dúvida (1 ou 2 frases no máximo).

Retorne no formato JSON puro, sem explicações, assim:
{ "area": "Área escolhida", "summary": "Resumo gerado" }

Dúvida: "${question}"
`;

  try {
    const response = await openai.chat.completions.create({
      model: "mistral-medium",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = response.choices[0].message.content?.trim() || "";

    // Limpeza de crases e blocos de código
    const cleaned = raw
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    console.log("✅ [API] Parsed response:", parsed);

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [API] Error occurred:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to parse AI response",
        raw: error?.response?.choices?.[0]?.message?.content || error?.message,
      }),
      { status: 500 }
    );
  }
}
