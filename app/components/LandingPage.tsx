"use client";

import React, { useState } from "react";
import { useProvideAuth } from "../contexts/AuthProvider";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CheckCircle, Sparkles, Send, MessageCircle } from "lucide-react";
import NavBar from "./NavBar";

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useProvideAuth();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔑 Se estiver logado: ir para a área do cliente; senão: signup
  const handleLoginClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard"); // exemplo: área do cliente
    } else {
      router.push("/signup");
    }
  };

  // 🔑 Logout usa signOut do contexto (já funciona)
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    setSuccess(false);

    try {
      const res = await fetch("/api/ask-mistral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        setAnswer((prev) => prev + chunk);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* ✅ NavBar lê do contexto — não precisa passar props */}
      <NavBar />

      {/* Efeitos de fundo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col pt-16">
        <div className="flex-1 px-4 py-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-blue-300/30 mb-6">
              <Sparkles className="h-4 w-4 text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">
                Powered by AI
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Obtenha Orientação Jurídica Especializada
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Quando Você Mais Precisa
              </span>
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Faça sua pergunta jurídica e receba uma resposta instantânea da
              IA.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-3xl mx-auto">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-300" />
              Qual é a sua dúvida jurídica?
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Descreva sua situação com detalhes..."
              className="w-full h-32 p-4 bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-400 text-white placeholder-blue-200 text-lg resize-none"
            />

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Consultando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Obter Ajuda Jurídica Agora</span>
                  </>
                )}
              </button>
              <button
                onClick={handleLoginClick}
                className="flex-1 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg text-center border border-white/20 transition-all duration-300"
              >
                {isAuthenticated
                  ? "Área do Cliente"
                  : "Criar conta para Acesso Completo"}
              </button>
            </div>

            {success && answer && (
              <div className="mt-8 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-md border border-emerald-300/30 rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-emerald-500 rounded-xl mr-3">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Resposta da IA
                    </h3>
                    <p className="text-emerald-200 text-sm">
                      Análise jurídica especializada
                    </p>
                  </div>
                </div>
                <div className="text-white/90 leading-relaxed">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
