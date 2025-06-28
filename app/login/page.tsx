"use client";

import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "aws-amplify/auth";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  Alert,
  Paper,
  Link,
  CircularProgress,
  Grid,
} from "@mui/material";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import ConfirmationCodeInput from "../components/ConfirmationCodeInput";
import AlertModal from "../components/modal/AlertModal";
import confetti from "canvas-confetti";

Amplify.configure(outputs);

export default function AuthFlow() {
  const router = useRouter();
  const {
    signUp,
    confirmSignUp,
    signIn,
    resendConfirmationCode,
    isLoading,
    isAuthenticated,
    profile,
  } = useAuth();
  const [step, setStep] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [showModal]);

  useEffect(() => {
    if (isAuthenticated) {
      if (profile === "advogado") {
        router.replace("/tickets/manage");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, profile]);

  if (isAuthenticated) return null;

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push("/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    resetMessages();

    try {
      const signInRes = await signIn(email, password);

      if (!signInRes.success) throw new Error(signInRes.message);

      const profile = signInRes.profile; // "regular" ou "advogado"

      setLoginSuccess(true);

      setTimeout(() => {
        if (profile === "advogado") {
          router.push("/tickets/manage");
        } else {
          router.push("/dashboard");
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loginLoading && !showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <CircularProgress size={60} thickness={5} color="primary" />
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const cleanEmail = email.toLowerCase().trim();
      const dbRes = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
        }),
      });
      const dbData = await dbRes.json();
      if (!dbRes.ok || !dbData.success) {
        throw new Error(dbData.error || "Erro ao criar usuário no banco");
      }
      setUserId(dbData.id);
      const signUpRes = await signUp(
        cleanEmail,
        password,
        "regular",
        firstName.trim(),
        lastName.trim()
      );
      if (!signUpRes.success) {
        throw new Error(signUpRes.message || "Erro no Cognito");
      }
      setSuccess("Código de confirmação enviado para seu email!");
      setStep("confirm");
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async () => {
    try {
      setLoginLoading(true);
      const cleanEmail = email.toLowerCase().trim();

      const signInRes = await signIn(cleanEmail, password);
      if (!signInRes.success) throw new Error(signInRes.message);

      const currentUser = await getCurrentUser();
      if (userId) {
        await fetch("/api/update-user-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            status: "active",
            cognitoSub: currentUser.userId,
          }),
        });
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmLoading(true);
    resetMessages();
    try {
      const cleanEmail = email.toLowerCase().trim();
      const confirmRes = await confirmSignUp(
        cleanEmail,
        confirmationCode.trim()
      );
      if (!confirmRes.success) throw new Error(confirmRes.message);

      setConfirmSuccess(true);
      setShowModal(true); // Mostra o modal, mas login será feito ao clicar no botão
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setConfirmLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    resetMessages();
    try {
      await resendConfirmationCode(email.toLowerCase().trim());
      setSuccess("Novo código enviado!");
    } catch (err: any) {
      setError(err.message || "Erro ao reenviar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      <Container>
        <Grid container spacing={4} className="justify-between py-8">
          <Grid
            size={6}
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              px: 6,
              py: 10,
              minHeight: "80vh",
              borderRadius: 4,
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Comece sua jornada com a gente.
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 400, mb: 6 }}>
              Descubra a melhor comunidade de advogados e clientes para resolver
              seus problemas jurídicos com confiança.
            </Typography>
            <Paper
              elevation={6}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                p: 3,
                borderRadius: 3,
                maxWidth: 360,
                color: "white",
                backdropFilter: "blur(5px)",
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2 }}>
                “Simplesmente incrível! Consegui resolver meu problema jurídico
                muito rápido. Recomendo demais.”
              </Typography>
              <Typography variant="caption" display="block" fontWeight={600}>
                João Silva – Cliente
              </Typography>
            </Paper>
          </Grid>

          <Grid size={6} className="min-h-[80vh]">
            <Paper
              className="bg-white shadow-md px-8 min-h-[80vh] flex flex-col items-center justify-center"
              sx={{ borderRadius: 4 }}
            >
              <Box textAlign="center">
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                  align="center"
                >
                  {step === "login"
                    ? "Entrar"
                    : step === "signup"
                    ? "Criar Conta"
                    : "Confirmar Código"}
                </Typography>
              </Box>

              {step === "login" && (
                <Box
                  component="form"
                  onSubmit={handleLogin}
                  className="mt-4 space-y-4"
                >
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </IconButton>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loginLoading || loginSuccess}
                    startIcon={
                      loginSuccess ? (
                        <CheckCircle size={20} />
                      ) : loginLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : undefined
                    }
                  >
                    {loginSuccess
                      ? "Logado com sucesso!"
                      : loginLoading
                      ? "Entrando..."
                      : "Entrar"}
                  </Button>
                  <Typography
                    align="center"
                    fontSize={12}
                    className="text-gray-500"
                  >
                    Não tem uma conta?{" "}
                    <Link component="button" onClick={() => setStep("signup")}>
                      Criar uma
                    </Link>
                  </Typography>
                </Box>
              )}

              {step === "signup" && (
                <Box
                  component="form"
                  onSubmit={handleSignUp}
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <TextField
                    fullWidth
                    label="Nome"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Sobrenome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </IconButton>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? "Criando..." : "Criar Conta"}
                  </Button>
                  <Typography align="center">
                    Já tem uma conta?{" "}
                    <Link component="button" onClick={() => setStep("login")}>
                      Entrar
                    </Link>
                  </Typography>
                </Box>
              )}

              {step === "confirm" && (
                <Box component="form" onSubmit={handleConfirm}>
                  <ConfirmationCodeInput
                    confirmationCode={confirmationCode}
                    setConfirmationCode={setConfirmationCode}
                    onResend={resendCode}
                    loading={loading}
                    email={email}
                  />
                  <Button
                    className="mt-8"
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={confirmLoading || confirmSuccess}
                    startIcon={
                      confirmSuccess ? (
                        <CheckCircle size={20} />
                      ) : confirmLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : undefined
                    }
                  >
                    {confirmSuccess
                      ? "Confirmado!"
                      : confirmLoading
                      ? "Confirmando..."
                      : "Confirmar e Entrar"}
                  </Button>
                </Box>
              )}

              {error && (
                <Alert severity="error" className="mt-6">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" className="mt-6">
                  {success}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        <AlertModal
          open={showModal}
          loading={loginLoading}
          onConfirm={finalizeLogin}
        />
      </Container>
    </div>
  );
}
