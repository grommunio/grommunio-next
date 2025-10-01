// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Autocomplete, Box, Button, Divider, FormControlLabel, MenuItem, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { Check, DarkModeOutlined, LightModeOutlined, SettingsBrightnessOutlined } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeSettings } from "../../../components/ThemeContext";
import { ColorModePreference, THEME_COLORS } from "../../../theme";
import { getLangs } from "../../../utils";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { loadTimeZones, saveMailboxSettings, setLanguage } from "../settingsSlice";
import { updatePrefs } from "../../mail/mailSlice";
import { useAppContext } from "../../../azure/AppContext";
import PersonAvatar from "../../../components/common/PersonAvatar";

export const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{description}</Typography>}
    {children}
  </Box>
);

export const AppearanceSettings = () => {
  const { t } = useTranslation();
  const { preference, setPreference, colorTheme, setColorTheme } = useThemeSettings();
  return <>
    <Section title={t("Color mode")}>
      <ToggleButtonGroup exclusive size="small" value={preference} onChange={(_e, v: ColorModePreference | null) => v && setPreference(v)} aria-label={t("Color mode")}>
        <ToggleButton value="light"><LightModeOutlined fontSize="small" sx={{ mr: 1 }} />{t("Light")}</ToggleButton>
        <ToggleButton value="dark"><DarkModeOutlined fontSize="small" sx={{ mr: 1 }} />{t("Dark")}</ToggleButton>
        <ToggleButton value="system"><SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} />{t("System")}</ToggleButton>
      </ToggleButtonGroup>
    </Section>
    <Section title={t("Accent color")}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {Object.entries(THEME_COLORS).map(([name, color]) => (
          <Tooltip key={name} title={t(color.label)}>
            <Box component="button" type="button" onClick={() => setColorTheme(name)} aria-label={color.label} aria-pressed={colorTheme === name}
              sx={{ width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", bgcolor: color.main, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", outline: colorTheme === name ? "2px solid" : "none", outlineColor: "text.primary", outlineOffset: 2 }}>
              {colorTheme === name && <Check fontSize="small" />}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Section>
  </>;
};

const DATE_FORMATS = ["dd.MM.yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d MMM yyyy"];
const TIME_FORMATS = ["HH:mm", "h:mm tt"];

export const LanguageTimeSettings = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { language, mailboxSettings, timeZones } = useTypeSelector(state => state.settings);
  const [timeZone, setTimeZone] = useState(mailboxSettings.timeZone || "");
  const [dateFormat, setDateFormat] = useState(mailboxSettings.dateFormat || "");
  const [timeFormat, setTimeFormat] = useState(mailboxSettings.timeFormat || "");

  useEffect(() => { dispatch(loadTimeZones()); }, []);
  useEffect(() => {
    setTimeZone(mailboxSettings.timeZone || "");
    setDateFormat(mailboxSettings.dateFormat || "");
    setTimeFormat(mailboxSettings.timeFormat || "");
  }, [mailboxSettings.timeZone, mailboxSettings.dateFormat, mailboxSettings.timeFormat]);

  const handleLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
    dispatch(setLanguage(locale));
    dispatch(saveMailboxSettings({ language: { locale } }));
  };

  const dirty = timeZone !== (mailboxSettings.timeZone || "") || dateFormat !== (mailboxSettings.dateFormat || "") || timeFormat !== (mailboxSettings.timeFormat || "");
  const zoneOptions = timeZones.length ? timeZones : (timeZone ? [{ alias: timeZone, displayName: timeZone }] : []);

  return <>
    <Section title={t("Language")} description={t("Changes the language of the interface. The setting is stored in your mailbox.")}>
      <TextField select value={language} onChange={e => handleLanguage(e.target.value)} sx={{ minWidth: 280 }} inputProps={{ "aria-label": t("Language") }}>
        {getLangs().map(({ key, value }) => <MenuItem key={key} value={key}>{value}</MenuItem>)}
      </TextField>
    </Section>
    <Section title={t("Time zone and formats")} description={t("Used by the server when it formats dates for you, e.g. in meeting invitations.")}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}>
        <Autocomplete
          options={zoneOptions}
          getOptionLabel={o => o.displayName}
          value={zoneOptions.find(z => z.alias === timeZone) || null}
          onChange={(_e, v) => setTimeZone(v?.alias || "")}
          renderInput={params => <TextField {...params} label={t("Time zone")} />}
          isOptionEqualToValue={(a, b) => a.alias === b.alias}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField select label={t("Date format")} value={DATE_FORMATS.includes(dateFormat) ? dateFormat : ""} onChange={e => setDateFormat(e.target.value)} sx={{ flex: 1 }}>
            {!DATE_FORMATS.includes(dateFormat) && dateFormat && <MenuItem value="">{dateFormat}</MenuItem>}
            {DATE_FORMATS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </TextField>
          <TextField select label={t("Time format")} value={TIME_FORMATS.includes(timeFormat) ? timeFormat : ""} onChange={e => setTimeFormat(e.target.value)} sx={{ flex: 1 }}>
            {!TIME_FORMATS.includes(timeFormat) && timeFormat && <MenuItem value="">{timeFormat}</MenuItem>}
            <MenuItem value="HH:mm">{t("24-hour")} (14:30)</MenuItem>
            <MenuItem value="h:mm tt">{t("12-hour")} (2:30 PM)</MenuItem>
          </TextField>
        </Box>
        <Box>
          <Button variant="contained" disabled={!dirty} onClick={() => dispatch(saveMailboxSettings({ timeZone: timeZone || undefined, dateFormat: dateFormat || undefined, timeFormat: timeFormat || undefined }))}>{t("Save")}</Button>
        </Box>
      </Box>
    </Section>
  </>;
};

