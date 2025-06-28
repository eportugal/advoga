"use client";

import { useAuth } from "./hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./utils/muiTheme";
import { Box, CircularProgress } from "@mui/material";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import RegularLayout from "./layouts/RegularLayout";
import LawyerLayout from "./layouts/LawyerLayout";
import PublicLayout from "./layouts/PublicLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAuthenticated, initialized, isAuthenticating } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleItemClick = (id: string, href: string) => {
    router.push(href);
  };

  if (!initialized || isAuthenticating) {
    return (
      <Box className="flex items-center justify-center min-h-screen bg-white">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated && profile === "regular" ? (
        <RegularLayout pathname={pathname} onItemClick={handleItemClick}>
          {children}
        </RegularLayout>
      ) : isAuthenticated && profile === "advogado" ? (
        <LawyerLayout>{children}</LawyerLayout>
      ) : (
        <PublicLayout>{children}</PublicLayout>
      )}
    </ThemeProvider>
  );
}
