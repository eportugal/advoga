// components/ConfirmationCodeInput.tsx
"use client";

import { Box, TextField, Typography, Link } from "@mui/material";
import { useEffect } from "react";

type Props = {
  confirmationCode: string;
  setConfirmationCode: (code: string) => void;
  onResend?: () => void;
  loading?: boolean;
  email: string; // ✅ nova prop
};

export default function ConfirmationCodeInput({
  confirmationCode,
  setConfirmationCode,
  onResend,
  loading = false,
  email,
}: Props) {
  useEffect(() => {
    if (confirmationCode.length < 6) return;
    const next = document.getElementById("digit-5");
    if (next) (next as HTMLInputElement).blur();
  }, [confirmationCode]);

  return (
    <Box className="mt-4 space-y-4 mb-8">
      <Box textAlign="center" marginBottom={4}>
        <Typography color="text.secondary">
          Código enviado para <strong>{email}</strong>
        </Typography>
      </Box>

      <Box display="flex" gap={2} className="w-full">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <TextField
            key={i}
            fullWidth
            id={`digit-${i}`}
            value={confirmationCode[i] || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (!value) return;
              const updated =
                confirmationCode.substring(0, i) +
                value +
                confirmationCode.substring(i + 1);
              setConfirmationCode(updated);
              const next = document.getElementById(`digit-${i + 1}`);
              if (next) (next as HTMLInputElement).focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                const updated =
                  confirmationCode.substring(0, i) +
                  " " +
                  confirmationCode.substring(i + 1);
                setConfirmationCode(updated.trim());
                if (i > 0) {
                  const prev = document.getElementById(`digit-${i - 1}`);
                  if (prev) (prev as HTMLInputElement).focus();
                }
              }
            }}
            inputMode="numeric"
            slotProps={{
              htmlInput: {
                maxLength: 1,
                style: {
                  textAlign: "center",
                  fontSize: "1.5rem",
                },
              },
              root: {
                style: {
                  height: "56px",
                  padding: 0,
                  borderRadius: "12px",
                },
              },
            }}
          />
        ))}
      </Box>
      {onResend && (
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          className="pt-4"
        >
          Não recebeu o email?{" "}
          <Link
            underline="always"
            onClick={onResend}
            sx={{ cursor: "pointer", fontWeight: 500 }}
          >
            Clique para reenviar
          </Link>
        </Typography>
      )}
    </Box>
  );
}
