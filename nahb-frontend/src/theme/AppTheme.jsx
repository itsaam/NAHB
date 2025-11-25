import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // Light mode colors
          primary: {
            main: "#6366f1",
            light: "#818cf8",
            dark: "#4f46e5",
          },
          background: {
            default: "#ffffff",
            paper: "#ffffff",
          },
          text: {
            primary: "#1a1a1a",
            secondary: "#666666",
          },
        }
      : {
          // Dark mode colors
          primary: {
            main: "#818cf8",
            light: "#a5b4fc",
            dark: "#6366f1",
          },
          background: {
            default: "#0a0a0a",
            paper: "#1a1a1a",
          },
          text: {
            primary: "#ffffff",
            secondary: "#a3a3a3",
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
        },
      },
    },
  },
});

export default function AppTheme({ children, ...props }) {
  const [mode] = React.useState("light");

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeProvider theme={theme} {...props}>
      {children}
    </ThemeProvider>
  );
}
