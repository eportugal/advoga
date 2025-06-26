"use client";

import React from "react";

type Ticket = {
  ticketId: string;
  user: {
    name: string;
    email: string;
  } | null;
  subject: string;
  text: string;
  status: string;
  createdAt: string;
  area: string | null;
};

type TicketModalProps = {
  ticket: Ticket;
  replyText: string;
  showReplyField: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onReplyChange: (text: string) => void;
  onSendReply: () => void;
  onShowReplyField: () => void;
};

export default function TicketModal({
  ticket,
  replyText,
  showReplyField,
  onClose,
  onStatusChange,
  onReplyChange,
  onSendReply,
  onShowReplyField,
}: TicketModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50">
      <div className="w-full max-w-md bg-white shadow-lg p-6 flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-950">
          Detalhes do Ticket
        </h2>

        <div className="mb-4">
          <p className="text-gray-600 mb-1">Assunto</p>
          <h3 className="font-semibold text-gray-700">{ticket.subject}</h3>
        </div>

        {ticket.area && (
          <div className="mb-4">
            <p className="text-gray-600 mb-1">Área de atuação</p>
            <p className="font-semibold text-blue-700">{ticket.area}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-600 mb-1">Descrição</p>
          <p className="font-semibold text-gray-700">{ticket.text}</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Status</label>
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="Novo">Novo</option>
            <option value="Em Aberto">Em Aberto</option>
            <option value="Fechado">Fechado</option>
          </select>
        </div>

        {!showReplyField && (
          <button
            onClick={onShowReplyField}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Responder
          </button>
        )}

        {showReplyField && (
          <>
            <textarea
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder="Digite sua resposta..."
              className="w-full border p-4 rounded mb-4"
              rows={5}
            ></textarea>
            <button
              onClick={onSendReply}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Enviar Resposta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
