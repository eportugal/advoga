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
  Paper,
  Link,
  Select,
  OutlinedInput,
  IconButton,
  Grid,
} from "@mui/material";

import { Theme, useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import ConfirmationCodeInput from "../../components/ConfirmationCodeInput";
import { CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import AlertModal from "../../components/modal/AlertModal";
import confetti from "canvas-confetti";

Amplify.configure(outputs);

export default function SignUpFlowLawyer() {
  const router = useRouter();
  const {
    signUp,
    confirmSignUp,
    signIn,
    currentSession,
    isLoading,
    resendConfirmationCode,
  } = useAuth();
  const [signupStep, setSignupStep] = useState<"basic" | "professional">(
    "basic"
  );
  const [step, setStep] = useState<"signup" | "confirm">("signup");
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
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const allPracticeAreas = [
    "Direito Civil",
    "Direito Penal",
    "Direito Trabalhista",
    "Direito Tributário",
    "Direito de Família",
    "Direito do Consumidor",
    "Direito Previdenciário",
    "Direito Ambiental",
    "Direito Empresarial",
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

  useEffect(() => {
    if (showWelcomeModal) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [showWelcomeModal]);
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

  if ((loginLoading || loginSuccess) && !showWelcomeModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        {loginSuccess ? (
          <CheckCircle size={60} color="green" />
        ) : (
          <CircularProgress size={60} thickness={5} color="primary" />
        )}
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
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

      await fetch("/api/set-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawyerId: dbData.id,
          weeklySchedule: {
            monday: availability.monday || [],
            tuesday: availability.tuesday || [],
            wednesday: availability.wednesday || [],
            thursday: availability.thursday || [],
            friday: availability.friday || [],
          },
        }),
      });

      setUserId(dbData.id);

      const res = await signUp(
        cleanEmail,
        password,
        "advogado",
        firstName.trim(),
        lastName.trim()
      );
      if (!res.success) throw new Error(res.message || "Erro no Cognito");

      setSuccess("Código de confirmação enviado para seu email!");
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
    setConfirmLoading(true);
    resetMessages();
    try {
      const cleanEmail = email.toLowerCase().trim();
      const confirmRes = await confirmSignUp(
        cleanEmail,
        confirmationCode.trim().padEnd(6, " ")
      );
      if (!confirmRes.success) throw new Error(confirmRes.message);

      setConfirmSuccess(true);
      setShowWelcomeModal(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setConfirmLoading(false);
    }
  };

  const finalizeLogin = async () => {
    try {
      setLoginLoading(true);
      const cleanEmail = email.toLowerCase().trim();

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
      setLoginLoading(false);
    }
  };

  function getStyles(name: string, selected: string[], theme: Theme) {
    return {
      fontWeight: selected.includes(name)
        ? theme.typography.fontWeightMedium
        : theme.typography.fontWeightRegular,
    };
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();

      const res = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error("Erro ao verificar o e-mail.");
      }

      if (data.user) {
        setError("E-mail já cadastrado.");
        return;
      }

      setSignupStep("professional");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado ao verificar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeAreasChange = (
    event: SelectChangeEvent<typeof practiceAreas>
  ) => {
    const { value } = event.target;
    setPracticeAreas(typeof value === "string" ? value.split(",") : value);
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

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const [availability, setAvailability] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  });

  return (
    <Container>
      <Grid container spacing={4} className="justify-between py-8">
        <Grid size={6} className="min-h-[80vh]">
          <Paper
            className="bg-white shadow-md p-8 min-h-[80vh] flex flex-col items-center justify-center"
            sx={{
              borderRadius: 4,
            }}
          >
            <Box className=" bg-white w-full">
              {step === "signup" && signupStep === "professional" ? (
                <Box alignItems="center" gap={1} width="100%" mb={4}>
                  <Button
                    onClick={() => setSignupStep("basic")}
                    startIcon={<ArrowLeft size={18} />}
                    variant="text"
                    disableRipple
                    sx={{
                      color: "primary.main",
                      textTransform: "none",
                      fontWeight: 500,
                      padding: 0,
                      minWidth: "auto",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "none",
                      },
                    }}
                  >
                    Voltar
                  </Button>

                  <Typography variant="h5" marginTop={3} fontWeight={700}>
                    Informações Profissionais
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="h5"
                  align="center"
                  fontWeight={700}
                  gutterBottom
                >
                  {step === "signup" ? "Criar Conta" : "Confirmar Código"}
                </Typography>
              )}
            </Box>

            {step === "signup" && (
              <Box
                component="form"
                onSubmit={
                  signupStep === "basic" ? handleNextStep : handleSignUp
                }
                noValidate
                className="space-y-4 w-full"
              >
                {signupStep === "basic" && (
                  <>
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
                      {loading ? "Verificando..." : "Próximo"}
                    </Button>
                  </>
                )}

                {signupStep === "professional" && (
                  <>
                    <Box alignItems="center" gap={1} width="100%" mb={4}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={400}
                        gutterBottom
                        className="text-gray-600 "
                      >
                        Complete seus dados profissionais para concluir seu
                        cadastro
                      </Typography>
                    </Box>
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
                        helperText={
                          isOabValid === false ? oabValidationError : ""
                        }
                      />

                      <FormControl
                        sx={{ width: 120 }}
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
                        multiple
                        value={practiceAreas}
                        onChange={handlePracticeAreasChange}
                        input={<OutlinedInput label="Áreas de Atuação" />}
                        renderValue={(selected) => (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
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

                    <Box mt={3}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        Horários de Atendimento
                      </Typography>

                      {/** Mapeamento em português */}
                      {(() => {
                        const dayLabels: Record<string, string> = {
                          monday: "Segunda-feira",
                          tuesday: "Terça-feira",
                          wednesday: "Quarta-feira",
                          thursday: "Quinta-feira",
                          friday: "Sexta-feira",
                        };

                        const hourOptions = [
                          "08:00",
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                          "16:00",
                          "17:00",
                          "18:00",
                        ];

                        return Object.keys(availability).map((day) => (
                          <Box
                            key={day}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            mt={2}
                          >
                            <Typography sx={{ width: 140 }}>
                              {dayLabels[day] || day}
                            </Typography>
                            <FormControl fullWidth>
                              <InputLabel id={`${day}-hours-label`}>
                                Horários
                              </InputLabel>
                              <Select
                                labelId={`${day}-hours-label`}
                                multiple
                                value={availability[day]}
                                onChange={(e) =>
                                  setAvailability((prev) => ({
                                    ...prev,
                                    [day]:
                                      typeof e.target.value === "string"
                                        ? e.target.value.split(",")
                                        : e.target.value,
                                  }))
                                }
                                input={<OutlinedInput label="Horários" />}
                                renderValue={(selected) => (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                    }}
                                  >
                                    {selected.map((hour) => (
                                      <Chip
                                        key={hour}
                                        label={hour}
                                        onDelete={() =>
                                          setAvailability((prev) => ({
                                            ...prev,
                                            [day]: prev[day].filter(
                                              (h) => h !== hour
                                            ),
                                          }))
                                        }
                                        onMouseDown={(e) => e.stopPropagation()}
                                      />
                                    ))}
                                  </Box>
                                )}
                              >
                                {hourOptions.map((hour) => (
                                  <MenuItem key={hour} value={hour}>
                                    {hour}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        ));
                      })()}
                    </Box>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : null
                      }
                    >
                      {loading ? "Criando..." : "Criar Conta"}
                    </Button>
                  </>
                )}
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
            Transforme sua carreira na advocacia.
          </Typography>

          <Typography variant="body1" sx={{ maxWidth: 400, mb: 6 }}>
            Transforme sua carreira na advocacia.
          </Typography>
        </Grid>
      </Grid>

      <AlertModal
        open={showWelcomeModal}
        loading={loginLoading}
        onConfirm={finalizeLogin}
      />
    </Container>
  );
}
