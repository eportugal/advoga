// app/api/create-ticket/route.ts
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
    const { email, text, subject } = await req.json();

    if (!email || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: "Insira sua dúvida." },
        { status: 400 }
      );
    }

    // ✅ USE URL COMPLETA com fallback local
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/get-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const { user } = await res.json();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // ✅ Cria ID incremental
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

    // ✅ Cria ticket no DynamoDB
    await client.send(
      new PutItemCommand({
        TableName: "tickets",
        Item: {
          ticketId: { S: newId },
          userId: { S: user.id },
          userEmail: { S: user.email },
          userName: { S: `${user.firstName} ${user.lastName}` },
          role: { S: user.role },
          subject: { S: subject.trim() }, // 🆕 assunto
          text: { S: text.trim() }, // 🆕 texto
          status: { S: "Novo" },
          createdAt: { S: new Date().toISOString() },
        },
      })
    );

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Ticket criado com sucesso",
    });
  } catch (err: any) {
    console.error("[create-ticket] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
