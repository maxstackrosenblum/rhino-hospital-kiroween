import { createTheme } from "@mui/material/styles";

// Create MUI theme that matches existing CSS variables
export const createAppTheme = (mode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#16a249",
        hover: "#14903f",
        gradient: {
          start: "rgb(22, 162, 73)",
          end: "rgb(22, 162, 73)",
        },
      },
      secondary: {
        main: "#16a249",
        hover: "#14903f",
      },
      background: {
        default: isDark ? "#2a3240" : "#f2f4f8",
        paper: isDark ? "#3d4653" : "#ffffff",
        input: isDark ? "#4a5463" : "#e8e8e8",
      },
      text: {
        primary: isDark ? "#f2f4f8" : "#1a1d23",
        secondary: isDark ? "#d1d7db" : "#495057",
      },
      success: {
        main: isDark ? "#a8d5c5" : "#00d4aa",
      },
      error: {
        main: isDark ? "#ff8a80" : "#d32f2f",
      },
      divider: isDark ? "#6d767e" : "#d1d7db",
      // Custom colors to match existing design
      custom: {
        accent: isDark ? "#d1d7db" : "#3d4653",
        border: isDark ? "#6d767e" : "#d1d7db",
        borderBottom: "rgb(217, 217, 217)",
      },
    },
    typography: {
      fontFamily: 'Inter, "Space Grotesk", system-ui, sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 700,
        color: isDark ? "#f2f4f8" : "#1a1d23",
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 600,
        color: isDark ? "#f2f4f8" : "#1a1d23",
      },
      h3: {
        fontSize: "1.5rem",
        fontWeight: 600,
        color: isDark ? "#f2f4f8" : "#1a1d23",
      },
      body1: {
        fontSize: "1rem",
        color: isDark ? "#d1d7db" : "#495057",
      },
      body2: {
        fontSize: "0.875rem",
        color: isDark ? "#d1d7db" : "#495057",
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      "none",
      "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
      "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
      "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
      "0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)",
      "0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)",
      ...Array(19).fill(
        "0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)"
      ),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: 'Inter, "Space Grotesk", system-ui, sans-serif',
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 8,
            fontSize: "14px",
          },
          text: {
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(22, 162, 73, 0.08)"
                : "rgba(22, 162, 73, 0.04)",
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: isDark ? "#14903f" : "#14903f",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: isDark ? "#4a5463" : "#ffffff",
              "& fieldset": {
                borderColor: isDark ? "#6d767e" : "#e0e0e0",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "#16a249" : "#16a249",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#16a249",
                borderWidth: "2px",
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: isDark ? `1px solid #6d767e` : "none",
            boxShadow: isDark
              ? "0 1px 3px rgba(0, 0, 0, 0.12)"
              : "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#3d4653" : "#ffffff",
            color: isDark ? "#f2f4f8" : "#1a1d23",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
            borderBottom: `1px solid ${isDark ? "#6d767e" : "#e0e0e0"}`,
          },
        },
      },
    },
  });
};
