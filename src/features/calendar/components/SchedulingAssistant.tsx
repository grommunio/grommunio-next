// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Recipient, ScheduleInformation } from "microsoft-graph";
import { getSchedule } from "../../../api/calendar";
import { browserTimeZone, dayjs, Dayjs } from "../dates";
import { availabilityRanges } from "../eventUtils";
import PersonAvatar from "../../../components/common/PersonAvatar";

type SchedulingAssistantProps = {
  attendees: Recipient[];
  ownAddress?: string;
  start: Dayjs;
  end: Dayjs;
};

const INTERVAL = 30;
const COLORS: Record<string, string> = { "0": "transparent", "1": "#8fbcf0", "2": "#4f78c7", "3": "#8e2a9b", "4": "#9aa4b2" };
// Tentative is hatched so it does not rely on color alone
const PATTERNS: Record<string, string> = { "1": "repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,0.35) 3px 5px)", "4": "repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,0.6) 3px 5px)" };
const slotSx = (code: string) => ({ bgcolor: COLORS[code] || COLORS["4"], backgroundImage: PATTERNS[code] || "none" });
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
  // Locale-aware short hour labels
  const hourFormat = /a/i.test(dayjs.localeData().longDateFormat("LT")) ? "h A" : "H";
  const slotTime = (i: number) => dayStart.add(i * INTERVAL, "minute").format("LT");
  const describe = (view: string) => {
    const ranges = availabilityRanges(view.slice(0, slots));
    if (!view) return t("No information");
    if (!ranges.length) return t("Free");
    return ranges.map(r => `${t(LABELS[r.code] || "Unknown")} ${slotTime(r.from)} – ${slotTime(r.to)}`).join(", ");
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle2">{t("Availability")} · {start.format("dddd, LL")}</Typography>
        {loading && <CircularProgress size={14} />}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1 }}>
        {["1", "2", "3", "4"].map(code => (
          <Box key={code} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 14, height: 10, border: 1, borderColor: "divider", ...slotSx(code) }} />
            <Typography variant="caption" color="text.secondary">{t(LABELS[code])}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 0.5, alignItems: "center" }}>
        <Box />
        <Box sx={{ display: "flex", position: "relative", height: 16 }}>
          {Array.from({ length: slots }).map((_, i) => i % 2 === 0 && (
            <Typography key={i} variant="caption" sx={{ position: "absolute", left: `${(i / slots) * 100}%`, fontSize: 10, color: "text.secondary" }}>
              {dayStart.add(i * INTERVAL, "minute").format(hourFormat)}
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
            <Box key={address + "-v"} role="img" aria-label={`${name}: ${loading && !info ? t("Loading") : describe(view)}`} sx={{ position: "relative", display: "flex", height: 22, border: 1, borderColor: "divider", borderRadius: 0.5, overflow: "hidden" }}>
              {Array.from({ length: slots }).map((_, i) => {
                const code = view[i] || "0";
                return (
                  <Tooltip key={i} title={`${dayStart.add(i * INTERVAL, "minute").format("LT")} – ${t(LABELS[code] || "Unknown")}`}>
                    <Box sx={{ flex: 1, ...slotSx(code), borderRight: i % 2 === 1 ? 1 : 0, borderColor: "divider" }} />
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
