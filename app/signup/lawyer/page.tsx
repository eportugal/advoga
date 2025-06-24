"use client";

import React, { useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth"; // ✅ Hook correto

Amplify.configure(outputs);

// ✅ Função para validar OAB
function isValidOAB(oab: string): boolean {
  const trimmed = oab.trim().toUpperCase();
  const regex = /^(\d{1,7})[-\s/]?([A-Z]{2})$/;
  const match = trimmed.match(regex);
  if (!match) return false;

  const uf = match[2];
  const validUFs = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  return validUFs.includes(uf);
}

export default function SignUpFlowLawyer() {
  const router = useRouter();
  const { signUp, confirmSignUp, signIn, currentSession } = useAuth(); // ✅ Usar tudo do contexto

  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [oab, setOab] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetError = () => setError("");

  // ✅ 1️⃣ Criar no banco + Cognito via contexto
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanOAB = oab.trim().toUpperCase();

      if (!isValidOAB(cleanOAB)) {
        throw new Error("Número da OAB inválido. Exemplo: 12345/SP");
      }

      // Cria no banco
      const dbRes = await fetch("/api/create-lawyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          oab: cleanOAB,
        }),
      });
      const dbData = await dbRes.json();
      if (!dbData.success) throw new Error(dbData.error);
      setUserId(dbData.id);

      // Cria no Cognito via contexto
      const res = await signUp(
        cleanEmail,
        password,
        "advogado",
        firstName.trim(),
        lastName.trim()
      );
      if (!res.success) {
        throw new Error(res.message || "Erro no Cognito");
      }

      setStep("confirm");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2️⃣ Confirmar + login + update banco
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();

      // Confirma via contexto
      const confirmRes = await confirmSignUp(
        cleanEmail,
        confirmationCode.trim()
      );
      if (!confirmRes.success) {
        throw new Error(confirmRes.message || "Erro ao confirmar");
      }

      // Login via contexto
      const signInRes = await signIn(cleanEmail, password);
      if (!signInRes.success) {
        throw new Error(signInRes.message || "Erro no login");
      }

      // ✅ Pega o sub da sessão do contexto
      const session = await currentSession();
      if (!session.success) {
        throw new Error("Sessão inválida");
      }

      // Atualiza status no banco
      if (userId) {
        await fetch("/api/update-user-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            status: "active",
            cognitoSub: session.sub, // ✅ PEGA DA SESSION!
          }),
        });
      } else {
        console.warn("Nenhum ID de usuário salvo para atualizar status");
      }

      // ✅ Redireciona
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Cadastro de Advogado</h1>

      {step === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            placeholder="Nome"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full border p-2"
          />
          <input
            placeholder="Sobrenome"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full border p-2"
          />
          <input
            placeholder="OAB (ex: 12345/SP)"
            value={oab}
            onChange={(e) => setOab(e.target.value)}
            required
            className="w-full border p-2"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border p-2"
          />
          <input
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Criando..." : "Cadastrar"}
          </button>
        </form>
      )}

      {step === "confirm" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            placeholder="Código de Confirmação"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            required
            className="w-full border p-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Confirmando..." : "Confirmar e Entrar"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
