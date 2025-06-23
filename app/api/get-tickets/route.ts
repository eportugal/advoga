import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const res = await client.send(
      new ScanCommand({
        TableName: "tickets",
      })
    );

    const tickets =
      res.Items?.map((item) => ({
        ticketId: item.ticketId?.S,
        userId: item.userId?.S,
        userEmail: item.userEmail?.S,
        userName: item.userName?.S,
        role: item.role?.S,
        subject: item.subject?.S,
        text: item.text?.S,
        status: item.status?.S, // ✅ não esqueça isso!
        createdAt: item.createdAt?.S,
      })) || [];

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (err: any) {
    console.error("[get-tickets] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
