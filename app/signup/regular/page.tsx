"use client";

import { useState, useEffect } from "react";
import { Typography, Button, CircularProgress } from "@mui/material";
import AlertModal from "../../components/AlertModal";
import confetti from "canvas-confetti";

export default function TestAlertModalPage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [open]);

  return <AlertModal open={open}></AlertModal>;
}
