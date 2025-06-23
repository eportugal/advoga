"use client";

import { useState } from "react";
import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
  getCurrentUser,
} from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useProfile } from "../contexts/ProvideProfile"; // ✅ novo!
import { useProvideAuth } from "../contexts/ProvideAuth";

Amplify.configure(outputs);

export default function SignUpFlow() {
  const router = useRouter();
  const { refreshProfile } = useProfile(); // ✅ pega refresh do contexto
  const { refresh } = useProvideAuth();
  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const resetError = () => setError("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // ✅ 1️⃣ Criar no banco + Cognito
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      const cleanEmail = email.toLowerCase().trim();

      // 1️⃣ Cria no banco
      const dbRes = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
        }),
      });

      const dbData = await dbRes.json();

      if (!dbRes.ok || !dbData.success) {
        throw new Error(dbData.error || "Erro ao criar usuário no banco");
      }

      setUserId(dbData.id);

      // 2️⃣ Cria no Cognito
      await signUp({
        username: cleanEmail,
        password,
        options: {
          userAttributes: {
            email: cleanEmail,
            given_name: firstName.trim(),
            family_name: lastName.trim(),
          },
        },
      });

      setSuccess("Código de confirmação enviado para seu email!");
      setStep("confirm");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2️⃣ Confirmar + atualizar banco + login + refreshProfile
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();

      // Confirma no Cognito
      await confirmSignUp({
        username: cleanEmail,
        confirmationCode: confirmationCode.trim(),
      });

      // Login Cognito
      await signIn({ username: cleanEmail, password });

      // Pega o sub garantido
      const currentUser = await getCurrentUser();

      // Atualiza status no banco
      if (userId) {
        await fetch("/api/update-user-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            status: "active",
            cognitoSub: currentUser.userId,
          }),
        });
      } else {
        console.warn("Nenhum ID de usuário salvo para atualizar status");
      }

      // ✅ Força atualizar o contexto Profile na hora
      await refreshProfile();
      await refresh();

      // Redireciona
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    resetMessages();

    try {
      await resendSignUpCode({
        username: email.toLowerCase().trim(),
      });
      setSuccess("Novo código enviado!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao reenviar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-black text-center">
        Criar Conta
      </h2>

      {step === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sobrenome"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            {loading ? "Criando..." : "Criar Conta"}
          </button>
        </form>
      )}

      {step === "confirm" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Código de Confirmação"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            {loading ? "Confirmando..." : "Confirmar e Entrar"}
          </button>
          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="w-full text-sm text-blue-600 hover:underline"
          >
            Reenviar Código
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
          {success}
        </p>
      )}
    </div>
  );
}
