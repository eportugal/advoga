import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

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
    const lawyerId = searchParams.get("lawyerId");

    if (!lawyerId) {
      return NextResponse.json(
        { success: false, error: "lawyerId é obrigatório." },
        { status: 400 }
      );
    }

    const command = new GetItemCommand({
      TableName: "lawyer_availability",
      Key: {
        lawyerId: { S: lawyerId },
      },
    });

    const result = await client.send(command);

    if (!result.Item || !result.Item.weeklySchedule) {
      return NextResponse.json(
        { success: true, weeklySchedule: {} },
        { status: 200 }
      );
    }

    const rawSchedule = result.Item.weeklySchedule.M;
    const parsedSchedule: Record<string, string[]> = {};

    for (const day in rawSchedule) {
      const list = rawSchedule[day]?.L;
      parsedSchedule[day] = Array.isArray(list)
        ? list.map((hourObj: any) => hourObj.S)
        : [];
    }

    return NextResponse.json({ success: true, weeklySchedule: parsedSchedule });
  } catch (err: any) {
    console.error("❌ [get-availability] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
