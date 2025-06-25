// app/api/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

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
      firstName,
      lastName,
      email,
      role: roleFromClient,
      practiceAreas,
    } = await req.json();

    let role: string = "lawyer";

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.toLowerCase().trim();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Email inválido." },
        { status: 400 }
      );
    }

    // Verificar duplicidade via GSI (opcional)
    try {
      const existingUserQuery = new QueryCommand({
        TableName: "user",
        IndexName: "email-index", // GSI configurado no DynamoDB
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: cleanEmail },
        },
        Limit: 1,
      });

      const existingUser = await client.send(existingUserQuery);

      if (existingUser.Items && existingUser.Items.length > 0) {
        return NextResponse.json(
          { success: false, error: "Usuário já existe com este email." },
          { status: 409 }
        );
      }
    } catch (queryError) {
      console.log("[create-user] GSI check falhou (ignorando):", queryError);
    }

    // Incrementa o counter
    const updateCounterCommand = new UpdateItemCommand({
      TableName: "counters",
      Key: { counterName: { S: "userId" } },
      UpdateExpression:
        "SET currentValue = if_not_exists(currentValue, :zero) + :inc",
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":inc": { N: "1" },
      },
      ReturnValues: "UPDATED_NEW",
    });

    console.log("[create-user] Incrementando counter...");
    const updateRes = await client.send(updateCounterCommand);
    const newId = updateRes.Attributes!.currentValue.N;

    if (!newId) throw new Error("Não foi possível gerar novo ID.");
    if (!Array.isArray(practiceAreas) || practiceAreas.length === 0) {
      return NextResponse.json(
        { success: false, error: "Selecione ao menos uma área de atuação." },
        { status: 400 }
      );
    }
    const createUserCommand = new PutItemCommand({
      TableName: "users",
      Item: {
        id: { S: newId },
        firstName: { S: firstName.trim() },
        lastName: { S: lastName.trim() },
        email: { S: cleanEmail },
        status: { S: "pending" },
        role: { S: role },
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
        practiceAreas: {
          L: practiceAreas.map((area: string) => ({ S: area.trim() })),
        },
      },
      ConditionExpression: "attribute_not_exists(id)",
    });

    console.log(`[create-user] Criando usuário ID ${newId}...`);
    await client.send(createUserCommand);

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Usuário criado com sucesso.",
      user: {
        id: newId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        status: "pending",
      },
    });
  } catch (error: any) {
    console.error("[create-user] Erro:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return NextResponse.json(
        { success: false, error: "Usuário já existe." },
        { status: 409 }
      );
    }
    if (error.name === "ValidationException") {
      return NextResponse.json(
        { success: false, error: "Dados inválidos." },
        { status: 400 }
      );
    }
    if (error.name === "ResourceNotFoundException") {
      return NextResponse.json(
        { success: false, error: "Tabela não encontrada." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
