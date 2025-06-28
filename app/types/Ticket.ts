export type Ticket = {
  ticketId: string;
  userId: string | null;
  user: {
    name: string;
    email: string;
  } | null;
  text: string;
  status: string;
  createdAt: string;
  reply: string | null;
  lawyerName: string | null;
  area: string | null;
  summary: string | null;
};
