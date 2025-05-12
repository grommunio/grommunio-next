// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { AppBar, Box, IconButton, Toolbar, Tooltip } from "@mui/material";
import { DarkModeOutlined, LightModeOutlined, SettingsOutlined } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import GrommunioLogo from "../logos/GrommunioLogo";
import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";
import SettingsDrawer from "../settings/SettingsDrawer";
import { useThemeSettings } from "../ThemeContext";

export const TOPBAR_HEIGHT = 48;

const TopBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mode, setPreference } = useThemeSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppBar position="static" sx={{ height: TOPBAR_HEIGHT, justifyContent: "center", zIndex: theme => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" disableGutters sx={{ minHeight: TOPBAR_HEIGHT, px: 1.5 }}>
        <Box
          onClick={() => navigate("/")}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", mr: 2, minWidth: { xs: 36, sm: 160 } }}
          aria-label="grommunio Next"
        >
          <Box sx={{ display: { xs: "none", sm: "block" } }}><GrommunioLogo height={26} /></Box>
          <Box sx={{ display: { xs: "block", sm: "none" } }}><GrommunioLogo height={26} iconOnly /></Box>
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <GlobalSearch />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={mode === "dark" ? t("Light mode") : t("Dark mode")}>
            <IconButton onClick={() => setPreference(mode === "dark" ? "light" : "dark")} aria-label={t("Toggle dark mode")}>
              {mode === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Settings")}>
            <IconButton onClick={() => setSettingsOpen(true)} aria-label={t("Settings")}>
              <SettingsOutlined />
            </IconButton>
          </Tooltip>
          <UserMenu />
        </Box>
      </Toolbar>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppBar>
  );
};

export default TopBar;
