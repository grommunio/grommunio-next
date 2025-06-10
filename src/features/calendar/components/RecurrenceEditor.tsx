// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayOfWeek, PatternedRecurrence, WeekIndex } from "microsoft-graph";
import { dayjs, Dayjs } from "../dates";

const WEEKDAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const WEEK_INDEX: WeekIndex[] = ["first", "second", "third", "fourth", "last"];

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

type RecurrenceEditorProps = {
  open: boolean;
  start: Dayjs;
  value: PatternedRecurrence | null | undefined;
  onChange: (recurrence: PatternedRecurrence | null) => void;
  onClose: () => void;
};

export function describeRecurrence(recurrence: PatternedRecurrence | null | undefined, t: (k: string, o?: any) => string): string {
  const pattern = recurrence?.pattern;
  if (!pattern) return t("Does not repeat");
  const interval = pattern.interval || 1;
  switch (pattern.type) {
  case "daily": return interval === 1 ? t("Every day") : t("Every {{n}} days", { n: interval });
  case "weekly": {
    const days = (pattern.daysOfWeek || []).map(d => dayjs().day(WEEKDAYS.indexOf(d) + 1).format("ddd")).join(", ");
    return interval === 1 ? t("Every week on {{days}}", { days }) : t("Every {{n}} weeks on {{days}}", { n: interval, days });
  }
  case "absoluteMonthly": return interval === 1 ? t("Every month on day {{day}}", { day: pattern.dayOfMonth }) : t("Every {{n}} months on day {{day}}", { n: interval, day: pattern.dayOfMonth });
  case "relativeMonthly": return t("Every month on the {{index}} {{day}}", { index: t(pattern.index || "first"), day: dayjs().day(WEEKDAYS.indexOf(pattern.daysOfWeek?.[0] || "monday") + 1).format("dddd") });
  case "absoluteYearly": return t("Every year on {{date}}", { date: dayjs().month((pattern.month || 1) - 1).date(pattern.dayOfMonth || 1).format("D MMMM") });
  case "relativeYearly": return t("Every year on the {{index}} {{day}} of {{month}}", { index: t(pattern.index || "first"), day: dayjs().day(WEEKDAYS.indexOf(pattern.daysOfWeek?.[0] || "monday") + 1).format("dddd"), month: dayjs().month((pattern.month || 1) - 1).format("MMMM") });
  default: return t("Repeats");
  }
}

