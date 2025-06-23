"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useProvideAuth } from "./../contexts/ProvideAuth";
import { useProfile } from "./../contexts/ProvideProfile"; // ✅

Amplify.configure(outputs);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useProvideAuth(); // ✅
  const { refreshProfile } = useProfile(); // ✅

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔑 1️⃣ Autentica no Cognito
      await signIn({ username: email, password });

      // 🔑 2️⃣ Garante que o contexto Auth atualize (JWT, session)
      await refresh();

      // 🔑 3️⃣ Garante que o contexto Profile atualize (nome, role)
      await refreshProfile();

      // 🔑 4️⃣ Redireciona depois que tudo está limpo
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Voltar
      </Link>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">
            Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
