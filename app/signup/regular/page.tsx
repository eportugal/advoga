"use client";

import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
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
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";

Amplify.configure(outputs);

export default function AuthFlow() {
  const router = useRouter();
  const { signUp, confirmSignUp, signIn, resendConfirmationCode } = useAuth();

  const [step, setStep] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      if (!data.user) {
        setStep("signup");
        return;
      }

      const signInRes = await signIn(email, password);
      if (!signInRes.success) throw new Error(signInRes.message);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

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

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const cleanEmail = email.toLowerCase().trim();
      const confirmRes = await confirmSignUp(
        cleanEmail,
        confirmationCode.trim()
      );
      if (!confirmRes.success) throw new Error(confirmRes.message);
      const signInRes = await signIn(cleanEmail, password);
      if (!signInRes.success) throw new Error(signInRes.message);
      if (userId) {
        const currentUser = await getCurrentUser();
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
      setLoading(false);
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
    <Container maxWidth="sm" className="p-8">
      <Paper className="bg-white shadow-md rounded-xl p-6 mt-16">
        <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
          {step === "login"
            ? "Entrar"
            : step === "signup"
            ? "Criar Conta"
            : "Confirmar Código"}
        </Typography>

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
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <Typography align="center">
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
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
          </Box>
        )}

        {step === "confirm" && (
          <Box
            component="form"
            onSubmit={handleConfirm}
            noValidate
            className="mt-4 space-y-4"
          >
            <TextField
              fullWidth
              label="Código de Confirmação"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              disabled={loading}
            >
              {loading ? "Confirmando..." : "Confirmar e Entrar"}
            </Button>
            <Button
              variant="text"
              onClick={resendCode}
              fullWidth
              disabled={loading}
            >
              Reenviar Código
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
    </Container>
  );
}
