import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { lawyerId, clientId, lawyerName, date, time } = await req.json();

    if (!lawyerId || !clientId || !lawyerName || !date || !time) {
      return NextResponse.json(
        { success: false, error: "Faltando campos obrigatórios." },
        { status: 400 }
      );
    }

    const appointmentId = uuidv4();
    const jitsiLink = `https://meet.jit.si/consulta-${lawyerName}-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const item = {
      appointmentId: { S: appointmentId },
      lawyerId: { S: lawyerId },
      clientId: { S: clientId },
      date: { S: date },
      time: { S: time },
      jitsiLink: { S: jitsiLink },
      createdAt: { S: createdAt },
      status: { S: "scheduled" },
    };

    await client.send(
      new PutItemCommand({
        TableName: "appointments",
        Item: item,
      })
    );

    return NextResponse.json({
      success: true,
      appointmentId,
      jitsiLink,
    });
  } catch (err: any) {
    console.error("❌ [create-appointment] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
