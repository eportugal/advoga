"use client";

import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

type AlertModalProps = {
  open: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  children?: React.ReactNode;
};

export default function AlertModal({
  open,
  loading = false,
  onConfirm,
}: AlertModalProps) {
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
        <Typography variant="h5" fontWeight={700} mt={4} mb={4} gutterBottom>
          🎉 Tudo certo!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Seu cadastro foi concluído com sucesso.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {loading ? "Entrando..." : "Acessar"}
        </Button>
      </Paper>
    </Box>
  );
}
