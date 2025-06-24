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
  profile: "regular" | "advogado" | null;
  signUp: (...args: any[]) => Promise<any>;
  confirmSignUp: (...args: any[]) => Promise<any>;
  resendConfirmationCode: (...args: any[]) => Promise<any>;
  forgotPassword: (...args: any[]) => Promise<any>;
  forgotPasswordSubmit: (...args: any[]) => Promise<any>;
  currentSession: () => Promise<any>;
  signIn: (...args: any[]) => Promise<any>;
  signOut: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function useProvideAuth(): AuthContextType {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<"regular" | "advogado" | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.idToken) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        const profileType =
          session.tokens?.idToken?.payload["custom:profile_type"];
        setProfile(profileType as "regular" | "advogado");
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
    }
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
    try {
      await amplifySignIn({ username: username.toLowerCase(), password });
      const session = await fetchAuthSession();
      const profileType =
        session.tokens?.idToken?.payload["custom:profile_type"];
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setProfile(profileType as "regular" | "advogado");
      setIsAuthenticated(true);
      return { success: true, profile: profileType };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    profile,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    currentSession,
    signIn,
    signOut: handleSignOut,
  };
}
