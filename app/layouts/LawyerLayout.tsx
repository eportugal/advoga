"use client";

import { Box, CircularProgress } from "@mui/material";
import NavBar from "../components/navbar/NavBar";
import Footer from "../components/Footer";
import { Suspense } from "react";

export default function LawyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box className="flex flex-col min-h-screen bg-white">
      <NavBar />
      <main className="flex-1">
        <Suspense
          fallback={
            <Box className="flex items-center justify-center min-h-[60vh]">
              <CircularProgress />
            </Box>
          }
        >
          {children}
        </Suspense>
      </main>
      <Footer />
    </Box>
  );
}
