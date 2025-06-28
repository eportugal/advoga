"use client";

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CheckCircle, Sparkles, Send, MessageCircle, Plus } from "lucide-react";
import ErrorModal from "../components/modal/ErrorModal";
import ScheduleModal from "../components/modal/ScheduleModal";

export default function LandingPage() {
  const { isAuthenticated, dbUser, isLoading } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [summary, setSummary] = useState("");
  const [area, setArea] = useState("");
  const [explanation, setExplanation] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [modalReason, setModalReason] = useState<"ia" | "ticket" | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<
    { day: string; hour: string }[]
  >([]);

  const creditsIA = Number(dbUser?.creditsIA ?? 0);
  const creditsConsultoria = Number(dbUser?.creditsConsultoria ?? 0);

  const handleSubmit = async () => {
    if (!question.trim() || !dbUser?.id) return;

    if (creditsIA <= 0) {
      setModalReason("ia");
      setShowCreditsModal(true);
      return;
    }

    setLoadingAnswer(true);
    setAnswer("");
    setSummary("");
    setArea("");
    setExplanation("");
    setTicketId(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userId: dbUser.id }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setAnswer(data.answerIA);
      setSummary(data.summary);
      setExplanation(data.explanation);
      setArea(data.area);
      setTicketId(data.ticketId);
      setSuccess(true);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleCreateTicketClick = async () => {
    if (creditsConsultoria <= 0) {
      setModalReason("ticket");
      setShowCreditsModal(true);
      return;
    }

    try {
      const res = await fetch("/api/get-available-lawyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const uniqueTimes: Set<string> = new Set();
      const times: { day: string; hour: string }[] = [];
      data.lawyers.forEach((lawyer: any) => {
        const availability = lawyer.availability || {};
        (Object.entries(availability) as [string, string[]][]).forEach(
          ([day, hours]) => {
            hours.forEach((hour) => {
              const key = `${day}-${hour}`;
              if (!uniqueTimes.has(key)) {
                uniqueTimes.add(key);
                times.push({ day, hour });
              }
            });
          }
        );
      });

      setAvailableTimes(times);
      setShowScheduleModal(true);
    } catch (err) {
      console.error("Erro ao buscar advogados:", err);
    }
  };

  const handleScheduleConfirm = async (day: string, hour: string) => {
    setShowScheduleModal(false);

    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser?.id,
          text: question,
          area,
          summary,
          explanation,
          answerIA: answer,
          type: "ticket",
          day,
          hour,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      alert("Ticket criado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar ticket com agendamento:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
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
            <label className="text-lg font-semibold text-white mb-3 flex items-center">
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2"
              >
                {loadingAnswer ? (
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
                onClick={() => router.push("/signup/regular")}
                className="flex-1 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg text-center border border-white/20 transition-all duration-300"
              >
                Criar conta para Acesso Completo
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
                <button
                  onClick={handleCreateTicketClick}
                  className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-lg font-medium flex justify-center items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Transformar em Ticket</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ErrorModal
        open={showCreditsModal}
        title="Créditos insuficientes"
        message={
          modalReason === "ia"
            ? "Você usou todos os seus créditos de consulta com IA."
            : "Você precisa de créditos de consultoria para transformar essa dúvida em ticket."
        }
        onClose={() => setShowCreditsModal(false)}
        onConfirm={() => {
          setShowCreditsModal(false);
          router.push("/signup/regular");
        }}
        confirmText="Adicionar Créditos"
        cancelText="Fechar"
      />

      <ScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
        availableTimes={availableTimes}
      />

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
