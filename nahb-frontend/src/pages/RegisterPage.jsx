import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { styled } from "@mui/material/styles";
import AppTheme from "../theme/AppTheme";
import Content from "../components/auth/Content";
import {
  GoogleIcon,
  FacebookIcon,
  SitemarkIcon,
} from "../components/auth/CustomIcons";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [pseudoError, setPseudoError] = React.useState(false);
  const [pseudoErrorMessage, setPseudoErrorMessage] = React.useState("");
  const [role, setRole] = React.useState("lecteur");

  const validateInputs = () => {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const pseudo = document.getElementById("pseudo");

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Veuillez entrer une adresse email valide.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!pseudo.value || pseudo.value.length < 3) {
      setPseudoError(true);
      setPseudoErrorMessage("Le pseudo doit contenir au moins 3 caractères.");
      isValid = false;
    } else {
      setPseudoError(false);
      setPseudoErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pseudoError || emailError || passwordError) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const pseudo = data.get("pseudo");
    const email = data.get("email");
    const password = data.get("password");

    try {
      const result = await register(pseudo, email, password, role);
      if (result.success) {
        navigate("/");
      } else {
        setEmailError(true);
        setEmailErrorMessage(result.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Register failed:", error);
      setEmailError(true);
      setEmailErrorMessage("Une erreur s'est produite");
    }
  };

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
          backgroundColor: "#ffffff",
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
            <Card variant="outlined">
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <SitemarkIcon />
              </Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
              >
                Inscription
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <FormControl>
                  <FormLabel htmlFor="pseudo">Pseudo</FormLabel>
                  <TextField
                    autoComplete="username"
                    name="pseudo"
                    required
                    fullWidth
                    id="pseudo"
                    placeholder="Votre pseudo"
                    error={pseudoError}
                    helperText={pseudoErrorMessage}
                    color={pseudoError ? "error" : "primary"}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    placeholder="votre@email.com"
                    name="email"
                    autoComplete="email"
                    variant="outlined"
                    error={emailError}
                    helperText={emailErrorMessage}
                    color={emailError ? "error" : "primary"}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="password">Mot de passe</FormLabel>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    placeholder="••••••"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    variant="outlined"
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    color={passwordError ? "error" : "primary"}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="role">Rôle</FormLabel>
                  <Select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="lecteur">Lecteur</MenuItem>
                    <MenuItem value="auteur">Auteur</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox value="allowExtraEmails" color="primary" />
                  }
                  label="Je souhaite recevoir des mises à jour par email."
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  onClick={validateInputs}
                >
                  S'inscrire
                </Button>
              </Box>
              <Divider>
                <Typography sx={{ color: "text.secondary" }}>ou</Typography>
              </Divider>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert("Inscription avec Google")}
                  startIcon={<GoogleIcon />}
                >
                  Continuer avec Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert("Inscription avec Facebook")}
                  startIcon={<FacebookIcon />}
                >
                  Continuer avec Facebook
                </Button>
                <Typography sx={{ textAlign: "center" }}>
                  Vous avez déjà un compte ?{" "}
                  <Link
                    href="/login"
                    variant="body2"
                    sx={{ alignSelf: "center" }}
                  >
                    Se connecter
                  </Link>
                </Typography>
              </Box>
            </Card>
          </Stack>
        </Stack>
      </Stack>
    </AppTheme>
  );
}
