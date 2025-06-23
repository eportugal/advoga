import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

// ⚙️ DynamoDB config
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { id, status, cognitoSub } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros obrigatórios faltando (id, status).",
        },
        { status: 400 }
      );
    }

    // Monta o UpdateExpression dinâmico: status + updatedAt + (opcional) cognitoSub
    let updateExpression = "SET #status = :status, updatedAt = :updatedAt";
    const expressionAttributeNames: Record<string, string> = {
      "#status": "status",
    };
    const expressionAttributeValues: Record<string, any> = {
      ":status": { S: status },
      ":updatedAt": { S: new Date().toISOString() },
    };

    if (cognitoSub) {
      updateExpression += ", cognitoSub = :cognitoSub";
      expressionAttributeValues[":cognitoSub"] = { S: cognitoSub };
    }

    const updateCommand = new UpdateItemCommand({
      TableName: "users",
      Key: { id: { S: id } },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await client.send(updateCommand);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[update-user-status] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno ao atualizar status",
      },
      { status: 500 }
    );
  }
}
