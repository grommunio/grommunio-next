// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Alert, Box, Button, CircularProgress, IconButton, Menu, MenuItem, Paper, Tooltip, Typography } from "@mui/material";
import { Login as LoginIcon, Translate } from "@mui/icons-material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import GrommunioLogo from "../components/logos/GrommunioLogo";
import { getLangs } from "../utils";
import { useAppContext } from "../azure/AppContext";
import { useTypeDispatch, useTypeSelector } from "../store";
import { setLanguage } from "../features/settings/settingsSlice";
import { setExplicitLanguage } from "../features/settings/language";
import { useThemeSettings } from "../components/ThemeContext";
import getConfig from "../config";

const Login = () => {
  const { t, i18n } = useTranslation();
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const language = useTypeSelector(state => state.settings.language);
  const { mode } = useThemeSettings();
  const [langsAnchor, setLangsAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = getConfig();

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await app.signIn();
    } catch (err: any) {
      // user_cancelled etc. are not worth an error message
      if (!/cancel|closed/i.test(err?.errorCode || err?.message || "")) {
        setError(err?.message || String(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLangChange = (lang: string) => () => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
    setExplicitLanguage(lang);
    setLangsAnchor(null);
  };

  const misconfigured = !config.appId || config.appId === "YOUR_APP_ID";

  return (
    <Box
      sx={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 2, position: "relative",
        background: mode === "dark"
          ? "radial-gradient(circle at 20% 20%, rgba(79,120,199,0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(29,75,153,0.25), transparent 50%), #101214"
          : "radial-gradient(circle at 20% 20%, rgba(29,75,153,0.12), transparent 50%), radial-gradient(circle at 80% 80%, rgba(79,120,199,0.16), transparent 50%), #f3f5f8",
      }}
    >
      <Tooltip title={t("Language")}>
        <IconButton onClick={(e: MouseEvent<HTMLElement>) => setLangsAnchor(e.currentTarget)} sx={{ position: "absolute", top: 12, right: 12 }} aria-label={t("Language")}>
          <Translate />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={langsAnchor} open={Boolean(langsAnchor)} onClose={() => setLangsAnchor(null)}>
        {getLangs().map(({ key, value }) => (
          <MenuItem key={key} selected={language === key} onClick={handleLangChange(key)}>{value}</MenuItem>
        ))}
      </Menu>
      <Paper variant="outlined" sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 5 }, borderRadius: 3, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <GrommunioLogo height={44} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{t("Welcome")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t("Sign in with your account to access mail, calendar, contacts and tasks.")}
        </Typography>
        {misconfigured && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
            {t("The application is not configured yet: set appId in config.json.")}
          </Alert>
        )}
        {(error || app.error) && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }} onClose={() => { setError(null); app.clearError(); }}>
            {error || app.error?.message}
          </Alert>
        )}
        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
          onClick={handleLogin}
          disabled={busy || misconfigured}
          sx={{ py: 1.25 }}
        >
          {t("Sign in")}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
          {t("You will be redirected to your identity provider.")}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
