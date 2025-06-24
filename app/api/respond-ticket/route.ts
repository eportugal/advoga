// ✅ EXEMPLO SIMPLIFICADO DA NOVA ROTA
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { ticketId, reply, lawyerId } = await req.json();

    if (!ticketId || !reply?.trim() || !lawyerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket ID, resposta e ID do advogado são obrigatórios.",
        },
        { status: 400 }
      );
    }

    await client.send(
      new UpdateItemCommand({
        TableName: "tickets",
        Key: { ticketId: { S: ticketId } },
        UpdateExpression:
          "SET reply = :reply, respondedAt = :respondedAt, lawyerId = :lawyerId",
        ExpressionAttributeValues: {
          ":reply": { S: reply.trim() },
          ":respondedAt": { S: new Date().toISOString() },
          ":lawyerId": { S: lawyerId },
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Resposta salva com sucesso.",
    });
  } catch (err: any) {
    console.error("[respond-ticket] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
