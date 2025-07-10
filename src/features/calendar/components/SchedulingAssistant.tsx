// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Recipient, ScheduleInformation } from "microsoft-graph";
import { getSchedule } from "../../../api/calendar";
import { browserTimeZone, Dayjs } from "../dates";
import PersonAvatar from "../../../components/common/PersonAvatar";

type SchedulingAssistantProps = {
  attendees: Recipient[];
  ownAddress?: string;
  start: Dayjs;
  end: Dayjs;
};

const INTERVAL = 30;
const COLORS: Record<string, string> = { "0": "transparent", "1": "#8fbcf0", "2": "#4f78c7", "3": "#8e2a9b", "4": "#9aa4b2" };
// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Free")
// t("Tentative")
// t("Busy")
// t("Out of office")
// t("Working elsewhere")
// t("Unknown")
const LABELS: Record<string, string> = { "0": "Free", "1": "Tentative", "2": "Busy", "3": "Out of office", "4": "Working elsewhere" };

const SchedulingAssistant = ({ attendees, ownAddress, start, end }: SchedulingAssistantProps) => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<ScheduleInformation[]>([]);
  const [loading, setLoading] = useState(false);
  const addresses = [ownAddress, ...attendees.map(a => a.emailAddress?.address)].filter((a): a is string => Boolean(a));
  const dayStart = start.startOf("day").hour(7);
  const dayEnd = start.startOf("day").hour(20);
  const slots = Math.round(dayEnd.diff(dayStart, "minute") / INTERVAL);

  useEffect(() => {
    if (addresses.length === 0) return;
    let cancelled = false;
    setLoading(true);
    getSchedule(addresses, dayStart.format("YYYY-MM-DDTHH:mm:ss"), dayEnd.format("YYYY-MM-DDTHH:mm:ss"), browserTimeZone(), INTERVAL)
      .then(result => { if (!cancelled) setSchedules(result); })
      .catch(() => { if (!cancelled) setSchedules([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [addresses.join(","), dayStart.toISOString()]);

  if (addresses.length === 0) return null;

  const selStart = Math.max(0, start.diff(dayStart, "minute") / INTERVAL);
  const selEnd = Math.min(slots, end.diff(dayStart, "minute") / INTERVAL);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle2">{t("Availability")} · {start.format("dddd, LL")}</Typography>
        {loading && <CircularProgress size={14} />}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 0.5, alignItems: "center" }}>
        <Box />
        <Box sx={{ display: "flex", position: "relative", height: 16 }}>
          {Array.from({ length: slots }).map((_, i) => i % 2 === 0 && (
            <Typography key={i} variant="caption" sx={{ position: "absolute", left: `${(i / slots) * 100}%`, fontSize: 10, color: "text.secondary" }}>
              {dayStart.add(i * INTERVAL, "minute").format("H")}
            </Typography>
          ))}
        </Box>
        {addresses.map(address => {
          const info = schedules.find(s => s.scheduleId?.toLowerCase() === address.toLowerCase());
          const view = info?.availabilityView || "";
          const name = attendees.find(a => a.emailAddress?.address === address)?.emailAddress?.name || (address === ownAddress ? t("You") : address);
          return [
            <Box key={address + "-n"} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <PersonAvatar name={name} email={address} size={24} />
              <Typography variant="body2" noWrap>{name}</Typography>
            </Box>,
            <Box key={address + "-v"} sx={{ position: "relative", display: "flex", height: 22, border: 1, borderColor: "divider", borderRadius: 0.5, overflow: "hidden" }}>
              {Array.from({ length: slots }).map((_, i) => {
                const code = view[i] || "0";
                return (
                  <Tooltip key={i} title={`${dayStart.add(i * INTERVAL, "minute").format("LT")} – ${t(LABELS[code] || "Unknown")}`}>
                    <Box sx={{ flex: 1, bgcolor: COLORS[code] || COLORS["4"], borderRight: i % 2 === 1 ? 1 : 0, borderColor: "divider" }} />
                  </Tooltip>
                );
              })}
              {!info && !loading && <Typography variant="caption" sx={{ position: "absolute", left: 4, top: 2, color: "text.secondary" }}>{t("No information")}</Typography>}
              <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${(selStart / slots) * 100}%`, width: `${((selEnd - selStart) / slots) * 100}%`, border: 2, borderColor: "primary.main", bgcolor: "rgba(29,75,153,0.12)", pointerEvents: "none" }} />
            </Box>,
          ];
        })}
      </Box>
    </Box>
  );
};

export default SchedulingAssistant;
