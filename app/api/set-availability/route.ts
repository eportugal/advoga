import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { lawyerId, weeklySchedule } = await req.json();

    if (!lawyerId || !weeklySchedule || typeof weeklySchedule !== "object") {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes ou inválidos." },
        { status: 400 }
      );
    }

    // Converte weeklySchedule (objeto JS) em formato esperado pelo DynamoDB
    const scheduleForDynamo: Record<string, any> = {};
    for (const day in weeklySchedule) {
      scheduleForDynamo[day] = {
        L: weeklySchedule[day].map((hour: string) => ({ S: hour })),
      };
    }

    await client.send(
      new PutItemCommand({
        TableName: "lawyer_availability",
        Item: {
          lawyerId: { S: lawyerId },
          weeklySchedule: { M: scheduleForDynamo },
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Disponibilidade salva com sucesso.",
    });
  } catch (err: any) {
    console.error("❌ [set-availability] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
