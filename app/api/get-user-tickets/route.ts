import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

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
    const ticketId = searchParams.get("ticketId");
    const limit = Number(searchParams.get("limit") || "20");
    const lastKey = searchParams.get("lastKey");

    // ✅ Buscar apenas 1 ticket por ID
    if (ticketId) {
      const res = await client.send(
        new GetItemCommand({
          TableName: "tickets",
          Key: { ticketId: { S: ticketId } },
        })
      );

      if (!res.Item) {
        return NextResponse.json({
          success: false,
          error: "Ticket não encontrado",
        });
      }

      let lawyerName = null;
      const item = res.Item;

      if (item.lawyerId?.S) {
        const lawyerRes = await client.send(
          new GetItemCommand({
            TableName: "users",
            Key: { id: { S: item.lawyerId.S } },
          })
        );

        if (lawyerRes.Item) {
          lawyerName = `${lawyerRes.Item.firstName?.S ?? ""} ${
            lawyerRes.Item.lastName?.S ?? ""
          }`.trim();
        }
      }

      const ticket = {
        ticketId: item.ticketId?.S ?? null,
        userId: item.userId?.S ?? null,
        text: item.text?.S ?? "",
        status: item.status?.S ?? "Novo",
        createdAt: item.createdAt?.S ?? null,
        reply: item.reply?.S ?? null,
        respondedAt: item.respondedAt?.S ?? null,
        lawyerName: lawyerName || null,
      };

      return NextResponse.json({ success: true, ticket });
    }

    // ✅ Buscar por usuário (com paginação)
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
      ScanIndexForward: false,
      Limit: limit,
    };

    if (lastKey) {
      input.ExclusiveStartKey = {
        userId: { S: userId },
        createdAt: { S: lastKey },
      };
    }

    const res = await client.send(new QueryCommand(input));

    const tickets = await Promise.all(
      (res.Items || []).map(async (item) => {
        let lawyerName = null;

        if (item.lawyerId?.S) {
          const lawyerRes = await client.send(
            new GetItemCommand({
              TableName: "users",
              Key: { id: { S: item.lawyerId.S } },
            })
          );

          if (lawyerRes.Item) {
            lawyerName = `${lawyerRes.Item.firstName?.S ?? ""} ${
              lawyerRes.Item.lastName?.S ?? ""
            }`.trim();
          }
        }

        return {
          ticketId: item.ticketId?.S ?? null,
          userId: item.userId?.S ?? null,
          text: item.text?.S ?? "",
          status: item.status?.S ?? "Novo",
          createdAt: item.createdAt?.S ?? null,
          reply: item.reply?.S ?? null,
          respondedAt: item.respondedAt?.S ?? null,
          lawyerName: lawyerName || null,
        };
      })
    );

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
