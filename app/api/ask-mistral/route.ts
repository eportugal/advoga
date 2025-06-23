import { NextRequest } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";

// ⚠️ NÃO precisa mais do duckduckgo-search quebrado.
interface DuckDuckGoResult {
  title: string;
  snippet: string;
  url: string;
}

const openai = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

// 🔍 HTML scraping direto do DuckDuckGo
async function searchDuckDuckGo(query: string): Promise<string> {
  console.log("🔍 [DuckDuckGo] Raw search with HTML scrape:", query);

  const response = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  );
  const html = await response.text();

  const $ = cheerio.load(html);
  const results: string[] = [];

  $(".result")
    .slice(0, 5)
    .each((i, elem) => {
      const title = $(elem).find(".result__a").text();
      const url = $(elem).find(".result__a").attr("href");
      const snippet = $(elem).find(".result__snippet").text();
      results.push(`**${title}**\n${snippet}\nURL: ${url}`);
    });

  console.log("✅ [DuckDuckGo] Parsed results:", results);

  return results.join("\n\n");
}

export async function POST(req: NextRequest) {
  console.log("🌐 [API] POST /api/ask-mistral called");

  const { question } = await req.json();
  console.log("❓ [API] Received question:", question);

  try {
    const webContext = await searchDuckDuckGo(question);
    console.log("📚 [API] Web context built:", webContext);

    const response = await openai.chat.completions.create({
      model: "mistral-medium",
      stream: true,
      messages: [
        {
          role: "system",
          content: ` Você é um assistente jurídico. 
                  Use APENAS as informações abaixo como referência para responder, cite URLs quando possível.
                  **Formate a resposta usando Markdown limpo, dividindo o texto em parágrafos claros e curtos usando linhas em branco entre eles. Não use listas JSON, apenas texto corrido e links em Markdown.**

                  ### Informações disponíveis:
                  ${webContext}
                  `,
        },
        { role: "user", content: question },
      ],
    });

    console.log("🤖 [API] Mistral response (stream ready)");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          console.log("🔑 [API] Raw chunk:", chunk);
          const raw = chunk.choices[0].delta?.content;
          const token =
            typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
          controller.enqueue(encoder.encode(token));
        }
        controller.close();
      },
    });

    console.log("🚀 [API] Streaming response back to client");

    return new Response(stream);
  } catch (error) {
    console.error("❌ [API] Error occurred:", error);

    const message = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
