"use client";

import { Box, CircularProgress } from "@mui/material";
import NavBar from "../components/navbar/NavBar";
import Footer from "../components/Footer";
import { Suspense } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <Box component="main" mt={8}>
        <Suspense
          fallback={
            <Box className="flex items-center justify-center min-h-[60vh]">
              <CircularProgress />
            </Box>
          }
        >
          {children}
        </Suspense>
      </Box>
      <Footer />
    </>
  );
}
