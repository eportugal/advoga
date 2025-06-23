// hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import {
  fetchAuthSession,
  getCurrentUser,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import { verifyAccessToken } from "../utils/cognito"; // seu helper!

type AuthUser = {
  userId: string;
  email: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const userData = await getCurrentUser();
      setUser({
        userId: userData.username,
        email: userData.signInDetails?.loginId || "",
      });
    } catch {
      // fallback para cookie:
      const token = verifyAccessToken();
      if (token) {
        setUser({ userId: "fallback", email: "unknown" });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
  };

  const refresh = checkSession;

  return {
    user,
    loading,
    signOut,
    refresh,
  };
}
