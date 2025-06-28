"use client";

import { createContext, useState, useEffect } from "react";
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  type AuthUser,
} from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

export interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  dbUser: any | null;
  profile: "regular" | "advogado" | null;
  initialized: boolean;
  signUp: (...args: any[]) => Promise<any>;
  confirmSignUp: (...args: any[]) => Promise<any>;
  resendConfirmationCode: (...args: any[]) => Promise<any>;
  forgotPassword: (...args: any[]) => Promise<any>;
  forgotPasswordSubmit: (...args: any[]) => Promise<any>;
  currentSession: () => Promise<any>;
  signIn: (...args: any[]) => Promise<any>;
  signOut: () => Promise<any>;
  refreshProfile: () => Promise<void>;
  isAuthenticating: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function useProvideAuth(): AuthContextType {
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<"regular" | "advogado" | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 🔁 adicionar isso no seu hook principal

  useEffect(() => {
    const checkAuthState = async () => {
      setIsLoading(true);
      try {
        const session = await fetchAuthSession();
        if (!session.tokens?.idToken) throw new Error("No token");

        const currentUser = await getCurrentUser();
        const profileTypeRaw =
          session.tokens.idToken.payload["custom:profile_type"];
        const validProfile =
          profileTypeRaw === "regular" || profileTypeRaw === "advogado"
            ? profileTypeRaw
            : null;

        if (!validProfile) throw new Error("Perfil inválido ou ausente");

        setUser(currentUser);
        setProfile(validProfile);
        setIsAuthenticated(true);

        const res = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentUser.signInDetails?.loginId,
          }),
        });
        const data = await res.json();
        setDbUser(data.success ? data.user : null);
      } catch (err) {
        console.log("[Auth] checkAuthState error", err);
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
        setDbUser(null);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    checkAuthState();
  }, []);

  const refreshProfile = async (emailOverride?: string) => {
    const email = emailOverride || user?.signInDetails?.loginId;
    if (!email) return;

    const res = await fetch("/api/get-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setDbUser(data.success ? data.user : null);
  };

  const currentSession = async () => {
    try {
      const session = await fetchAuthSession();
      const sub = session.tokens?.idToken?.payload.sub;
      if (session.tokens?.idToken) {
        return { success: true, sub };
      }
      throw new Error("No valid session");
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      setDbUser(null);
      await amplifySignOut();
      return { success: false };
    }
  };

  const signUp = async (
    username: string,
    password: string,
    profileType: "regular" | "advogado",
    firstname?: string,
    lastname?: string
  ) => {
    setIsLoading(true);
    try {
      await amplifySignUp({
        username: username.toLowerCase(),
        password,
        options: {
          userAttributes: {
            email: username.toLowerCase(),
            given_name: firstname,
            family_name: lastname,
            "custom:profile_type": profileType,
          },
        },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (username: string, code: string) => {
    setIsLoading(true);
    try {
      await amplifyConfirmSignUp({
        username: username.toLowerCase(),
        confirmationCode: code,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmationCode = async (username: string) => {
    setIsLoading(true);
    try {
      await resendSignUpCode({ username: username.toLowerCase() });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (username: string) => {
    setIsLoading(true);
    try {
      await resetPassword({ username: username.toLowerCase() });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPasswordSubmit = async (
    username: string,
    code: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    try {
      await confirmResetPassword({
        username: username.toLowerCase(),
        confirmationCode: code,
        newPassword,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    setIsAuthenticating(true); // 🛑 impede renderização prematura
    try {
      await amplifySignIn({ username: username.toLowerCase(), password });
      const session = await fetchAuthSession();
      const profileType =
        session.tokens?.idToken?.payload["custom:profile_type"];

      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setProfile(profileType as "regular" | "advogado");
      setIsAuthenticated(true);
      await refreshProfile(currentUser.signInDetails?.loginId);

      return { success: true, profile: profileType };
    } catch (error: any) {
      let message = error.message || "Erro inesperado.";
      if (message.includes("Incorrect username or password")) {
        message = "E-mail ou senha incorretos.";
      } else if (message.includes("User is not confirmed")) {
        message = "Usuário ainda não confirmou o código.";
      } else if (message.includes("User does not exist")) {
        message = "Usuário não encontrado.";
      } else if (message.includes("Password attempts exceeded")) {
        message = "Muitas tentativas. Tente novamente mais tarde.";
      }
      return { success: false, message };
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false); // ✅ libera renderização
    }
  };

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      setDbUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    dbUser,
    profile,
    initialized,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    currentSession,
    signIn,
    signOut: handleSignOut,
    refreshProfile,
    isAuthenticating, // <-- aqui
  };
}

export { useProvideAuth };
