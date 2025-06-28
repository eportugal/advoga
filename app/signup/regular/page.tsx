"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CheckCircle, Sparkles, Send, MessageCircle, Plus } from "lucide-react";
import NavBar from "../components/navbar/NavBar";
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
  const [lawyers, setLawyers] = useState([]);

  const creditsIA = Number(dbUser?.creditsIA ?? 0);
  const creditsConsultoria = Number(dbUser?.creditsConsultoria ?? 0);

  const handleCTA = () => {
    router.push("/signup/regular");
  };

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

  const handleOpenScheduleModal = async () => {
    if (creditsConsultoria <= 0) {
      setModalReason("ticket");
      setShowCreditsModal(true);
      return;
    }

    if (!area) return;

    try {
      const res = await fetch("/api/get-available-lawyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLawyers(data.lawyers);
      setShowScheduleModal(true);
    } catch (err) {
      console.error("Erro ao buscar advogados:", err);
    }
  };

  const handleConfirmSchedule = async (
    lawyerId: string,
    day: string,
    hour: string
  ) => {
    if (!question || !summary || !area || !answer || !dbUser?.id) return;

    try {
      const res = await fetch("/api/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUser.id,
          text: question,
          area,
          summary,
          explanation,
          answerIA: answer,
          type: "ticket",
          lawyerId,
          scheduleDay: day,
          scheduleHour: hour,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      alert("Ticket criado com sucesso!");
      setShowScheduleModal(false);
    } catch (err) {
      console.error("Erro ao criar ticket:", err);
    }
  };

  if (isLoading || !dbUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col pt-16">
        <div className="flex-1 px-4 py-8">
          
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
                          onClick={handleCTA}
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
                onClick={handleOpenScheduleModal}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-lg font-medium flex justify-center items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Transformar em Ticket</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ErrorModal
        open={showCreditsModal}
        title="Créditos insuficientes"
        message={
          modalReason === "ia"
            ? "Você usou todos os seus créditos de consulta com IA. Para continuar obtendo respostas instantâneas, adicione novos créditos ao seu plano."
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
        onConfirm={handleConfirmSchedule}
        lawyers={lawyers}
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
