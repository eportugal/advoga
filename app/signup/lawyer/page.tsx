"use client";

import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  CircularProgress,
  Chip,
  Select,
  OutlinedInput,
} from "@mui/material";
import { Theme, useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";

Amplify.configure(outputs);

export default function SignUpFlowLawyer() {
  const router = useRouter();
  const { signUp, confirmSignUp, signIn, currentSession, isLoading } =
    useAuth();

  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const allPracticeAreas = [
    "Civil",
    "Criminal",
    "Trabalhista",
    "Tributário",
    "Família",
    "Consumidor",
    "Previdenciário",
    "Ambiental",
    "Empresarial",
  ];

  const ufOptions = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  const [oabNumber, setOabNumber] = useState("");
  const [oabUF, setOabUF] = useState("");
  const [isOabValidating, setIsOabValidating] = useState(false);
  const [oabValidationError, setOabValidationError] = useState("");
  const [isOabValid, setIsOabValid] = useState<boolean | null>(null);

  const theme = useTheme();
  const resetError = () => setError("");

  useEffect(() => {
    const validate = async () => {
      setIsOabValid(null);
      setOabValidationError("");

      if (oabNumber.length < 3 || oabUF.length !== 2 || firstName.length < 2)
        return;

      setIsOabValidating(true);
      try {
        const res = await fetch("/api/validar-oab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            number: oabNumber.trim(),
            uf: oabUF.trim().toUpperCase(),
            nome: firstName.trim(),
          }),
        });

        const result = await res.json();

        if (!result.success) {
          setIsOabValid(false);
          setOabValidationError("Erro interno no servidor");
          return;
        }

        if (!result.valid) {
          setIsOabValid(false);
          setOabValidationError("Verifique o número de inscrição");
          return;
        }

        if (!result.nomeCoincide) {
          setIsOabValid(false);
          setOabValidationError("Nome não confere com a OAB");
          return;
        }

        // Se tudo certo
        setIsOabValid(true);
        setOabValidationError("");
      } catch (err: any) {
        setIsOabValid(false);
        setOabValidationError("Erro inesperado na validação.");
      } finally {
        setIsOabValidating(false);
      }
    };

    validate();
  }, [oabNumber, oabUF, firstName]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanOAB = `${oabNumber.trim()}/${oabUF.trim().toUpperCase()}`;

      const dbRes = await fetch("/api/create-lawyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          oab: cleanOAB,
          practiceAreas,
        }),
      });

      const dbData = await dbRes.json();
      if (!dbData.success) throw new Error(dbData.error);

      setUserId(dbData.id);

      const res = await signUp(
        cleanEmail,
        password,
        "advogado",
        firstName.trim(),
        lastName.trim()
      );
      if (!res.success) throw new Error(res.message || "Erro no Cognito");

      setStep("confirm");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const confirmRes = await confirmSignUp(
        cleanEmail,
        confirmationCode.trim().padEnd(6, " ")
      );
      if (!confirmRes.success) throw new Error(confirmRes.message);

      const signInRes = await signIn(cleanEmail, password);
      if (!signInRes.success) throw new Error(signInRes.message);

      const session = await currentSession();
      if (!session.success) throw new Error("Sessão inválida");

      if (userId) {
        await fetch("/api/update-user-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            status: "active",
            cognitoSub: session.sub,
          }),
        });
      }

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  function getStyles(name: string, selected: string[], theme: Theme) {
    return {
      fontWeight: selected.includes(name)
        ? theme.typography.fontWeightMedium
        : theme.typography.fontWeightRegular,
    };
  }

  const handlePracticeAreasChange = (
    event: SelectChangeEvent<typeof practiceAreas>
  ) => {
    const { value } = event.target;
    setPracticeAreas(typeof value === "string" ? value.split(",") : value);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <CircularProgress size={60} thickness={5} color="primary" />
      </div>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box className="mt-2 bg-white p-8">
        <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
          {step === "signup" ? "Cadastro de Advogado" : "Confirmar Código"}
        </Typography>

        {step === "signup" && (
          <Box
            component="form"
            onSubmit={handleSignUp}
            noValidate
            className="mt-2"
          >
            <TextField
              fullWidth
              label="Nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              margin="normal"
              required
            />

            <Box display="flex" gap={2} marginTop={2}>
              <TextField
                label="Número da OAB"
                fullWidth
                value={oabNumber}
                onChange={(e) =>
                  setOabNumber(e.target.value.replace(/\D/g, ""))
                }
                required
                error={isOabValid === false}
                helperText={isOabValid === false ? oabValidationError : ""}
              />

              <FormControl
                sx={{
                  width: 120,
                }}
                required
                error={isOabValid === false}
              >
                <InputLabel id="uf-label">UF</InputLabel>
                <Select
                  labelId="uf-label"
                  value={oabUF}
                  label="UF"
                  onChange={(e) => setOabUF(e.target.value)}
                >
                  {ufOptions.map((uf) => (
                    <MenuItem key={uf} value={uf}>
                      {uf}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="practice-areas-chip-label">
                Áreas de Atuação
              </InputLabel>
              <Select
                labelId="practice-areas-chip-label"
                id="practice-areas-chip"
                multiple
                value={practiceAreas}
                onChange={handlePracticeAreasChange}
                input={
                  <OutlinedInput
                    id="select-multiple-chip"
                    label="Áreas de Atuação"
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        onDelete={() =>
                          setPracticeAreas((prev) =>
                            prev.filter((item) => item !== value)
                          )
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              >
                {allPracticeAreas.map((area) => (
                  <MenuItem
                    key={area}
                    value={area}
                    style={getStyles(area, practiceAreas, theme)}
                  >
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || isOabValid === false || isOabValidating}
              className="mt-2"
            >
              {loading ? "Criando..." : "Cadastrar"}
            </Button>
          </Box>
        )}

        {step === "confirm" && (
          <Box
            component="form"
            onSubmit={handleConfirm}
            noValidate
            className="mt-2 flex flex-col items-center"
          >
            <Box display="flex" gap={1} justifyContent="center">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextField
                  key={i}
                  inputProps={{
                    maxLength: 1,
                    style: { textAlign: "center", fontSize: "1.5rem" },
                    inputMode: "numeric",
                  }}
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
                  id={`digit-${i}`}
                  sx={{ width: 50 }}
                />
              ))}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              disabled={loading}
              className="mt-4"
            >
              {loading ? "Confirmando..." : "Confirmar e Entrar"}
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" className="mt-3">
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
}
