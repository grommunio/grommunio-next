// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Dialog, IconButton, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Typography, useMediaQuery } from "@mui/material";
import { AccountCircleOutlined, CalendarMonthOutlined, Close, KeyboardOutlined, LabelOutlined, LanguageOutlined, MailOutline, NotificationsOutlined, PaletteOutlined, ReplyAllOutlined, RuleOutlined, ViewSidebarOutlined, DrawOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { loadMailboxSettings } from "../settingsSlice";
import { AccountSettings, AppearanceSettings, LanguageTimeSettings, NotificationSettings, ShortcutsHelp } from "./GeneralSettings";
import { AutoRepliesSettings, MailLayoutSettings, SignatureSettings } from "./MailSettings";
import { RulesSettings } from "./RulesSettings";
import { CalendarSettings } from "./CalendarSettings";
import { CategoriesSettings } from "./CategoriesSettings";

export type SettingsPage =
  | "appearance" | "language" | "notifications" | "shortcuts" | "account"
  | "mail-layout" | "mail-compose" | "mail-rules" | "mail-autoreplies" | "categories" | "calendar";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  initialPage?: SettingsPage;
};

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("General")
// t("Mail")
// t("Calendar")
// t("Appearance")
// t("Language and time")
// t("Notifications")
// t("Categories")
// t("Keyboard shortcuts")
// t("Account")
// t("Layout")
// t("Compose and reply")
// t("Rules")
// t("Automatic replies")
// t("View and events")
const NAV: Array<{ group: string; items: Array<{ key: SettingsPage; label: string; icon: JSX.Element }> }> = [
  { group: "General", items: [
    { key: "appearance", label: "Appearance", icon: <PaletteOutlined fontSize="small" /> },
    { key: "language", label: "Language and time", icon: <LanguageOutlined fontSize="small" /> },
    { key: "notifications", label: "Notifications", icon: <NotificationsOutlined fontSize="small" /> },
    { key: "categories", label: "Categories", icon: <LabelOutlined fontSize="small" /> },
    { key: "shortcuts", label: "Keyboard shortcuts", icon: <KeyboardOutlined fontSize="small" /> },
    { key: "account", label: "Account", icon: <AccountCircleOutlined fontSize="small" /> },
  ] },
  { group: "Mail", items: [
    { key: "mail-layout", label: "Layout", icon: <ViewSidebarOutlined fontSize="small" /> },
    { key: "mail-compose", label: "Compose and reply", icon: <DrawOutlined fontSize="small" /> },
    { key: "mail-rules", label: "Rules", icon: <RuleOutlined fontSize="small" /> },
    { key: "mail-autoreplies", label: "Automatic replies", icon: <ReplyAllOutlined fontSize="small" /> },
  ] },
  { group: "Calendar", items: [
    { key: "calendar", label: "View and events", icon: <CalendarMonthOutlined fontSize="small" /> },
  ] },
];

const PAGES: Record<SettingsPage, () => JSX.Element> = {
  appearance: () => <AppearanceSettings />,
  language: () => <LanguageTimeSettings />,
  notifications: () => <NotificationSettings />,
  categories: () => <CategoriesSettings />,
  shortcuts: () => <ShortcutsHelp />,
  account: () => <AccountSettings />,
  "mail-layout": () => <MailLayoutSettings />,
  "mail-compose": () => <SignatureSettings />,
  "mail-rules": () => <RulesSettings />,
  "mail-autoreplies": () => <AutoRepliesSettings />,
  calendar: () => <CalendarSettings />,
};

const SettingsDialog = ({ open, onClose, initialPage = "appearance" }: SettingsDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState<SettingsPage>(initialPage);
  const [showNav, setShowNav] = useState(true);
  const loaded = useTypeSelector(state => state.settings.mailboxSettingsLoaded);

  useEffect(() => { if (open) { setPage(initialPage); setShowNav(true); } }, [open, initialPage]);
  useEffect(() => { if (open && !loaded) dispatch(loadMailboxSettings()); }, [open]);

  const Page = PAGES[page];
  const current = NAV.flatMap(g => g.items).find(i => i.key === page);
  const Icon = MailOutline;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile} PaperProps={{ sx: { height: isMobile ? "100%" : "min(760px, 92vh)", display: "flex", flexDirection: "row", overflow: "hidden" } }}>
      {(!isMobile || showNav) && (
        <Box sx={{ width: isMobile ? "100%" : 240, flexShrink: 0, borderRight: isMobile ? 0 : 1, borderColor: "divider", bgcolor: "background.default", overflowY: "auto" }}>
          <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>{t("Settings")}</Typography>
          <List dense disablePadding>
            {NAV.map(group => (
              <Box key={group.group}>
                <ListSubheader disableSticky sx={{ bgcolor: "transparent", lineHeight: "32px" }}>{t(group.group)}</ListSubheader>
                {group.items.map(item => (
                  <ListItemButton key={item.key} selected={item.key === page} onClick={() => { setPage(item.key); setShowNav(false); }} sx={{ mx: 1, borderRadius: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={t(item.label)} />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Box>
      )}
      {(!isMobile || !showNav) && (
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            {isMobile && <IconButton onClick={() => setShowNav(true)} sx={{ mr: 1 }} aria-label={t("Back")}><Icon /></IconButton>}
            <Typography variant="h6" sx={{ flex: 1 }}>{current ? t(current.label) : ""}</Typography>
            <IconButton onClick={onClose} aria-label={t("Close")}><Close /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5 }}>
            <Page />
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default SettingsDialog;
