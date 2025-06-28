"use client";

import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { Scale, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton, Container, Grid, Box, Button } from "@mui/material";

export default function NavBar() {
  const router = useRouter();
  const { isAuthenticated, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isAuthenticated && profile === "regular") return null;

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
                <Button
                  className="h-2"
                  variant="contained"
                  size="small"
                  href="/tickets/manage"
                >
                  Painel do Advogado
                </Button>
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
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleSignOut}
                    startIcon={<LogOut />}
                    sx={{ color: "rgb(156, 163, 175)", height: "30px" }} // equivalente ao Tailwind `text-gray-700`
                  >
                    Sair
                  </Button>
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
