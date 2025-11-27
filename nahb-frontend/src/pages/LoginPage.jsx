import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import AppTheme from "../theme/AppTheme";
import SignInCard from "../components/auth/SignInCard";
import Content from "../components/auth/Content";

export default function LoginPage() {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Stack
        direction="column"
        component="main"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#edf2f8",
          overflow: "auto",
        }}
      >
        <Stack
          direction={{ xs: "column-reverse", md: "row" }}
          sx={{
            justifyContent: "center",
            gap: { xs: 6, sm: 12 },
            p: 2,
            mx: "auto",
          }}
        >
          <Stack
            direction={{ xs: "column-reverse", md: "row" }}
            sx={{
              justifyContent: "center",
              gap: { xs: 6, sm: 12 },
              p: { xs: 2, sm: 4 },
              m: "auto",
            }}
          >
            <Content />
            <SignInCard />
          </Stack>
        </Stack>
      </Stack>
    </AppTheme>
  );
}
