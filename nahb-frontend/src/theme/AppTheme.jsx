import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // Light mode colors - Palette NAHB
          primary: {
            main: "#d42b55", // Cherry Rose
            light: "#dc5677", // Cherry Rose 400
            dark: "#a92344", // Cherry Rose 600
          },
          secondary: {
            main: "#03fcf0", // Neon Ice
            light: "#68fdf6",
            dark: "#02cac0",
          },
          success: {
            main: "#00ffd5", // Seaweed
            light: "#66ffe6",
            dark: "#00ccaa",
          },
          background: {
            default: "#edf2f8", // Pale Sky 50
            paper: "#ffffff",
          },
          text: {
            primary: "#1c1718", // Coffee Bean 900
            secondary: "#534649", // Coffee Bean 700
          },
        }
      : {
          // Dark mode colors
          primary: {
            main: "#dc5677",
            light: "#e58099",
            dark: "#d42b55",
          },
          background: {
            default: "#0e1a25",
            paper: "#1d3449",
          },
          text: {
            primary: "#f3f1f2",
            secondary: "#b9acaf",
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
