import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

// ⚙️ DynamoDB Client config
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
      cognitoSub,
      firstName,
      lastName,
      email,
      role: roleFromClient,
      creditsIA,
      creditsConsultoria,
    } = await req.json();

    const TABLE_NAME = "users"; // ✅ Confirme o nome exato

    let role: string = "regular";

    // ⚠️ Validar campos obrigatórios
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Email inválido." },
        { status: 400 }
      );
    }

    // ✅ 1) Checar duplicidade via GSI `email-index`
    const existingUserQuery = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: cleanEmail },
      },
      Limit: 1,
    });

    const existingUser = await client.send(existingUserQuery);
    console.log(
      "[create-user] Verificação de duplicidade:",
      existingUser.Items
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return NextResponse.json(
        { success: false, error: "Usuário já existe com este email." },
        { status: 409 }
      );
    }

    // ✅ 2) Incrementar o counter para gerar ID sequencial
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

    const updateRes = await client.send(updateCounterCommand);
    const newId = updateRes.Attributes!.currentValue.N;

    if (!newId) throw new Error("Não foi possível gerar novo ID.");

    // ✅ 3) Criar usuário no DynamoDB com o sub do Cognito
    const createUserCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        id: { S: newId },
        ...(cognitoSub ? { cognitoSub: { S: cognitoSub } } : {}), // ✅ Só se vier
        firstName: { S: firstName.trim() },
        lastName: { S: lastName.trim() },
        email: { S: cleanEmail },
        status: { S: "pending" },
        role: { S: role },
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
        creditsIA: { N: "3" },
        creditsConsultoria: { N: "3" },
      },
      ConditionExpression: "attribute_not_exists(id)", // Garante ID único
    });

    await client.send(createUserCommand);

    console.log(`[create-user] Usuário criado ID ${newId}`);

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Usuário criado com sucesso.",
      user: {
        id: newId,
        cognitoSub,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        status: "pending",
        creditsIA: creditsIA,
        creditsConsultoria: creditsConsultoria,
      },
    });
  } catch (error: any) {
    console.error("[create-user] Erro:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return NextResponse.json(
        { success: false, error: "Usuário já existe (ID duplicado)." },
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
