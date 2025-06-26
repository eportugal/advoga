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
      {
        status: 400,
      }
    );
  }

  const prompt = `
  Classifique a seguinte dúvida jurídica em uma das seguintes áreas:
  "Direito de Família", "Direito Penal", "Direito Civil", "Direito Trabalhista", 
  "Direito Previdenciário", "Direito Tributário", "Direito Empresarial", "Outro".

  Dúvida: "${question}"

  Responda apenas com o nome da área.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "mistral-medium",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const area = response.choices[0].message.content?.trim();
    console.log("🏷️ [API] Classified area:", area);

    return new Response(JSON.stringify({ area }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [API] Error occurred:", error);

    const message = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
