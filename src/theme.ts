// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { createTheme, Theme } from "@mui/material/styles";
import { blue, blueGrey, brown, deepPurple, green, orange, pink, teal } from "@mui/material/colors";
import type { PaletteColorOptions } from "@mui/material";

export type ColorMode = "light" | "dark";
export type ColorModePreference = ColorMode | "system";

// The key is stored in the user settings
// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("grommunio")
// t("Blue")
// t("Teal")
// t("Green")
// t("Purple")
// t("Magenta")
// t("Orange")
// t("Brown")
// t("Blue grey")
export const THEME_COLORS: Record<string, { label: string; main: string; palette: PaletteColorOptions }> = {
  grommunio: { label: "grommunio", main: "#1d4b99", palette: { main: "#1d4b99", light: "#4f78c7", dark: "#0f2f6b", contrastText: "#fff" } },
  blue: { label: "Blue", main: blue[700], palette: { main: blue[700], light: blue[400], dark: blue[900], contrastText: "#fff" } },
  teal: { label: "Teal", main: teal[700], palette: { main: teal[700], light: teal[400], dark: teal[900], contrastText: "#fff" } },
  green: { label: "Green", main: green[700], palette: { main: green[700], light: green[400], dark: green[900], contrastText: "#fff" } },
  purple: { label: "Purple", main: deepPurple[500], palette: { main: deepPurple[500], light: deepPurple[300], dark: deepPurple[800], contrastText: "#fff" } },
  magenta: { label: "Magenta", main: pink[600], palette: { main: pink[600], light: pink[300], dark: pink[900], contrastText: "#fff" } },
  orange: { label: "Orange", main: orange[800], palette: { main: orange[800], light: orange[500], dark: orange[900], contrastText: "#fff" } },
  brown: { label: "Brown", main: brown[500], palette: { main: brown[500], light: brown[300], dark: brown[800], contrastText: "#fff" } },
  bluegrey: { label: "Blue grey", main: blueGrey[600], palette: { main: blueGrey[600], light: blueGrey[400], dark: blueGrey[800], contrastText: "#fff" } },
};

export const DEFAULT_COLOR_THEME = "grommunio";

// Deliberately flat: no gradients, subtle borders, rounded corners
export default function createAppTheme(mode: ColorMode, colorTheme: string = DEFAULT_COLOR_THEME): Theme {
  const accent = THEME_COLORS[colorTheme] || THEME_COLORS[DEFAULT_COLOR_THEME];
  const dark = mode === "dark";
  const divider = dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)";
  const base = createTheme({
    palette: {
      mode,
      primary: accent.palette,
      secondary: { main: dark ? "#9aa4b2" : "#5f6b7a" },
      divider,
      background: dark ? { default: "#101214", paper: "#1b1e22" } : { default: "#f3f5f8", paper: "#ffffff" },
      text: dark ? { primary: "#e7e9ec", secondary: "#9aa4b2" } : { primary: "#1f2328", secondary: "#5f6b7a" },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Roboto", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      button: { textTransform: "none", fontWeight: 500 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600, fontSize: "1.05rem" },
      subtitle2: { fontWeight: 600 },
    },
  });

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body, #root": { height: "100%" },
          body: { overflow: "hidden" },
          "*::-webkit-scrollbar": { width: 10, height: 10 },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
            borderRadius: 8,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "*::-webkit-scrollbar-thumb:hover": { backgroundColor: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" },
          "*::-webkit-scrollbar-track": { background: "transparent" },
          "*": { scrollbarWidth: "thin" },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: dark ? "#1b1e22" : "#ffffff",
            color: base.palette.text.primary,
            borderBottom: `1px solid ${divider}`,
            backgroundImage: "none",
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
          outlined: { borderColor: divider },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { boxShadow: dark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 12px 40px rgba(0,0,0,0.18)" },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${divider}`,
            boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            border: `1px solid ${divider}`,
            boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 6, minHeight: 32 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 6 } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            "&.Mui-selected": {
              backgroundColor: dark ? "rgba(255,255,255,0.1)" : accent.main + "1a",
              "&:hover": { backgroundColor: dark ? "rgba(255,255,255,0.14)" : accent.main + "26" },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: "none", minHeight: 44 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: 12 } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 6 } },
      },
      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiTableCell: {
        styleOverrides: { head: { fontWeight: 600 } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: divider } },
      },
    },
  });
}
