// app/components/RouteListener.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useProvideAuth } from "../contexts/AuthProvider";

export default function RouteListener({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { refreshProfile } = useProvideAuth();

  useEffect(() => {
    (async () => {
      await refreshProfile();
    })();
  }, [pathname, refreshProfile]);

  return <>{children}</>;
}
