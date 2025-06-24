import { useState, useEffect } from "react";
import { useProvideAuth } from "../contexts/AuthProvider";

export function useProfile() {
  const { user, isAuthenticated } = useProvideAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !user?.userId) return;

      try {
        const res = await fetch(`/api/get-user-profile?sub=${user.userId}`);
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

  return { profile, loading };
}
