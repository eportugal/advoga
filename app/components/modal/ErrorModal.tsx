// components/CustomModal.tsx
"use client";

import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

type CustomModalProps = {
  open: boolean;
  loading?: boolean;
  title: string;
  message: any;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
};

export default function CustomModal({
  open,
  loading = false,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Fechar",
  showCancelButton = true,
}: CustomModalProps) {
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
        className="flex flex-col items-center justify-center"
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 400,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} mt={4} mb={2} gutterBottom>
          😔 {title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {message}
        </Typography>

        <Box display="flex" flexDirection="column" gap={2} width="100%">
          {showCancelButton && (
            <Button variant="text" fullWidth onClick={onClose}>
              <Typography sx={{ color: "primary.main" }}>
                {cancelText}
              </Typography>
            </Button>
          )}
          {onConfirm && (
            <Button
              variant="contained"
              fullWidth
              onClick={onConfirm}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              <Typography>
                {loading ? "Processando..." : confirmText}
              </Typography>
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
