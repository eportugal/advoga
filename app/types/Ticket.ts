export type Ticket = {
  ticketId: string;
  userId: string | null;
  user: {
    name: string;
    email: string;
  } | null;
  subject: string;
  text: string;
  status: string;
  createdAt: string;
  reply: string | null;
  lawyerName: string | null;
  area: string | null; // 👈 adicione essa linha
};
