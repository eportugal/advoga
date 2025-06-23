import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const updateCommand = new UpdateItemCommand({
      TableName: "counters",
      Key: { counterName: { S: "questionId" } },
      UpdateExpression: "ADD currentValue :inc",
      ExpressionAttributeValues: {
        ":inc": { N: "1" },
      },
      ReturnValues: "UPDATED_NEW",
    });

    const updateResult = await client.send(updateCommand);
    const newId = parseInt(updateResult.Attributes!.currentValue.N!);

    const putCommand = new PutItemCommand({
      TableName: "perguntas",
      Item: {
        id: { N: newId.toString() },
        content: { S: body.content },
      },
    });

    await client.send(putCommand);

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error("🔥 DynamoDB error:", error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