export const NotificationSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const prefs = useTypeSelector(state => state.mail.prefs);
  const supported = "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(supported ? Notification.permission : "unsupported");

  const toggle = async (enabled: boolean) => {
    if (enabled && supported && Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
    }
    dispatch(updatePrefs({ desktopNotifications: enabled }));
  };

  return (
    <Section title={t("Desktop notifications")} description={t("Show a system notification when new mail arrives while this tab is in the background.")}>
      <FormControlLabel control={<Switch checked={prefs.desktopNotifications && permission === "granted"} onChange={e => toggle(e.target.checked)} disabled={!supported || permission === "denied"} />} label={t("Notify me about new mail")} />
      {permission === "denied" && <Typography variant="caption" color="error" sx={{ display: "block" }}>{t("Notifications are blocked in the browser settings for this site.")}</Typography>}
      {!supported && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{t("This browser does not support notifications.")}</Typography>}
    </Section>
  );
};

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Everywhere")
// t("People and tasks")
// t("Focus the search box")
// t("Clear selection / search")
// t("New mail")
// t("Reply")
// t("Reply all")
// t("Forward")
// t("Delete")
// t("Archive")
// t("Mark as read/unread")
// t("Flag")
// t("Next / previous message")
// t("Select all")
// t("Send (in the editor)")
// t("New event")
// t("Today")
// t("Previous / next period")
// t("Day, work week, week, month, agenda")
// t("New contact / focus task input")
// t("Delete selection")
const SHORTCUTS: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: "Everywhere", items: [["/", "Focus the search box"], ["Esc", "Clear selection / search"]] },
  { group: "Mail", items: [["n", "New mail"], ["r", "Reply"], ["Shift + a", "Reply all"], ["f", "Forward"], ["Delete", "Delete"], ["e", "Archive"], ["u", "Mark as read/unread"], ["i", "Flag"], ["j / k, ↑ / ↓", "Next / previous message"], ["Ctrl + a", "Select all"], ["Ctrl + Enter", "Send (in the editor)"]] },
  { group: "Calendar", items: [["n", "New event"], ["t", "Today"], ["← / →", "Previous / next period"], ["1 … 5", "Day, work week, week, month, agenda"]] },
  { group: "People and tasks", items: [["n", "New contact / focus task input"], ["Delete", "Delete selection"]] },
];

export const ShortcutsHelp = () => {
  const { t } = useTranslation();
  return <>
    {SHORTCUTS.map(group => (
      <Section key={group.group} title={t(group.group)}>
        <Box component="table" sx={{ borderCollapse: "collapse", "& td": { py: 0.5, pr: 3, verticalAlign: "top" } }}>
          <tbody>
            {group.items.map(([keys, desc]) => (
              <tr key={keys}>
                <td><Box component="kbd" sx={{ fontFamily: "inherit", fontSize: 12, px: 0.75, py: 0.25, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", whiteSpace: "nowrap" }}>{keys}</Box></td>
                <td><Typography variant="body2">{t(desc)}</Typography></td>
              </tr>
            ))}
          </tbody>
        </Box>
      </Section>
    ))}
  </>;
};

export const AccountSettings = () => {
  const { t } = useTranslation();
  const app = useAppContext();
  const me = useTypeSelector(state => state.me);
  const email = me.mail || me.userPrincipalName || "";
  return (
    <Section title={t("Account")}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <PersonAvatar name={me.displayName} email={email} size={56} />
        <Box>
          <Typography variant="subtitle1">{me.displayName}</Typography>
          <Typography variant="body2" color="text.secondary">{email}</Typography>
          {me.jobTitle && <Typography variant="body2" color="text.secondary">{me.jobTitle}</Typography>}
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Button variant="outlined" color="inherit" onClick={() => app.signOut().catch(err => console.error(err))}>{t("Sign out")}</Button>
    </Section>
  );
};
