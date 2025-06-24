import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { getCurrentUser } from "aws-amplify/auth";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  try {
    const { ticketId, reply, lawyerName } = await req.json();

    if (!ticketId || !reply?.trim() || !lawyerName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket ID, resposta e nome do advogado são obrigatórios.",
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
          ":lawyerId": { S: currentUser.userId },
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Resposta salva e status atualizado com sucesso.",
    });
  } catch (err: any) {
    console.error("[respond-ticket] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
