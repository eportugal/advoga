// app/components/RouteListener.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useProvideAuth } from "../contexts/AuthProvider";
import { useProfile } from "../contexts/ProvideProfile";

export default function RouteListener({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { refresh } = useProvideAuth();
  const { refreshProfile } = useProfile();

  useEffect(() => {
    (async () => {
      await refresh();
      await refreshProfile();
    })();
  }, [pathname, refresh, refreshProfile]);

  return <>{children}</>;
}
