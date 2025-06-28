import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Utilitário: gera lista de dias a partir de hoje
function getUpcomingDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
  }

  return dates;
}

// Utilitário: converte Date para dia da semana em inglês (lowercase)
function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lawyerId = searchParams.get("lawyerId");
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 7;

    if (!lawyerId) {
      return NextResponse.json(
        { success: false, error: "Parâmetro lawyerId obrigatório." },
        { status: 400 }
      );
    }

    // Passo 1: busca disponibilidade fixa
    const availabilityResult = await client.send(
      new GetItemCommand({
        TableName: "lawyer_availability",
        Key: { lawyerId: { S: lawyerId } },
      })
    );

    const scheduleRaw = availabilityResult.Item?.weeklySchedule?.M;
    if (!scheduleRaw) {
      return NextResponse.json({ success: true, availableSlots: {} });
    }

    const schedule: Record<string, string[]> = {};
    for (const day in scheduleRaw) {
      const list = scheduleRaw[day]?.L;
      schedule[day] = Array.isArray(list) ? list.map((h: any) => h.S) : [];
    }

    // Passo 2: gera os próximos dias úteis
    const upcomingDates = getUpcomingDates(days);

    // Passo 3: busca agendamentos já feitos
    const occupiedMap: Record<string, string[]> = {};
    for (const date of upcomingDates) {
      const res = await client.send(
        new QueryCommand({
          TableName: "appointments",
          IndexName: "lawyerId-date-index",
          KeyConditionExpression: "lawyerId = :lid AND #dt = :date",
          ExpressionAttributeNames: {
            "#dt": "date",
          },
          ExpressionAttributeValues: {
            ":lid": { S: lawyerId },
            ":date": { S: date },
          },
        })
      );

      occupiedMap[date] = (res.Items || []).map((item: any) => item.time.S);
    }

    // Passo 4: monta os horários disponíveis
    const availableSlots: Record<string, string[]> = {};

    for (const date of upcomingDates) {
      const dayName = getDayOfWeek(date);
      const available = schedule[dayName] || [];
      const occupied = occupiedMap[date] || [];

      const free = available.filter((hour) => !occupied.includes(hour));
      if (free.length) {
        availableSlots[date] = free;
      }
    }

    return NextResponse.json({ success: true, availableSlots });
  } catch (err: any) {
    console.error("❌ [get-available-slots] Erro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
