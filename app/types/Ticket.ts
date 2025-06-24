// app/types/Ticket.ts

export type Ticket = {
  ticketId: string;
  userId?: string; // se usar para mapear dono
  user: {
    name: string;
    email: string;
  } | null;
  subject: string;
  text: string;
  status: string;
  reply?: string;
  lawyerName?: string;
  createdAt: string;
  respondedAt?: string;
};
