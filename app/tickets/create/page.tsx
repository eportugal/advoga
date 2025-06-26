"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/app/types/Ticket";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Container,
  Accordion as MuiAccordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function Accordion({
  reply,
  lawyerName,
}: {
  reply: string;
  lawyerName?: string | null;
}) {
  return (
    <MuiAccordion className="border-t mt-2" disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} className="p-0">
        <Typography className="text-sm text-blue-600">Ver resposta</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography className="text-sm text-green-700">
          <strong>
            {lawyerName ? `Dr. ${lawyerName}` : "Advogado"} respondeu:
          </strong>{" "}
          {reply}
        </Typography>
      </AccordionDetails>
    </MuiAccordion>
  );
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return `agora mesmo`;
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHrs < 24) return `há ${diffHrs} hora${diffHrs > 1 ? "s" : ""}`;
  return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
}

export default function CreateTicketPage() {
  const { isAuthenticated, profile, dbUser } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile !== "regular") {
      router.replace("/");
    }
  }, [isAuthenticated, profile, router]);

  const fetchTickets = async (userId: string) => {
    try {
      const res = await fetch(`/api/get-user-tickets?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (dbUser?.id) {
      fetchTickets(dbUser.id);
    }
  }, [dbUser]);

  const handleCreate = async () => {
    if (!text.trim()) {
      setError("Preencha a informação.");
      return;
    }

    if (!dbUser?.id) {
      setError("ID do usuário não encontrado.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert("Ticket criado com sucesso!");
      setText("");
      await fetchTickets(dbUser.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" className="mt-16 p-8">
      <Typography variant="h5" className="mb-4 font-bold">
        Meus Tickets
      </Typography>

      <Box className="mb-8">
        <TextField
          fullWidth
          placeholder="Descreva sua dúvida"
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          rows={4}
          className="mb-4"
        />

        <Button
          variant="contained"
          size="small"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar"}
        </Button>

        {error && (
          <Typography className="text-red-500 mt-4">{error}</Typography>
        )}
      </Box>

      <Typography variant="h6" className="mb-4 font-semibold">
        Tickets enviados
      </Typography>
      <Box className="space-y-4">
        {tickets.length === 0 && (
          <Typography className="text-gray-500">
            Nenhum ticket enviado ainda.
          </Typography>
        )}

        {tickets.map((ticket) => (
          <Paper key={ticket.ticketId} className="p-4 shadow-sm">
            <Box className="flex justify-between items-center mb-2">
              <Box className="text-sm px-2 py-1 rounded bg-gray-200 text-gray-800">
                {ticket.status}
              </Box>
            </Box>

            <Typography className="mb-2 text-gray-700">
              {ticket.text}
            </Typography>
            <Typography className="text-xs text-gray-500 mb-1">
              Criado: {timeAgo(ticket.createdAt)}
            </Typography>

            {ticket.reply ? (
              <Accordion reply={ticket.reply} lawyerName={ticket.lawyerName} />
            ) : (
              <Typography className="text-sm text-yellow-600">
                Aguardando resposta do advogado.
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
