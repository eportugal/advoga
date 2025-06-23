"use client";
import { useEffect } from "react";
import { useProvideAuth } from "./contexts/ProvideAuth";
import { useProfile } from "./contexts/ProvideProfile";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, loading } = useProvideAuth();
  const { profile, refreshProfile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      refreshProfile(); // força pegar papel atualizado
    }
  }, [user, loading]);

  useEffect(() => {
    if (profile?.role === "regular") {
      router.replace("/tickets/create");
    }
    if (profile?.role === "lawyer") {
      router.replace("/tickets/manage");
    }
  }, [profile]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Bem-vindo ao Advogare</h1>
      <p>Você será direcionado para sua área...</p>
    </div>
  );
}
