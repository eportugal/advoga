"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { withRoleGuard } from "../../utils/withRoleGuard";

function CreateTicketPage() {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Pega do Cognito + get-user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const cognito = await getCurrentUser();
        const email = cognito.signInDetails?.loginId;
        if (email) {
          const res = await fetch("/api/get-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setError("Usuário não encontrado.");
          }
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar usuário.");
      }
    };

    fetchUser();
  }, []);

  // ✅ Criar ticket
  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, subject, text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      alert("Ticket criado com sucesso!");
      setSubject("");
      setText("");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 mt-16">
      <h1 className="text-2xl font-bold mb-4">Criar Ticket</h1>
      <input
        type="text"
        placeholder="Assunto do ticket"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full p-4 border rounded mb-4"
      />

      <textarea
        placeholder="Descreva o problema"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-4 border rounded mb-4"
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? "Criando..." : "Enviar"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default withRoleGuard(CreateTicketPage, ["regular"]);
