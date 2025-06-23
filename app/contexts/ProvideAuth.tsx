// contexts/ProvideAuth.tsx

"use client";

import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";

export type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

export function ProvideAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useProvideAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useProvideAuth must be used inside ProvideAuth");
  }
  return ctx;
}
