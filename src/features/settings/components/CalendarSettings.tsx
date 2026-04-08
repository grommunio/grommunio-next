// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, FormControlLabel, MenuItem, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayOfWeek } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { updateCalendarPrefs } from "../../calendar/calendarSlice";
import { saveWorkingHours } from "../settingsSlice";
import { REMINDER_OPTIONS } from "../../../constants";
import { browserTimeZone, dayjs } from "../../calendar/dates";
import { Section } from "./GeneralSettings";

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_INDEX: Record<DayOfWeek, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const prefs = useTypeSelector(state => state.calendar.prefs);
  const workingHours = useTypeSelector(state => state.settings.mailboxSettings.workingHours);
  const [days, setDays] = useState<DayOfWeek[]>(prefs.workDays.map(d => DAYS[(d + 6) % 7]));
  const [start, setStart] = useState(prefs.workDayStart);
  const [end, setEnd] = useState(prefs.workDayEnd);

  // Mailbox working hours win over the local defaults
  useEffect(() => {
    if (!workingHours) return;
    if (workingHours.daysOfWeek?.length) setDays(workingHours.daysOfWeek);
    if (workingHours.startTime) setStart(parseInt(workingHours.startTime.slice(0, 2), 10));
    if (workingHours.endTime) setEnd(parseInt(workingHours.endTime.slice(0, 2), 10));
  }, [workingHours]);

  const validHours = end > start;

  const changeStart = (value: number) => {
    setStart(value);
    // The end must stay after the start
    if (end <= value) setEnd(value + 1);
  };

  const saveHours = async () => {
    if (!validHours) return;
    const result = await dispatch(saveWorkingHours({
      daysOfWeek: days,
      startTime: `${String(start).padStart(2, "0")}:00:00.0000000`,
      endTime: `${String(end).padStart(2, "0")}:00:00.0000000`,
      timeZone: { name: workingHours?.timeZone?.name || browserTimeZone() },
    }));
    // Local prefs follow only once the server accepted the change
    if (saveWorkingHours.fulfilled.match(result)) {
      dispatch(updateCalendarPrefs({ workDays: days.map(d => DAY_INDEX[d]), workDayStart: start, workDayEnd: end }));
    }
  };

  return <>
    <Section title={t("Calendar appearance")}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}>
        <TextField select label={t("First day of the week")} value={prefs.weekStartsOn} onChange={e => dispatch(updateCalendarPrefs({ weekStartsOn: Number(e.target.value) as 0 | 1 | 6 }))}>
          <MenuItem value={1}>{dayjs().day(1).format("dddd")}</MenuItem>
          <MenuItem value={0}>{dayjs().day(0).format("dddd")}</MenuItem>
          <MenuItem value={6}>{dayjs().day(6).format("dddd")}</MenuItem>
        </TextField>
        <TextField select label={t("Time scale")} value={prefs.timeStep} onChange={e => dispatch(updateCalendarPrefs({ timeStep: Number(e.target.value) as 15 | 30 | 60 }))}>
          <MenuItem value={15}>15 {t("minutes")}</MenuItem><MenuItem value={30}>30 {t("minutes")}</MenuItem><MenuItem value={60}>60 {t("minutes")}</MenuItem>
        </TextField>
        <FormControlLabel control={<Switch checked={prefs.showWeekNumbers} onChange={e => dispatch(updateCalendarPrefs({ showWeekNumbers: e.target.checked }))} />} label={t("Show week numbers")} />
      </Box>
    </Section>
    <Section title={t("Working hours")} description={t("Hours outside your working time are shaded in the calendar. The setting is also stored in your mailbox so others see when you are available.")}>
      <ToggleButtonGroup value={days} onChange={(_e, v: DayOfWeek[]) => v.length && setDays(v)} size="small" sx={{ mb: 2, flexWrap: "wrap" }} aria-label={t("Work days")}>
        {DAYS.map(d => <ToggleButton key={d} value={d} sx={{ width: 48 }}>{dayjs().day(DAY_INDEX[d]).format("dd")}</ToggleButton>)}
      </ToggleButtonGroup>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <TextField select label={t("Start time")} value={start} onChange={e => changeStart(Number(e.target.value))} sx={{ width: 140 }}>
          {HOURS.slice(0, -1).map(h => <MenuItem key={h} value={h}>{dayjs().hour(h).minute(0).format("LT")}</MenuItem>)}
        </TextField>
        <Typography color="text.secondary">–</Typography>
        <TextField select label={t("End time")} value={end} onChange={e => setEnd(Number(e.target.value))} sx={{ width: 140 }}>
          {HOURS.filter(h => h > start).map(h => <MenuItem key={h} value={h}>{dayjs().hour(h).minute(0).format("LT")}</MenuItem>)}
        </TextField>
      </Box>
      <Button variant="contained" onClick={saveHours} disabled={!validHours}>{t("Save")}</Button>
    </Section>
    <Section title={t("Events")}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}>
        <TextField select label={t("Default reminder")} value={prefs.defaultReminder} onChange={e => dispatch(updateCalendarPrefs({ defaultReminder: Number(e.target.value) }))}>
          {REMINDER_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{t(o.label)}</MenuItem>)}
        </TextField>
        <TextField select label={t("Default duration")} value={prefs.defaultDuration} onChange={e => dispatch(updateCalendarPrefs({ defaultDuration: Number(e.target.value) }))}>
          {[15, 30, 45, 60, 90, 120].map(m => <MenuItem key={m} value={m}>{m} {t("minutes")}</MenuItem>)}
        </TextField>
      </Box>
    </Section>
  </>;
};
