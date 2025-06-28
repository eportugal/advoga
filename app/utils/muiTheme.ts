import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#005EFB",
    },
    secondary: {
      main: "#005EFB",
    },
    error: {
      main: "#f44336",
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: ["Roboto", "sans-serif"].join(","),
    h5: {
      fontWeight: 600,
      fontSize: "1.4rem",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#fff",
          textTransform: "none",
          fontWeight: 500,
          borderRadius: "12px",
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          minWidth: "64px",
        },
        sizeSmall: {
          height: "44px",
          fontSize: "0.75rem",
          paddingLeft: "18px",
          paddingRight: "18px",
        },
        sizeMedium: {
          height: "56px",
          fontSize: "0.875rem",
          paddingLeft: "24px",
          paddingRight: "24px",
        },
        sizeLarge: {
          height: "64px",
          fontSize: "1rem",
          paddingLeft: "32px",
          paddingRight: "32px",
        },
        outlined: ({ theme }) => ({
          color: theme.palette.primary.main,
          border: `1px solid ${theme.palette.primary.main}`,
          "&:hover": {
            backgroundColor: "rgba(0, 94, 251, 0.08)",
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default theme;
