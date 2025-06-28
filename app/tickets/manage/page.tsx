"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import TicketModal from "../../components/TicketModal";
import type { Ticket } from "@/app/types/Ticket";
import {
  Button,
  Chip,
  Select,
  Container,
  Typography,
  Box,
  Paper,
  Skeleton,
  FormControl,
  MenuItem,
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const ticketsStatus = ["Novo", "Em Aberto", "Fechado"];

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
  }, [isAuthenticated, profile, practiceAreas, statusFilter]);

  const loadTickets = async (initial = false) => {
    if (initial) {
      setIsInitialLoading(true);
      setLastKey(null);
      setTickets([]);
    }
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("limit", "20");

      if (!initial && lastKey) params.set("lastKey", lastKey);

      // Adiciona filtros de áreas
      practiceAreas.forEach((area) => {
        params.append("area", area);
      });

      // ✅ Adiciona o filtro de status se estiver definido
      if (statusFilter) {
        params.set("status", statusFilter);
      }

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
      <Container maxWidth="lg" className="flex px-4">
        <main className="flex-1 overflow-y-auto py-8">
          <Typography
            marginBottom={2}
            variant="h5"
            className="font-bold text-gray-800"
          >
            Consultorias
          </Typography>
          <Box className="mb-4 flex gap-4 items-center">
            <Typography className="text-sm text-slate-600">
              Filtrar por status:
            </Typography>
            <FormControl size="small">
              <Select
                value={statusFilter ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value ? value : null); // null representa "Todos"
                }}
                displayEmpty
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {ticketsStatus.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

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

            {tickets.map((ticket, index) => (
              <Paper
                key={ticket.ticketId}
                className="relative overflow-hidden rounded-3xl p-8 shadow-2xl transition-all duration-500 ease-out hover:shadow-3xl bg-white/95 backdrop-blur-xl border border-white/30"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                }}
              >
                {/* Barra colorida animada no topo - só para status 'Novo' */}
                {ticket.status === "Novo" && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background:
                        "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981, #f59e0b)",
                      backgroundSize: "300% 100%",
                    }}
                  />
                )}

                <Box className="flex justify-between gap-8">
                  <Box className="flex-1">
                    {/* Header com status e informações */}
                    <Box className="flex items-center mb-6 gap-4 flex-wrap">
                      <Chip
                        label={ticket.status}
                        size="small"
                        className="text-white font-bold uppercase"
                        sx={{
                          backgroundColor:
                            ticket.status === "Novo"
                              ? "primary.main"
                              : ticket.status === "Em Aberto"
                              ? "warning.main"
                              : "success.main", // Concluído
                          color: "white",
                          fontSize: "8px",
                          letterSpacing: "1px",
                          lineHeight: "1",
                        }}
                      />

                      {/* Tag da área */}
                      <Chip
                        label={ticket.area || "Área não definida"}
                        size="small"
                        variant="outlined"
                        className="font-bold uppercase"
                        sx={{
                          color: "primary.main",
                          fontSize: "8px",
                          letterSpacing: "1px",
                          borderColor: "primary.main",
                          lineHeight: "1",
                        }}
                      />
                      <span className="text-slate-500 font-medium text-sm">
                        {timeAgo(ticket.createdAt)}
                      </span>
                    </Box>

                    {/* Descrição */}
                    <Typography className="text-slate-600 text-base leading-relaxed mb-6">
                      {ticket.summary}
                    </Typography>

                    {/* Informações do cliente */}
                    <div className="flex items-center gap-4 pt-6 border-t-2 border-dashed border-slate-200 mt-8">
                      {/* Avatar com iniciais */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-400 text-white font-bold text-lg shadow-sm">
                        <p className="text-sm">
                          {ticket.user?.name
                            ? ticket.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "UN"}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <Typography className="font-semibold text-slate-800">
                          {ticket.user?.name || "Nome não disponível"}
                        </Typography>
                        <Typography
                          className="text-slate-500 text-xs"
                          sx={{
                            fontSize: "12px",
                          }}
                        >
                          {ticket.user?.email || "Email não disponível"}
                        </Typography>
                      </div>
                    </div>
                  </Box>

                  {/* Botão responder */}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyText("");
                    }}
                    className="relative overflow-hidden h-12"
                  >
                    Ver detalhes
                  </Button>
                </Box>
              </Paper>
            ))}

            {lastKey && !isInitialLoading && (
              <Container className="flex justify-center items-center">
                <Button
                  onClick={() => loadTickets(false)}
                  disabled={loading}
                  variant="outlined"
                  size="small"
                  className="mt-8 text-xs h-10"
                  sx={{
                    color: "primary.main",
                  }}
                >
                  {loading ? "Carregando..." : "Ver mais"}
                </Button>
              </Container>
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
