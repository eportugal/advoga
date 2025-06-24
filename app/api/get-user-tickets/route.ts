import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = Number(searchParams.get("limit") || "10");
    const lastKey = searchParams.get("lastKey");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId é obrigatório na query string." },
        { status: 400 }
      );
    }

    const input: any = {
      TableName: "tickets",
      IndexName: "UserIdCreatedAtIndex",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": { S: userId },
      },
      ScanIndexForward: false, // Mais recentes primeiro!
      Limit: limit,
    };

    if (lastKey) {
      input.ExclusiveStartKey = {
        userId: { S: userId },
        createdAt: { S: lastKey },
      };
    }

    const res = await client.send(new QueryCommand(input));

    const tickets =
      res.Items?.map((item) => ({
        ticketId: item.ticketId?.S ?? null,
        userId: item.userId?.S ?? null,
        subject: item.subject?.S ?? "",
        text: item.text?.S ?? "",
        status: item.status?.S ?? "Novo",
        createdAt: item.createdAt?.S ?? null,
        reply: item.reply?.S ?? null,
      })) || [];

    return NextResponse.json({
      success: true,
      tickets,
      lastKey: res.LastEvaluatedKey?.createdAt?.S ?? null,
    });
  } catch (err: any) {
    console.error("[get-user-tickets] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
