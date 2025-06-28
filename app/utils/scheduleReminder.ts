import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";

const scheduler = new SchedulerClient({ region: process.env.AWS_REGION });

export async function createReminderSchedule(appointmentId: string, dateTimeISO: string) {
  const scheduleName = `reminder-${appointmentId}`;

  // ✅ Remove os milissegundos para evitar erro de ScheduleExpression inválida
  const cleanISO = dateTimeISO.split(".")[0] + "Z";

  const input = {
    Name: scheduleName,
    GroupName: "default",
    ScheduleExpression: `at(${cleanISO})`,
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
    console.log("✅ Cronograma criado com sucesso:", response);
    return { success: true, scheduleName };
  } catch (error) {
    console.error("❌ Erro ao criar cronograma:", error);
    return { success: false, error };
  }
}
