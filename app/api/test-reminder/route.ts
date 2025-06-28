// /app/api/test-reminder/route.ts
import { NextResponse } from "next/server";
import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";

export async function GET() {
  const scheduler = new SchedulerClient({ region: "us-east-2" });
  const appointmentId = "bc033ff0-f266-4c56-b317-2819c3cef436";

  // Gerar data sem milissegundos e sem "Z"
  const now = new Date();
  now.setMinutes(now.getMinutes() + 2);
  const dateTimeISO = now.toISOString().split(".")[0]; // 👈 sem milissegundos e sem Z

  const scheduleName = `reminder-${appointmentId}`;

  const input = {
    Name: scheduleName,
    GroupName: "default",
    ScheduleExpression: `at(${dateTimeISO})`,
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    Target: {
      Arn: "arn:aws:lambda:us-east-2:941377122403:function:sendAppointmentReminder",
      RoleArn: "arn:aws:iam::941377122403:role/service-role/sendAppointmentReminder-role-qnt8jleg",
      Input: JSON.stringify({ appointmentId }),
    },
  };

  try {
    const command = new CreateScheduleCommand(input);
    const response = await scheduler.send(command);
    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    console.error("Erro ao criar cronograma:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
