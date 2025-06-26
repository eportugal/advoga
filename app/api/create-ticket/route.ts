// ✅ app/api/create-ticket/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { userId, subject, text } = await req.json();

    console.log("📥 [create-ticket] Dados recebidos:");
    console.log({ userId, subject, text });

    if (!userId || !subject?.trim() || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    // ✅ Chamada para a rota interna /api/classify
    const classifyRes = await fetch("http://localhost:3000/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
    });

    const { area } = await classifyRes.json();
    console.log(
      "🏷️ [create-ticket] Área classificada via /api/classify:",
      area
    );

    // ✅ Gera ID incremental
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

    const newId = counter.Attributes!.currentValue.N;
    if (!newId) throw new Error("Falha ao gerar ID do ticket");

    const ticketItem = {
      ticketId: { S: newId },
      userId: { S: userId },
      subject: { S: subject.trim() },
      text: { S: text.trim() },
      area: { S: area || "Outro" },
      status: { S: "Novo" },
      type: { S: "ticket" },
      createdAt: { S: new Date().toISOString() },
    };

    console.log("📝 [create-ticket] Ticket salvo no DynamoDB:");
    console.log(ticketItem);

    await client.send(
      new PutItemCommand({
        TableName: "tickets",
        Item: ticketItem,
      })
    );

    return NextResponse.json({
      success: true,
      id: newId,
      area,
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
