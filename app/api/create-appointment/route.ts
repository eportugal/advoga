// /app/api/create-appointment/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const scheduler = new SchedulerClient({ region: "us-east-2" });

export async function POST(req: NextRequest) {
  try {
    const { lawyerId, clientId, lawyerName, date, time } = await req.json();

    if (!lawyerId || !clientId || !lawyerName || !date || !time) {
      return NextResponse.json(
        { success: false, error: "Faltando campos obrigatórios." },
        { status: 400 }
      );
    }

    // Gerar ID incremental para o appointment
    const counter = await client.send(
      new UpdateItemCommand({
        TableName: "counters",
        Key: { counterName: { S: "appointmentId" } },
        UpdateExpression:
          "SET currentValue = if_not_exists(currentValue, :zero) + :inc",
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":inc": { N: "1" },
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const appointmentId = counter.Attributes?.currentValue?.N;
    if (!appointmentId) throw new Error("Falha ao gerar ID do appointment");

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

    // Salvar no DynamoDB
    await client.send(
      new PutItemCommand({
        TableName: "appointments",
        Item: item,
      })
    );

// 🕒 Criar horário do lembrete (30 minutos antes)
const appointmentTime = new Date(`${date}T${time}:00-03:00`);
const now = new Date();
const reminderTime = new Date(appointmentTime.getTime() - 30 * 60 * 1000);

// Se lembrete for no passado, agende para 2 minutos no futuro
const scheduleTime =
  reminderTime <= now
    ? new Date(now.getTime() + 2 * 60 * 1000)
    : reminderTime;

    const scheduleName = `reminder-${appointmentId}`;
    const scheduleExpression = `at(${scheduleTime.toISOString().split(".")[0]})`;

    await scheduler.send(
      new CreateScheduleCommand({
        Name: scheduleName,
        GroupName: "default",
        ScheduleExpression: scheduleExpression,
        FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
        Target: {
          Arn: "arn:aws:lambda:us-east-2:941377122403:function:sendAppointmentReminder",
          RoleArn:
            "arn:aws:iam::941377122403:role/service-role/sendAppointmentReminder-role-qnt8jleg",
          Input: JSON.stringify({ appointmentId }),
        },
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
