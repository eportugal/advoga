// utils/checkRole.ts
import { getCurrentUser } from "aws-amplify/auth";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function checkRole(
  requiredRole: string
): Promise<{ email: string; role: string }> {
  const currentUser = await getCurrentUser();
  const email = currentUser.signInDetails?.loginId;
  if (!email) throw new Error("Not authenticated");

  const res = await client.send(
    new QueryCommand({
      TableName: "users",
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
      Limit: 1,
    })
  );

  const user = res.Items?.[0];
  const role = user?.role?.S ?? "regular";

  if (role !== requiredRole) throw new Error("Forbidden");

  return { email, role };
}
