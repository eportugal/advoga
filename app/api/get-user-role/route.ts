// ✅ app/api/get-user-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION, // certifique-se que está definido no Amplify env vars!
});

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email obrigatório" },
      { status: 400 }
    );
  }

  try {
    const result = await client.send(
      new QueryCommand({
        TableName: "users",
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: email },
        },
        Limit: 1,
      })
    );

    const item = result.Items?.[0];

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role: item.role?.S ?? null,
      firstName: item.firstName?.S ?? "",
      lastName: item.lastName?.S ?? "",
    });
  } catch (err: any) {
    console.error("[get-user-role] Erro:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
