"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/app/types/Ticket";

function Accordion({
  reply,
  lawyerName,
}: {
  reply: string;
  lawyerName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 border-t pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-blue-600 hover:underline"
      >
        {open ? "Ocultar resposta" : "Ver resposta"}
      </button>
      {open && (
        <p className="mt-2 text-sm text-green-700">
          <strong>
            {lawyerName ? `Dr. ${lawyerName}` : "Advogado"} respondeu:
          </strong>{" "}
          {reply}
        </p>
      )}
    </div>
  );
}

// Função auxiliar para mostrar tempo relativo
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
  const { isAuthenticated, profile, dbUser } = useAuth(); // ✅ usa dbUser direto
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Proteger rota
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile !== "regular") {
      router.replace("/");
    }
  }, [isAuthenticated, profile, router]);

  // Carregar tickets do usuário
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

  // Recarregar quando dbUser mudar
  useEffect(() => {
    if (dbUser?.id) {
      fetchTickets(dbUser.id);
    }
  }, [dbUser]);

  // Criar ticket
  const handleCreate = async () => {
    if (!subject.trim() || !text.trim()) {
      setError("Preencha todos os campos.");
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
          userId: dbUser.id, // ✅ usa do auth
          subject: subject.trim(),
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      alert("Ticket criado com sucesso!");
      setSubject("");
      setText("");

      // Recarregar lista
      await fetchTickets(dbUser.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 mt-16 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Meus Tickets</h1>

      {/* Formulário */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Assunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-4 border rounded mb-4"
        />

        <textarea
          placeholder="Descreva sua dúvida"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 border rounded mb-4"
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* Lista de tickets */}
      <h2 className="text-xl font-semibold mb-4">Tickets enviados</h2>
      <div className="space-y-4">
        {tickets.length === 0 && (
          <p className="text-gray-500">Nenhum ticket enviado ainda.</p>
        )}

        {tickets.map((ticket) => (
          <div
            key={ticket.ticketId}
            className="border p-4 rounded bg-white shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-black">{ticket.subject}</h3>
              <span className="text-sm px-2 py-1 rounded bg-gray-200 text-gray-800">
                {ticket.status}
              </span>
            </div>

            <p className="mb-2 text-gray-700">{ticket.text}</p>

            <p className="text-xs text-gray-500 mb-1">
              Criado: {timeAgo(ticket.createdAt)}
            </p>

            {ticket.reply ? (
              <Accordion reply={ticket.reply} lawyerName={ticket.lawyerName} />
            ) : (
              <p className="text-sm text-yellow-600">
                Aguardando resposta do advogado.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
