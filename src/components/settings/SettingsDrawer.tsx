// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import {
  Box, Divider, Drawer, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import { Check, Close, DarkModeOutlined, LightModeOutlined, SettingsBrightnessOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useThemeSettings } from "../ThemeContext";
import { THEME_COLORS, ColorModePreference } from "../../theme";
import { getLangs } from "../../utils";
import { useTypeDispatch, useTypeSelector } from "../../store";
import { changeSettings, patchMailboxSettingsData } from "../../actions/settings";

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const SettingsDrawer = ({ open, onClose }: SettingsDrawerProps) => {
  const { t, i18n } = useTranslation();
  const { preference, setPreference, colorTheme, setColorTheme } = useThemeSettings();
  const dispatch = useTypeDispatch();
  const language = useTypeSelector(state => state.settings.language);

  const handleLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
    dispatch(changeSettings("language", locale));
    window.localStorage.setItem("lang", locale);
    dispatch(patchMailboxSettingsData({ language: { locale } }));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 340, p: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">{t("Settings")}</Typography>
        <IconButton onClick={onClose} aria-label={t("Close")}><Close /></IconButton>
      </Box>

      <Typography variant="subtitle2" gutterBottom>{t("Appearance")}</Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={preference}
        onChange={(_e, value: ColorModePreference | null) => value && setPreference(value)}
        aria-label={t("Color mode")}
      >
        <ToggleButton value="light"><LightModeOutlined fontSize="small" sx={{ mr: 1 }} />{t("Light")}</ToggleButton>
        <ToggleButton value="dark"><DarkModeOutlined fontSize="small" sx={{ mr: 1 }} />{t("Dark")}</ToggleButton>
        <ToggleButton value="system"><SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} />{t("System")}</ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>{t("Accent color")}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {Object.entries(THEME_COLORS).map(([name, color]) => (
          <Tooltip key={name} title={t(color.label)}>
            <Box
              component="button"
              type="button"
              onClick={() => setColorTheme(name)}
              aria-label={color.label}
              aria-pressed={colorTheme === name}
              sx={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                bgcolor: color.main, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                outline: colorTheme === name ? "2px solid" : "none", outlineColor: "text.primary", outlineOffset: 2,
              }}
            >
              {colorTheme === name && <Check fontSize="small" />}
            </Box>
          </Tooltip>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle2" gutterBottom>{t("Language")}</Typography>
      <TextField select fullWidth value={language || "en-US"} onChange={e => handleLanguage(e.target.value)}>
        {getLangs().map(({ key, value }) => <MenuItem key={key} value={key}>{value}</MenuItem>)}
      </TextField>
    </Drawer>
  );
};

export default SettingsDrawer;
