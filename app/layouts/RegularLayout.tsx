// app/layouts/RegularLayout.tsx
"use client";

import { Box, CircularProgress } from "@mui/material";
import Sidebar from "../components/navbar/Sidebar";
import Footer from "../components/Footer";
import { Suspense } from "react";

type RegularLayoutProps = {
  children: React.ReactNode;
  pathname: string;
  onItemClick: (id: string, href: string) => void;
};

export default function RegularLayout({
  children,
  pathname,
  onItemClick,
}: RegularLayoutProps) {
  return (
    <Box className="flex min-h-screen bg-white">
      <Sidebar activeItem={pathname} onItemClick={onItemClick} />
      <Box className="flex-1 flex flex-col" sx={{ marginLeft: "16rem" }}>
        <Suspense
          fallback={
            <Box className="flex-1 flex items-center justify-center">
              <CircularProgress />
            </Box>
          }
        >
          <main>{children}</main>
        </Suspense>
        <Footer />
      </Box>
    </Box>
  );
}
