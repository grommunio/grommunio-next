// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Box, ButtonBase, Tooltip, Typography } from "@mui/material";
import {
  CalendarMonth, CalendarMonthOutlined, MailOutlined, Mail, PeopleAltOutlined, PeopleAlt,
  TaskAltOutlined, TaskAlt, StickyNote2Outlined, StickyNote2,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import type { SvgIconComponent } from "@mui/icons-material";

export const RAIL_WIDTH = 64;

type RailItem = {
  key: string;
  label: string;
  route: string;
  match: string[];
  icon: SvgIconComponent;
  activeIcon: SvgIconComponent;
};

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Mail")
// t("Calendar")
// t("People")
// t("Tasks")
// t("Notes")
const items: RailItem[] = [
  { key: "mail", label: "Mail", route: "/mail", match: ["/mail", "/"], icon: MailOutlined, activeIcon: Mail },
  { key: "calendar", label: "Calendar", route: "/calendar", match: ["/calendar"], icon: CalendarMonthOutlined, activeIcon: CalendarMonth },
  { key: "contacts", label: "People", route: "/contacts", match: ["/contacts"], icon: PeopleAltOutlined, activeIcon: PeopleAlt },
  { key: "tasks", label: "Tasks", route: "/tasks", match: ["/tasks"], icon: TaskAltOutlined, activeIcon: TaskAlt },
  { key: "notes", label: "Notes", route: "/notes", match: ["/notes"], icon: StickyNote2Outlined, activeIcon: StickyNote2 },
];

function isActive(item: RailItem, pathname: string) {
  return item.match.some(m => m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/"));
}

const AppRail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box
      component="nav"
      aria-label={t("Apps")}
      sx={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        pt: 1,
        gap: 0.5,
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {items.map(item => {
        const active = isActive(item, pathname);
        const Icon = active ? item.activeIcon : item.icon;
        return (
          <Tooltip key={item.key} title={t(item.label)} placement="right">
            <ButtonBase
              onClick={() => navigate(item.route)}
              aria-current={active ? "page" : undefined}
              sx={{
                mx: 1,
                py: 1,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                color: active ? "primary.main" : "text.secondary",
                position: "relative",
                "&:hover": { bgcolor: "action.hover" },
                "&::before": active ? {
                  content: '""',
                  position: "absolute",
                  left: -8,
                  top: 10,
                  bottom: 10,
                  width: 3,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                } : undefined,
              }}
            >
              <Icon fontSize="medium" />
              <Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1.2, fontWeight: active ? 600 : 400 }}>
                {t(item.label)}
              </Typography>
            </ButtonBase>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default AppRail;
