// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import createAppTheme, { ColorMode, ColorModePreference, DEFAULT_COLOR_THEME, THEME_COLORS } from "../theme";

type ThemeContextValue = {
  // resolved from the system preference
  mode: ColorMode;
  preference: ColorModePreference;
  setPreference: (preference: ColorModePreference) => void;
  colorTheme: string;
  setColorTheme: (name: string) => void;
};

const STORAGE_MODE = "colorMode";
const STORAGE_THEME = "colorTheme";

const ThemeSettingsContext = createContext<ThemeContextValue>({
  mode: "light",
  preference: "system",
  setPreference: () => undefined,
  colorTheme: DEFAULT_COLOR_THEME,
  setColorTheme: () => undefined,
});

export const useThemeSettings = () => useContext(ThemeSettingsContext);

function readPreference(): ColorModePreference {
  const stored = window.localStorage.getItem(STORAGE_MODE);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  // Migrate the old boolean setting
  const legacy = window.localStorage.getItem("darkMode");
  if (legacy === "true") return "dark";
  if (legacy === "false") return "light";
  return "system";
}

function systemMode(): ColorMode {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorModePreference>(readPreference);
  const [system, setSystem] = useState<ColorMode>(systemMode);
  const [colorTheme, setColorThemeState] = useState<string>(() => {
    const stored = window.localStorage.getItem(STORAGE_THEME);
    return stored && THEME_COLORS[stored] ? stored : DEFAULT_COLOR_THEME;
  });

  // Follow the OS setting while "system" is selected
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setSystem(e.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const setPreference = useCallback((value: ColorModePreference) => {
    window.localStorage.setItem(STORAGE_MODE, value);
    window.localStorage.removeItem("darkMode");
    setPreferenceState(value);
  }, []);

  const setColorTheme = useCallback((name: string) => {
    window.localStorage.setItem(STORAGE_THEME, name);
    setColorThemeState(name);
  }, []);

  const mode: ColorMode = preference === "system" ? system : preference;
  const theme = useMemo(() => createAppTheme(mode, colorTheme), [mode, colorTheme]);
  const value = useMemo(() => ({ mode, preference, setPreference, colorTheme, setColorTheme }),
    [mode, preference, setPreference, colorTheme, setColorTheme]);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeSettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
}
