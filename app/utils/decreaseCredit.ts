// lib/decreaseCredit.ts
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function decreaseCredit({
  userId,
  type,
}: {
  userId: string;
  type: "ia" | "consultoria";
}): Promise<{ success: boolean; error?: string }> {
  const creditField =
    type === "ia"
      ? "creditsIA"
      : type === "consultoria"
      ? "creditsConsultoria"
      : null;

  if (!creditField) {
    return { success: false, error: "Tipo de crédito inválido." };
  }

  try {
    await client.send(
      new UpdateItemCommand({
        TableName: "users",
        Key: { id: { S: userId } },
        UpdateExpression: `SET ${creditField} = if_not_exists(${creditField}, :start) - :dec, updatedAt = :now`,
        ConditionExpression: `${creditField} >= :dec`,
        ExpressionAttributeValues: {
          ":start": { N: "0" },
          ":dec": { N: "1" },
          ":now": { S: new Date().toISOString() },
        },
      })
    );

    return { success: true };
  } catch (err: any) {
    console.error("❌ Erro ao diminuir crédito:", err);
    return {
      success: false,
      error: err.message || "Erro ao debitar crédito.",
    };
  }
}
