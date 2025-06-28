// ✅ app/api/get-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role"); // ex: lawyer
    const rawArea = searchParams.get("area"); // ex: Direito-de-Familia

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/-/g, " "); // troca hífen por espaço

    const areaFilter = rawArea ? normalize(rawArea) : null;

    const res = await client.send(
      new ScanCommand({
        TableName: "users",
      })
    );

    const users = (res.Items || []).map((user) => ({
      id: user.id.S,
      email: user.email.S,
      role: user.role?.S ?? "regular",
      status: user.status?.S ?? "active",
      firstName: user.firstName?.S ?? null,
      lastName: user.lastName?.S ?? null,
      practiceAreas: user.practiceAreas?.L?.map((a) => a.S ?? "") ?? [],
    }));

    let filteredUsers = users;

    if (roleFilter) {
      filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
    }

    if (areaFilter) {
      filteredUsers = filteredUsers.filter((u) =>
        u.practiceAreas.some((area) => normalize(area ?? "") === areaFilter)
      );
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
    });
  } catch (err: any) {
    console.error("❌ Erro em /api/get-users:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
