"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  Chip,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import DashboardCard from "../components/DashboardCard";

import type { Ticket } from "@/app/types/Ticket";

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

export default function DashboardPage() {
  const { dbUser, profile, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const firstName = dbUser?.firstName
    ? capitalize(dbUser.firstName)
    : "Usuário";

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

  return (
    <Box className="bg-gray-50 h-screen">
      <Container maxWidth="lg" className="py-10">
        <Grid container justifyContent="space-between">
          <Typography marginBottom={4} variant="h4" className="font-bold">
            Olá, {firstName}! 👋
          </Typography>
          <Box className="flex flex-wrap gap-2">
            <Button
              size="small"
              variant="contained"
              startIcon={<Sparkles />}
              onClick={() => router.push("/chat")}
            >
              Perguntar à IA
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<MessageCircle />}
              onClick={() => router.push("/tickets/create")}
            >
              Abrir Consultoria
            </Button>
          </Box>
        </Grid>

        {profile === "regular" && (
          <Box className="flex flex-col gap-8">
            {/* Créditos */}
            <Box>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography variant="h6" className="font-semibold mb-2">
                    Seus Créditos
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DashboardCard
                    amount={dbUser.creditsIA ?? 0}
                    label="Créditos IA"
                    icon={Sparkles}
                    iconColor="#f59e0b"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DashboardCard
                    amount={dbUser.creditsConsultoria ?? 0}
                    label="Créditos Consultoria"
                    icon={MessageCircle}
                    iconColor="#f43f5e"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Últimos tickets */}
            <Grid>
              <Paper className="p-6" elevation={3}>
                <Typography
                  variant="subtitle1"
                  marginBottom={2}
                  className="font-medium"
                >
                  Últimos tickets abertos
                </Typography>
                {tickets.length === 0 ? (
                  <Typography className="text-gray-500">
                    Nenhum ticket enviado ainda.
                  </Typography>
                ) : (
                  <Box className="space-y-4">
                    {tickets.slice(0, 3).map((ticket) => (
                      <Paper
                        key={ticket.ticketId}
                        className="relative overflow-hidden rounded-3xl p-4 md:p-6 shadow-xl transition-all duration-500 ease-out bg-white/95 backdrop-blur-xl border border-white/30"
                        style={{ background: "rgba(255, 255, 255, 0.95)" }}
                      >
                        <Box className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 items-start md:items-center">
                          <Box className="flex flex-col md:flex-row justify-between gap-1 md:gap-4 items-start md:items-center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                whiteSpace: "normal",
                              }}
                            >
                              {ticket.text}
                            </Typography>

                            <Typography
                              variant="body2"
                              className="text-slate-500 shrink-0"
                            >
                              {timeAgo(ticket.createdAt)}
                            </Typography>
                          </Box>
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
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
