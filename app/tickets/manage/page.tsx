"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import TicketModal from "../../components/TicketModal";

type Ticket = {
  ticketId: string;
  user: {
    name: string;
    email: string;
  } | null;
  subject: string;
  text: string;
  status: string;
  createdAt: string;
};

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
  const { isAuthenticated, profile } = useAuth();
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReplyField, setShowReplyField] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile !== "advogado") {
      router.replace("/");
    } else {
      loadTickets(true);
    }
  }, [isAuthenticated, profile, router]);

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

    try {
      const res = await fetch("/api/respond-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket?.ticketId,
          reply: replyText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Resposta enviada com sucesso!");
        setReplyText("");
        setShowReplyField(false);
      } else {
        alert("Falha ao enviar resposta.");
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
    <div className="bg-gray-50">
      <div className="flex h-screen mt-16 max-w-7xl mx-auto px-4">
        <main className="flex-1 h-full overflow-y-auto p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Novos tickets
          </h1>

          <div className="space-y-6">
            {isInitialLoading && (
              <div className="text-gray-500 text-center">
                Carregando tickets...
              </div>
            )}

            {!isInitialLoading && tickets.length === 0 && (
              <div className="text-gray-500 text-center">
                Nenhum ticket encontrado.
              </div>
            )}

            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="flex items-start justify-between bg-white p-4 rounded border border-gray-200 hover:shadow transition"
              >
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded mr-2">
                      {ticket.status}
                    </span>
                    <span>{timeAgo(ticket.createdAt)}</span>
                    <span className="text-green-600 ml-2">
                      {ticket.user?.email}
                    </span>
                  </div>

                  <div className="text-md font-bold text-green-700 mb-1">
                    {ticket.subject}
                  </div>

                  <div className="mt-1 text-sm text-gray-500 italic break-words">
                    {ticket.text}
                  </div>

                  <div className="text-sm text-gray-700">
                    {ticket.user?.name}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setReplyText("");
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-2 rounded shadow-sm"
                >
                  Responder
                </button>
              </div>
            ))}

            {lastKey && !isInitialLoading && (
              <button
                onClick={() => loadTickets(false)}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 mt-8 text-white text-xs px-4 py-2 rounded shadow-sm"
              >
                {loading ? "Carregando..." : "Ver mais"}
              </button>
            )}
          </div>
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
      </div>
    </div>
  );
}
