"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import TicketModal from "../../components/TicketModal";
import type { Ticket } from "@/app/types/Ticket";
import {
  Button,
  Chip,
  CircularProgress,
  Container,
  Typography,
  Box,
  Paper,
  Skeleton,
} from "@mui/material";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return `agora mesmo`;
  if (diffMin < 60) return `há ${diffMin} min atrás`;
  if (diffHrs < 24) return `há ${diffHrs} hora${diffHrs > 1 ? "s" : ""} atrás`;
  return `há ${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;
}

export default function TicketsManagePage() {
  const router = useRouter();
  const { isAuthenticated, profile, user } = useAuth();
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReplyField, setShowReplyField] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);

  useEffect(() => {
    const loadDbUser = async () => {
      if (!user) return;
      const email = user.signInDetails?.loginId;
      if (!email) return;

      const res = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setDbUserId(data.user.id);
        setPracticeAreas(data.user.practiceAreas || []);
      }
    };

    loadDbUser();
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile !== "advogado") {
      router.replace("/");
    } else if (practiceAreas.length > 0) {
      loadTickets(true);
    }
  }, [isAuthenticated, profile, practiceAreas]);

  const loadTickets = async (initial = false) => {
    if (initial) {
      setIsInitialLoading(true);
      setLastKey(null);
      setTickets([]);
    }
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("limit", "5");

      if (!initial && lastKey) params.set("lastKey", lastKey);

      // Adiciona filtros de áreas
      practiceAreas.forEach((area) => {
        params.append("area", area);
      });

      const res = await fetch(`/api/get-tickets?${params.toString()}`);
      const data = await res.json();

      const sorted = (data.tickets || []).sort(
        (a: Ticket, b: Ticket) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTickets((prev) => (initial ? sorted : [...prev, ...sorted]));
      setLastKey(data.lastKey ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (initial) setIsInitialLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert("Digite sua resposta antes de enviar.");
      return;
    }

    if (!dbUserId) {
      alert("Informações do advogado não encontradas.");
      return;
    }

    try {
      const res = await fetch("/api/respond-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket?.ticketId,
          reply: replyText,
          lawyerId: dbUserId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Resposta enviada com sucesso!");
        setReplyText("");
        setShowReplyField(false);
      } else {
        alert(data.error || "Falha ao enviar resposta.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar resposta.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      const res = await fetch("/api/update-ticket-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.ticketId === selectedTicket.ticketId
              ? { ...t, status: newStatus }
              : t
          )
        );
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box className="bg-gray-50 mt-16">
      <Container maxWidth="lg" className="h-screen flex px-4">
        <main className="flex-1 overflow-y-auto py-8">
          <Typography
            marginBottom={2}
            variant="h5"
            className="font-bold text-gray-800"
          >
            Novos tickets
          </Typography>

          <Box className="space-y-6">
            {isInitialLoading && (
              <>
                {[...Array(3)].map((_, i) => (
                  <Paper
                    key={i}
                    className="border p-4 border-gray-200 hover:shadow transition"
                  >
                    <Box className="mb-2 flex justify-between gap-2">
                      <Box width="88%">
                        <Box className="flex">
                          <Skeleton variant="text" width="10%" height={20} />
                          <Skeleton
                            className="ml-2"
                            variant="text"
                            width="15%"
                            height={20}
                          />
                          <Skeleton
                            className="ml-2"
                            variant="text"
                            width="20%"
                            height={20}
                          />
                        </Box>
                        <Skeleton variant="text" width="30%" height={20} />
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                      <Skeleton variant="rounded" width={98} height={40} />
                    </Box>
                  </Paper>
                ))}
              </>
            )}

            {!isInitialLoading && tickets.length === 0 && (
              <Typography className="text-gray-500 text-center">
                Nenhum ticket encontrado.
              </Typography>
            )}

            {tickets.map((ticket) => (
              <Paper
                key={ticket.ticketId}
                className="p-4 border border-gray-200 hover:shadow transition"
              >
                <Box className="flex justify-between">
                  <Box>
                    <Box className="flex items-center text-xs text-gray-500 mb-1 gap-2">
                      <Chip
                        label={ticket.status}
                        size="small"
                        className="bg-gray-200 text-gray-700"
                      />
                      <span>{timeAgo(ticket.createdAt)}</span>
                      <span className="text-color-primary">
                        {ticket.user?.email || "Usuário não identificado"}
                      </span>
                      <span className="text-color-primary">
                        {ticket.area || "em branco"}
                      </span>
                    </Box>

                    <Typography className="text-md font-bold text-green-700 mb-1">
                      {ticket.subject}
                    </Typography>

                    <Typography className="text-sm text-gray-500 italic break-words">
                      {ticket.text}
                    </Typography>

                    <Typography className="text-sm text-gray-700">
                      {ticket.user?.name || "Nome não disponível"}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyText("");
                    }}
                    className="text-xs h-10"
                  >
                    Responder
                  </Button>
                </Box>
              </Paper>
            ))}

            {lastKey && !isInitialLoading && (
              <Button
                onClick={() => loadTickets(false)}
                disabled={loading}
                variant="contained"
                color="success"
                size="small"
                className="mt-8 text-xs"
              >
                {loading ? "Carregando..." : "Ver mais"}
              </Button>
            )}
          </Box>
        </main>

        {selectedTicket && (
          <TicketModal
            ticket={selectedTicket}
            replyText={replyText}
            showReplyField={showReplyField}
            onClose={() => {
              setSelectedTicket(null);
              setShowReplyField(false);
              setReplyText("");
            }}
            onStatusChange={handleStatusChange}
            onReplyChange={setReplyText}
            onSendReply={handleSendReply}
            onShowReplyField={() => setShowReplyField(true)}
          />
        )}
      </Container>
    </Box>
  );
}
