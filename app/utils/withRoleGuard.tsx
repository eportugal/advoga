"use client";

import { useRouter, usePathname } from "next/navigation";
import { useProvideAuth } from "@/app/contexts/AuthProvider";
import { useProfile } from "@/app/contexts/ProvideProfile";
import React, { useEffect } from "react";

export function withRoleGuard(
  WrappedComponent: React.ComponentType,
  allowedRoles: string[]
) {
  return function GuardedComponent(props: any) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading: authLoading } = useProvideAuth();
    const { profile, loading: profileLoading } = useProfile();

    useEffect(() => {
      if (!authLoading && !profileLoading) {
        // Não logado → só pode acessar a LP
        if (!user && pathname !== "/") {
          router.replace("/");
          return;
        }

        // Logado mas sem role correta → manda pra LP
        if (user && profile && !allowedRoles.includes(profile.role)) {
          router.replace("/");
          return;
        }
      }
    }, [
      authLoading,
      profileLoading,
      user,
      profile,
      allowedRoles,
      pathname,
      router,
    ]);

    if (authLoading || profileLoading || !user || !profile) {
      return (
        <div className="p-8 text-center text-gray-500">
          Verificando permissões...
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
