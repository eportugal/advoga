import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { decreaseCredit } from "../../utils/decreaseCredit";
import { createReminderSchedule } from "../../utils/scheduleReminder";


const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      text,
      area,
      summary,
      explanation,
      answerIA,
      type = "ticket",
      day,
      hour,
    } = await req.json();

    console.log("📥 [create-ticket] Dados recebidos:");
    console.log({
      userId,
      text,
      area,
      summary,
      explanation,
      answerIA,
      day,
      hour,
    });

    if (
      !userId ||
      !text?.trim() ||
      !area ||
      !summary ||
      !explanation ||
      !day ||
      !hour
    ) {
      return NextResponse.json(
        { success: false, error: "Faltando campos obrigatórios" },
        { status: 400 }
      );
    }

    // 🔍 Buscar advogados disponíveis para a área
    const lawyerRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-available-lawyers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      }
    );
    const { lawyers } = await lawyerRes.json();

    if (!lawyers || lawyers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum advogado disponível para essa área." },
        { status: 404 }
      );
    }

    // 🧠 Filtrar advogados com o horário escolhido
    const availableLawyers = lawyers.filter((lawyer: any) =>
      lawyer.availability?.[day]?.includes(hour)
    );

    if (availableLawyers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum advogado disponível nesse horário." },
        { status: 404 }
      );
    }

    // 🎯 Escolher advogado aleatoriamente
    const randomLawyer =
      availableLawyers[Math.floor(Math.random() * availableLawyers.length)];

    // 📆 Criar appointment com o advogado e cliente
    const appointmentRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-appointment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawyerId: randomLawyer.id,
          clientId: userId,
          lawyerName: randomLawyer.name,
          date: day,
          time: hour,
        }),
      }
    );

    const appointmentData = await appointmentRes.json();

    if (!appointmentData.success) {
      return NextResponse.json(
        { success: false, error: "Erro ao criar a reunião." },
        { status: 500 }
      );
    }

    const { appointmentId, jitsiLink } = appointmentData;

    // 🔢 Gera ID incremental do ticket
    const counter = await client.send(
      new UpdateItemCommand({
        TableName: "counters",
        Key: { counterName: { S: "ticketId" } },
        UpdateExpression:
          "SET currentValue = if_not_exists(currentValue, :zero) + :inc",
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":inc": { N: "1" },
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const newId = counter.Attributes?.currentValue?.N;
    if (!newId) throw new Error("Falha ao gerar ID do ticket");

    const ticketItem: Record<string, any> = {
      ticketId: { S: newId },
      userId: { S: userId },
      lawyerId: { S: randomLawyer.id },
      text: { S: text.trim() },
      area: { S: area },
      summary: { S: summary },
      explanation: { S: explanation },
      type: { S: type },
      status: { S: "Novo" },
      day: { S: day },
      hour: { S: hour },
      createdAt: { S: new Date().toISOString() },
      appointmentId: { S: appointmentId },
      jitsiLink: { S: jitsiLink },
    };

    if (answerIA) {
      ticketItem.answerIA = { S: answerIA };
    }

    // 🧾 Criar o ticket
    await client.send(
      new PutItemCommand({
        TableName: "tickets",
        Item: ticketItem,
      })
    );

    // 💳 Decrementa crédito
    const result = await decreaseCredit({ userId, type: "consultoria" });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erro ao debitar crédito." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: newId,
      lawyerId: randomLawyer.id,
      lawyerName: randomLawyer.name,
      jitsiLink,
      appointmentId,
      message: "Ticket criado com sucesso",
    });
  } catch (err: any) {
    console.error("❌ [create-ticket] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
