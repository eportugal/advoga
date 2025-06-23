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
    const { ticketId, status } = await req.json();

    if (!ticketId || !status) {
      return NextResponse.json(
        { success: false, error: "ticketId e status obrigatórios." },
        { status: 400 }
      );
    }

    await client.send(
      new UpdateItemCommand({
        TableName: "tickets",
        Key: { ticketId: { S: ticketId } },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": { S: status },
        },
      })
    );

    return NextResponse.json({ success: "Ticket atualizado." });
  } catch (err: any) {
    console.error("[update-ticket-status] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
