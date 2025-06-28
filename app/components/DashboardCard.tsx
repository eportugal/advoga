"use client";

import { Box, Paper, Typography } from "@mui/material";
import { LucideIcon } from "lucide-react";

type CreditCardProps = {
  amount: number;
  label: string;
  icon: LucideIcon;
  iconColor?: string;
};

export default function DashboardCard({
  amount,
  label,
  icon: Icon,
  iconColor = "#000",
}: CreditCardProps) {
  return (
    <Paper
      elevation={3}
      className="p-6"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
      }}
    >
      <Typography variant="h4" fontWeight={700}>
        {amount}
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <Icon size={18} color={iconColor} />
        <Typography fontSize={14} color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}
