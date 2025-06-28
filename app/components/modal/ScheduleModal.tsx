"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

export type ScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (day: string, hour: string) => Promise<void>;
  availableTimes: { day: string; hour: string }[];
};

const dayLabels: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function ScheduleModal({
  open,
  onClose,
  onConfirm,
  availableTimes,
}: ScheduleModalProps) {
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const days = Array.from(new Set(availableTimes.map((t) => t.day)));
  const hours = availableTimes
    .filter((t) => t.day === selectedDay)
    .map((t) => t.hour);

  useEffect(() => {
    setSelectedHour("");
  }, [selectedDay]);

  if (!open) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={1300}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="rgba(0, 0, 0, 0.6)"
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Escolha um horário disponível
        </Typography>

        <FormControl fullWidth sx={{ mt: 3 }}>
          <InputLabel id="day-label">Dia da semana</InputLabel>
          <Select
            labelId="day-label"
            value={selectedDay}
            label="Dia da semana"
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>
                {dayLabels[day] || day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mt: 3 }} disabled={!selectedDay}>
          <InputLabel id="hour-label">Horário</InputLabel>
          <Select
            labelId="hour-label"
            value={selectedHour}
            label="Horário"
            onChange={(e) => setSelectedHour(e.target.value)}
          >
            {hours.map((hour) => (
              <MenuItem key={hour} value={hour}>
                {hour}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 4 }}
          disabled={!selectedDay || !selectedHour || loading}
          onClick={async () => {
            setLoading(true);
            await onConfirm(selectedDay, selectedHour);
            setLoading(false);
          }}
        >
          {loading ? "Confirmando..." : "Confirmar"}
        </Button>

        <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={onClose}>
          Cancelar
        </Button>
      </Paper>
    </Box>
  );
}
