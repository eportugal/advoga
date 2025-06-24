"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth"; // ✅ Usa o hook correto

export default function PainelLawyer() {
  const { user, isAuthenticated, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/list-tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    };
    load();
  }, []);

  const handleRespond = async () => {
    if (!selected) return;
    const res = await fetch("/api/respond-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, response }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Resposta enviada!");
      setResponse("");
      setSelected(null);
    }
  };

  // ✅ Garante que só advogado veja o painel
  if (!isAuthenticated) return <p>Faça login como advogado.</p>;
  if (profile !== "advogado")
    return <p>Você não tem permissão para acessar este painel.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Painel do Advogado</h1>
      <ul className="space-y-4">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="border p-4 rounded cursor-pointer bg-white"
            onClick={() => setSelected(t)}
          >
            <h3 className="font-bold">{t.title}</h3>
            <p>{t.description}</p>
            <p className="text-sm text-gray-600">Status: {t.status}</p>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Responder Chamado</h2>
          <p className="mb-2">
            <strong>{selected.title}</strong>: {selected.description}
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full border p-2 mb-4"
          />
          <button
            onClick={handleRespond}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Enviar Resposta
          </button>
        </div>
      )}
    </div>
  );
}
