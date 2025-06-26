// app/api/get-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = email.toLowerCase().trim();

    const res = await client.send(
      new QueryCommand({
        TableName: "users",
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: cleanEmail },
        },
        Limit: 1,
      })
    );

    if (res.Items && res.Items.length > 0) {
      const user = res.Items[0];
      return NextResponse.json({
        success: true,
        user: {
          id: user.id.S,
          email: user.email.S,
          role: user.role?.S ?? "regular",
          firstName: user.firstName?.S ?? null,
          lastName: user.lastName?.S ?? null,
          practiceAreas: user.practiceAreas?.L?.map((item) => item.S) ?? [],
          creditsIA: user.creditsIA?.N ?? "0",
          creditsConsultoria: user.creditsConsultoria?.N ?? "0",
        },
      });
    }

    return NextResponse.json({ success: true, user: null });
  } catch (err: any) {
    console.error("Erro em /api/get-user:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
