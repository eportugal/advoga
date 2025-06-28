// ✅ app/api/get-available-lawyers/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export async function POST(req: NextRequest) {
  try {
    const { area } = await req.json();

    if (!area) {
      return NextResponse.json(
        { success: false, error: "Área de atuação é obrigatória." },
        { status: 400 }
      );
    }

    // 1. Buscar todos os usuários
    const res = await client.send(
      new ScanCommand({
        TableName: "users",
      })
    );

    // 2. Filtrar apenas advogados ativos que atuam na área
    const lawyers = (res.Items || [])
      .filter((user) => {
        const role = user.role?.S ?? "";
        const status = user.status?.S ?? "";
        const areas = user.practiceAreas?.L?.map((a) => a.S || "") ?? [];
        return role === "lawyer" && status === "active" && areas.includes(area);
      })
      .map((user) => ({
        id: user.id?.S ?? "",
        name: `${user.firstName?.S ?? ""} ${user.lastName?.S ?? ""}`.trim(),
      }));

    // 3. Enriquecer com disponibilidade
    const enrichedLawyers = await Promise.all(
      lawyers.map(async (lawyer) => {
        const availabilityRes = await client.send(
          new GetItemCommand({
            TableName: "lawyer_availability",
            Key: { lawyerId: { S: lawyer.id } },
          })
        );

        const availabilityItem = availabilityRes.Item ?? {};

        const availability: Record<string, string[]> = {};

        const weeklySchedule = availabilityItem.weeklySchedule?.M;

        if (weeklySchedule) {
          Object.entries(weeklySchedule).forEach(([day, value]) => {
            if (value?.L) {
              availability[day] = value.L.map((h: any) => h.S);
            }
          });
        }

        return {
          ...lawyer,
          availability,
        };
      })
    );

    return NextResponse.json({
      success: true,
      lawyers: enrichedLawyers,
    });
  } catch (err: any) {
    console.error("Erro em /api/get-available-lawyers:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