const RecurrenceEditor = ({ open, start, value, onChange, onClose }: RecurrenceEditorProps) => {
  const { t } = useTranslation();
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [interval, setInterval] = useState(1);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"absolute" | "relative">("absolute");
  const [endMode, setEndMode] = useState<"noEnd" | "endDate" | "numbered">("noEnd");
  const [endDate, setEndDate] = useState<Dayjs>(start.add(6, "month"));
  const [occurrences, setOccurrences] = useState(10);

  const startWeekday = WEEKDAYS[(start.day() + 6) % 7];
  const nth = Math.ceil(start.date() / 7);
  const weekIndex: WeekIndex = nth >= 5 ? "last" : WEEK_INDEX[nth - 1];

  useEffect(() => {
    if (!open) return;
    const pattern = value?.pattern;
    const range = value?.range;
    if (!pattern) {
      setFrequency("weekly");
      setInterval(1);
      setDays([startWeekday]);
      setMonthlyMode("absolute");
      setEndMode("noEnd");
      setEndDate(start.add(6, "month"));
      return;
    }
    setInterval(pattern.interval || 1);
    setDays(pattern.daysOfWeek?.length ? pattern.daysOfWeek : [startWeekday]);
    if (pattern.type === "daily") setFrequency("daily");
    else if (pattern.type === "weekly") setFrequency("weekly");
    else if (pattern.type === "absoluteMonthly" || pattern.type === "relativeMonthly") { setFrequency("monthly"); setMonthlyMode(pattern.type === "absoluteMonthly" ? "absolute" : "relative"); }
    else { setFrequency("yearly"); setMonthlyMode(pattern.type === "absoluteYearly" ? "absolute" : "relative"); }
    if (range?.type === "endDate" && range.endDate) { setEndMode("endDate"); setEndDate(dayjs(range.endDate)); }
    else if (range?.type === "numbered") { setEndMode("numbered"); setOccurrences(range.numberOfOccurrences || 10); }
    else setEndMode("noEnd");
  }, [open]);

  const build = (): PatternedRecurrence => {
    const base = { interval, firstDayOfWeek: "monday" as DayOfWeek };
    let pattern: PatternedRecurrence["pattern"];
    switch (frequency) {
    case "daily": pattern = { ...base, type: "daily" }; break;
    case "weekly": pattern = { ...base, type: "weekly", daysOfWeek: days.length ? days : [startWeekday] }; break;
    case "monthly": pattern = monthlyMode === "absolute" ?
      { ...base, type: "absoluteMonthly", dayOfMonth: start.date() } :
      { ...base, type: "relativeMonthly", daysOfWeek: [startWeekday], index: weekIndex }; break;
    default: pattern = monthlyMode === "absolute" ?
      { ...base, type: "absoluteYearly", dayOfMonth: start.date(), month: start.month() + 1 } :
      { ...base, type: "relativeYearly", daysOfWeek: [startWeekday], index: weekIndex, month: start.month() + 1 };
    }
    const range: PatternedRecurrence["range"] = endMode === "endDate" ?
      { type: "endDate", startDate: start.format("YYYY-MM-DD"), endDate: endDate.format("YYYY-MM-DD") } :
      endMode === "numbered" ?
        { type: "numbered", startDate: start.format("YYYY-MM-DD"), numberOfOccurrences: occurrences } :
        { type: "noEnd", startDate: start.format("YYYY-MM-DD") };
    return { pattern, range };
  };

  const unit = { daily: t("day(s)"), weekly: t("week(s)"), monthly: t("month(s)"), yearly: t("year(s)") }[frequency];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("Repeat")}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="body2">{t("Every")}</Typography>
          <TextField type="number" size="small" value={interval} onChange={e => setInterval(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))} inputProps={{ min: 1, max: 99, "aria-label": t("Interval") }} sx={{ width: 72 }} />
          <TextField select size="small" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} sx={{ flex: 1 }} inputProps={{ "aria-label": t("Frequency") }}>
            <MenuItem value="daily">{t("day(s)")}</MenuItem>
            <MenuItem value="weekly">{t("week(s)")}</MenuItem>
            <MenuItem value="monthly">{t("month(s)")}</MenuItem>
            <MenuItem value="yearly">{t("year(s)")}</MenuItem>
          </TextField>
        </Box>
        {frequency === "weekly" && (
          <ToggleButtonGroup value={days} onChange={(_e, v: DayOfWeek[]) => v.length && setDays(v)} size="small" sx={{ mb: 2, flexWrap: "wrap" }} aria-label={t("Days of week")}>
            {WEEKDAYS.map((d, i) => <ToggleButton key={d} value={d} sx={{ width: 40 }}>{dayjs().day(i + 1).format("dd")}</ToggleButton>)}
          </ToggleButtonGroup>
        )}
        {(frequency === "monthly" || frequency === "yearly") && (
          <RadioGroup value={monthlyMode} onChange={e => setMonthlyMode(e.target.value as "absolute" | "relative")} sx={{ mb: 2 }}>
            <FormControlLabel value="absolute" control={<Radio size="small" />} label={frequency === "monthly" ? t("On day {{day}}", { day: start.date() }) : t("On {{date}}", { date: start.format("D MMMM") })} />
            <FormControlLabel value="relative" control={<Radio size="small" />} label={t("On the {{index}} {{day}}", { index: t(weekIndex), day: start.format("dddd") }) + (frequency === "yearly" ? ` ${t("of")} ${start.format("MMMM")}` : "")} />
          </RadioGroup>
        )}
        <Typography variant="subtitle2" gutterBottom>{t("Ends")}</Typography>
        <RadioGroup value={endMode} onChange={e => setEndMode(e.target.value as typeof endMode)}>
          <FormControlLabel value="noEnd" control={<Radio size="small" />} label={t("Never")} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel value="endDate" control={<Radio size="small" />} label={t("On")} />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
              <DatePicker value={endDate} onChange={v => v && setEndDate(v)} minDate={start} disabled={endMode !== "endDate"} slotProps={{ textField: { size: "small", sx: { flex: 1 } } }} />
            </LocalizationProvider>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel value="numbered" control={<Radio size="small" />} label={t("After")} />
            <TextField type="number" size="small" value={occurrences} onChange={e => setOccurrences(Math.max(1, parseInt(e.target.value) || 1))} disabled={endMode !== "numbered"} inputProps={{ min: 1 }} sx={{ width: 80 }} />
            <Typography variant="body2">{t("occurrences")}</Typography>
          </Box>
        </RadioGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          {describeRecurrence(build(), t)}{unit ? "" : ""}
        </Typography>
      </DialogContent>
      <DialogActions>
        {value && <Button color="error" onClick={() => { onChange(null); onClose(); }} sx={{ mr: "auto" }}>{t("Remove recurrence")}</Button>}
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={() => { onChange(build()); onClose(); }}>{t("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurrenceEditor;
