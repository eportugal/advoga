import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { decreaseCredit } from "../../utils/decreaseCredit"; // 👈 Reaproveita helper

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      text,
      area,
      summary,
      explanation,
      answerIA,
      type = "ticket",
    } = await req.json();

    console.log("📥 [create-ticket] Dados recebidos:");
    console.log({ userId, text, area, summary, explanation, answerIA });

    if (!userId || !text?.trim() || !area || !summary || !explanation) {
      return NextResponse.json(
        { success: false, error: "Faltando campos obrigatórios" },
        { status: 400 }
      );
    }

    // 🔢 Gera ID incremental
    const counter = await client.send(
      new UpdateItemCommand({
        TableName: "counters",
        Key: { counterName: { S: "ticketId" } },
        UpdateExpression:
          "SET currentValue = if_not_exists(currentValue, :zero) + :inc",
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":inc": { N: "1" },
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const newId = counter.Attributes?.currentValue?.N;
    if (!newId) throw new Error("Falha ao gerar ID do ticket");

    const ticketItem: Record<string, any> = {
      ticketId: { S: newId },
      userId: { S: userId },
      text: { S: text.trim() },
      area: { S: area },
      summary: { S: summary },
      explanation: { S: explanation },
      type: { S: type },
      status: { S: "Novo" },
      createdAt: { S: new Date().toISOString() },
    };

    if (answerIA) {
      ticketItem.answerIA = { S: answerIA };
    }

    // 🧾 Cria o ticket
    await client.send(
      new PutItemCommand({
        TableName: "tickets",
        Item: ticketItem,
      })
    );

    // 💳 Decrementa 1 crédito de consultoria
    const result = await decreaseCredit({ userId, type: "consultoria" });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erro ao debitar crédito." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Ticket criado com sucesso",
    });
  } catch (err: any) {
    console.error("❌ [create-ticket] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
