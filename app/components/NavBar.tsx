"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { Scale, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton, Container, Grid, Box, IconButton } from "@mui/material";

export default function NavBar() {
  const router = useRouter();
  const { isAuthenticated, dbUser, isLoading, profile, signOut } = useAuth();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (dbUser) {
      const firstName = dbUser.firstName || "Usuário";
      setUserName(profile === "advogado" ? `Dr(a). ${firstName}` : firstName);
    }
  }, [dbUser, profile]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Box
      className="w-full shadow-sm"
      sx={{
        position: "fixed",
        top: 0,
        zIndex: 50,
        bgcolor: "white",
        borderBottom: 1,
        borderColor: "grey.200",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          height={64}
        >
          <Grid>
            <Link href="/" className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Advoga</span>
            </Link>
          </Grid>

          <Grid>
            <Box className="flex items-center space-x-4">
              {profile === "advogado" && (
                <Link
                  href="/tickets/manage"
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                >
                  Painel do Advogado
                </Link>
              )}

              {isAuthenticated && profile === "regular" && (
                <Link
                  href="/tickets/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                >
                  Abrir Chamado
                </Link>
              )}

              {isAuthenticated ? (
                <Box className="flex items-center space-x-2">
                  {userName ? (
                    <span className="text-gray-600">
                      Bem-vindo(a), {userName}!
                    </span>
                  ) : (
                    <Skeleton variant="text" width={100} height={24} />
                  )}
                  <IconButton onClick={handleSignOut}>
                    <LogOut className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                  </IconButton>
                </Box>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Login
                </Link>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
