// ✅ app/api/get-tickets/route.ts
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
    const limit = Number(searchParams.get("limit") || "10");
    const lastKey = searchParams.get("lastKey");

    const input: any = {
      TableName: "tickets",
      IndexName: "type-createdAt-index", // seu GSI novo!
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":type": { S: "ticket" },
      },
      ScanIndexForward: false, // mais recentes primeiro
      Limit: limit,
    };

    if (lastKey) {
      input.ExclusiveStartKey = {
        type: { S: "ticket" },
        createdAt: { S: lastKey },
      };
    }

    // 🔍 Busca tickets
    const res = await client.send(new QueryCommand(input));

    const userCache = new Map<string, any>();

    const tickets = await Promise.all(
      (res.Items || []).map(async (item) => {
        const userId = item.userId?.S;

        let user = null;

        if (userId) {
          // ⚡️ Busca user 1x só
          if (userCache.has(userId)) {
            user = userCache.get(userId);
          } else {
            const userRes = await client.send(
              new GetItemCommand({
                TableName: "users",
                Key: { id: { S: userId } },
              })
            );

            if (userRes.Item) {
              user = {
                id: userId,
                email: userRes.Item.email?.S ?? "",
                name: `${userRes.Item.firstName?.S ?? ""} ${
                  userRes.Item.lastName?.S ?? ""
                }`.trim(),
              };
              userCache.set(userId, user);
            }
          }
        }

        return {
          ticketId: item.ticketId?.S ?? null,
          userId: userId ?? null,
          user: user,
          subject: item.subject?.S ?? "",
          text: item.text?.S ?? "",
          status: item.status?.S ?? "Novo",
          createdAt: item.createdAt?.S ?? null,
          reply: item.reply?.S ?? null,
          lawyerName: item.lawyerName?.S ?? null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tickets,
      lastKey: res.LastEvaluatedKey?.createdAt?.S ?? null,
    });
  } catch (err: any) {
    console.error("[get-tickets] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
