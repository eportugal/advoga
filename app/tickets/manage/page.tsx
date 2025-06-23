"use client";

import { useEffect, useState } from "react";
import { withRoleGuard } from "@/app/utils/withRoleGuard";
import { useProfile } from "@/app/contexts/ProvideProfile";
import TicketModal from "../../components/TicketModal";

type Ticket = {
  ticketId: string;
  userEmail: string;
  userName: string;
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

function TicketsManagePage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReplyField, setShowReplyField] = useState(false);
  const { profile } = useProfile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/get-tickets");
      const data = await res.json();
      const sorted = (data.tickets || []).sort(
        (a: Ticket, b: Ticket) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTickets(sorted);
    };
    load();
  }, []);

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
        {/* Lista de Tickets */}
        <main className="flex-1 overflow-y-auto p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Novos tickets
          </h1>

          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="flex items-start justify-between bg-white p-4 rounded border border-gray-200 hover:shadow transition"
              >
                <div className="flex items-start">
                  <div>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded mr-2">
                        {ticket.status}
                      </span>
                      <span>{timeAgo(ticket.createdAt)}</span>
                      <span className="mx-2">·</span>
                      <span className="text-green-600">{ticket.userEmail}</span>
                    </div>

                    <div className="text-md font-bold text-green-700 mb-1">
                      {ticket.subject}
                    </div>

                    <div className="mt-1 text-sm text-gray-500 italic break-words">
                      {ticket.text}
                    </div>

                    <div className="text-sm text-gray-700">
                      {ticket.userName}
                    </div>
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
          </div>
        </main>

        {/* Modal lateral com botão X */}
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

export default withRoleGuard(TicketsManagePage, ["lawyer"]);
