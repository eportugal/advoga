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
    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: "Parâmetros obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const creditField =
      type === "ia"
        ? "creditsIA"
        : type === "consultoria"
        ? "creditsConsultoria"
        : null;

    if (!creditField) {
      return NextResponse.json(
        { success: false, error: "Tipo de crédito inválido." },
        { status: 400 }
      );
    }

    await client.send(
      new UpdateItemCommand({
        TableName: "users",
        Key: { id: { S: userId } },
        UpdateExpression: `SET ${creditField} = ${creditField} - :dec`,
        ConditionExpression: `${creditField} >= :min`,
        ExpressionAttributeValues: {
          ":dec": { N: "1" },
          ":min": { N: "1" },
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Erro ao diminuir crédito:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
