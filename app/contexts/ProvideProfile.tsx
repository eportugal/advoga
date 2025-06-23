"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useProvideAuth } from "./ProvideAuth";

type Profile = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function ProvideProfile({ children }: { children: React.ReactNode }) {
  const { user } = useProvideAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/get-user-role?email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (data.success) {
        // ✅ Aqui agora preenchemos tudo que o NavBar espera
        setProfile({
          email: user.email,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          role: data.role,
        });
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{ profile, loading, refreshProfile: fetchProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
