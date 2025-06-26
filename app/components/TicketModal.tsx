"use client";

import React from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
} from "@mui/material";
import { Sparkles } from "lucide-react";

type Ticket = {
  ticketId: string;
  user: {
    name: string;
    email: string;
  } | null;
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
    <Modal open onClose={onClose}>
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        height="100vh"
        bgcolor="rgba(0, 0, 0, 0.3)"
      >
        <Paper
          elevation={4}
          sx={{
            width: "100%",
            maxWidth: 500,
            height: "100%",
            p: 4,
            borderRadius: 0,
            position: "relative",
            overflowY: "auto",
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: "1.5rem",
              color: "gray",
              minWidth: "auto",
              padding: 0,
            }}
          >
            &times;
          </Button>

          <Typography variant="h6" fontWeight="bold" mb={3}>
            Detalhes do Processo
          </Typography>

          {ticket.area && (
            <Box mb={3} display="flex" flexDirection="column" gap={1}>
              <Chip
                icon={<Sparkles className="h-4 text-blue-300" />}
                label={`Aparentemente, o caso se enquadra na área de ${ticket.area}.`}
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          )}

          {/* Descrição do cliente */}
          <Box mt={3} mb={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Descrição do cliente
            </Typography>
            <Box
              borderRadius={2}
              sx={{
                p: 2,
                backgroundColor: "#F6F6F6",
                color: "white",
                lineHeight: 1.6,
              }}
            >
              <Typography
                variant="body2"
                fontWeight="regular"
                whiteSpace="pre-line"
                className="text-gray-700"
              >
                {ticket.text}
              </Typography>
            </Box>
          </Box>
          <Box mb={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={ticket.status}
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <MenuItem value="Novo">Novo</MenuItem>
                <MenuItem value="Em Aberto">Em Aberto</MenuItem>
                <MenuItem value="Fechado">Fechado</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {!showReplyField && (
            <Button
              variant="contained"
              onClick={onShowReplyField}
              fullWidth
              sx={{ mb: 3 }}
            >
              Responder
            </Button>
          )}

          {showReplyField && (
            <>
              <TextField
                value={replyText}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Digite sua resposta..."
                multiline
                minRows={5}
                fullWidth
                sx={{ mb: 3 }}
              />
              <Button variant="contained" onClick={onSendReply} fullWidth>
                Enviar Resposta
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Modal>
  );
}
