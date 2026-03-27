// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, Collapse, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { Add, DeleteOutline, DriveFileRenameOutline, ExpandMore, ChevronRight, MoreHoriz, Palette, Share } from "@mui/icons-material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { useTheme } from "@mui/material/styles";
import { KeyboardEvent, MouseEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Calendar } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { CALENDAR_COLORS, calendarColor, createCalendar, deleteCalendar, toggleCalendarVisible, updateCalendar } from "../calendarSlice";
import { dayjs, Dayjs } from "../dates";
import type { CalendarEvent } from "../types";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ShareCalendarDialog from "./ShareCalendarDialog";

type CalendarSidebarProps = {
  date: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
};

function DayWithEvents(props: PickersDayProps<Dayjs> & { eventDays?: Set<string> }) {
  const { eventDays, day, outsideCurrentMonth, ...other } = props;
  const hasEvents = !outsideCurrentMonth && eventDays?.has(day.format("YYYY-MM-DD"));
  return (
    <Box sx={{ position: "relative" }}>
      <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
      {hasEvents && <Box sx={{ position: "absolute", bottom: 3, left: "50%", width: 4, height: 4, ml: "-2px", borderRadius: "50%", bgcolor: other.selected ? "primary.contrastText" : "primary.main" }} />}
    </Box>
  );
}

const CalendarSidebar = ({ date, onDateChange, events }: CalendarSidebarProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const { calendars, visibleCalendarIds } = useTypeSelector(state => state.calendar);
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; calendar: Calendar } | null>(null);
  const [colorMenu, setColorMenu] = useState<{ anchor: HTMLElement; calendar: Calendar } | null>(null);
  const [editing, setEditing] = useState<{ id?: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Calendar | null>(null);
  const [sharing, setSharing] = useState<Calendar | null>(null);

  const eventDays = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      let d = dayjs(e.start_).startOf("day");
      const end = dayjs(e.end_).subtract(1, "minute");
      while (d.isBefore(end) || d.isSame(end, "day")) {
        set.add(d.format("YYYY-MM-DD"));
        d = d.add(1, "day");
      }
    });
    return set;
  }, [events]);

  const commitEdit = () => {
    if (!editing) return;
    const name = editing.value.trim();
    if (name) {
      if (editing.id) dispatch(updateCalendar({ id: editing.id, name }));
      else dispatch(createCalendar({ name }));
    }
    setEditing(null);
  };

  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(null);
  };

  const openMenu = (calendar: Calendar) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenu({ anchor: e.currentTarget, calendar });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
        <DateCalendar
          value={dayjs(date)}
          onChange={value => value && onDateChange(value.toDate())}
          showDaysOutsideCurrentMonth
          slots={{ day: DayWithEvents as any }}
          slotProps={{ day: { eventDays } as any }}
          sx={{ width: "100%", maxHeight: 300, "& .MuiPickersDay-root": { fontSize: 12 }, "& .MuiDayCalendar-weekDayLabel": { fontSize: 11 } }}
        />
      </LocalizationProvider>
      <Divider />
      <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5 }}>
        <IconButton size="small" onClick={() => setOpen(!open)} aria-label={open ? t("Collapse") : t("Expand")}>
          {open ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>{t("My calendars")}</Typography>
        <Tooltip title={t("Add calendar")}>
          <IconButton size="small" onClick={() => setEditing({ value: "" })} aria-label={t("Add calendar")}><Add fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Collapse in={open}>
        {calendars.map(calendar => {
          const color = calendarColor(calendar, theme.palette.primary.main);
          const visible = visibleCalendarIds.includes(calendar.id!);
          const isEditing = editing?.id === calendar.id;
          return (
            <Box
              key={calendar.id}
              onClick={() => !isEditing && dispatch(toggleCalendarVisible(calendar.id!))}
              sx={{ display: "flex", alignItems: "center", pl: 1, pr: 0.5, height: 34, mx: 1, borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, "&:hover .cal-more, &:focus-within .cal-more": { opacity: 1 } }}
            >
              <Checkbox
                size="small"
                checked={visible}
                onChange={() => dispatch(toggleCalendarVisible(calendar.id!))}
                onClick={e => e.stopPropagation()}
                sx={{ p: 0.5, color, "&.Mui-checked": { color } }}
                inputProps={{ "aria-label": calendar.name || "" }}
              />
              {isEditing ? (
                <InputBase autoFocus value={editing?.value || ""} onChange={e => setEditing({ id: calendar.id!, value: e.target.value })} onKeyDown={onEditKey} onBlur={commitEdit} onClick={e => e.stopPropagation()} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} />
              ) : (
                <Typography variant="body2" noWrap sx={{ flex: 1, ml: 0.5 }}>{calendar.name}</Typography>
              )}
              <IconButton className="cal-more" size="small" onClick={openMenu(calendar)} sx={{ opacity: 0 }} aria-label={t("Calendar options")}>
                <MoreHoriz fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
        {editing && !editing.id && (
          <Box sx={{ display: "flex", alignItems: "center", pl: 1, pr: 0.5, height: 34, mx: 1 }}>
            <Box sx={{ width: 28 }} />
            <InputBase autoFocus placeholder={t("Calendar name")} value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.value })} onKeyDown={onEditKey} onBlur={commitEdit} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} />
          </Box>
        )}
      </Collapse>
      <Box sx={{ flex: 1 }} />
      <Divider />
      <Button startIcon={<Add />} onClick={() => setEditing({ value: "" })} sx={{ m: 1, justifyContent: "flex-start", color: "text.secondary" }}>{t("Add calendar")}</Button>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setEditing({ id: menu!.calendar.id!, value: menu!.calendar.name || "" }); setMenu(null); }} disabled={menu?.calendar.isDefaultCalendar || menu?.calendar.canEdit === false}>
          <ListItemIcon><DriveFileRenameOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Rename")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={e => { setColorMenu({ anchor: e.currentTarget, calendar: menu!.calendar }); setMenu(null); }}>
          <ListItemIcon><Palette fontSize="small" /></ListItemIcon><ListItemText>{t("Color")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setSharing(menu!.calendar); setMenu(null); }} disabled={menu?.calendar.canShare === false}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon><ListItemText>{t("Sharing and permissions")}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setConfirmDelete(menu!.calendar); setMenu(null); }} disabled={menu?.calendar.isDefaultCalendar || menu?.calendar.isRemovable === false}>
          <ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Delete")}</ListItemText>
        </MenuItem>
      </Menu>
      <Menu anchorEl={colorMenu?.anchor} open={Boolean(colorMenu)} onClose={() => setColorMenu(null)}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, p: 1.5 }}>
          {CALENDAR_COLORS.map(c => (
            <Tooltip key={c.name} title={t(c.label)}>
              <Box component="button" type="button" aria-label={t(c.label)} onClick={() => { dispatch(updateCalendar({ id: colorMenu!.calendar.id!, color: c.name })); setColorMenu(null); }}
                sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: c.hex, border: "2px solid", borderColor: colorMenu?.calendar.color === c.name ? "text.primary" : "transparent", cursor: "pointer", p: 0 }} />
            </Tooltip>
          ))}
        </Box>
      </Menu>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={t("Delete calendar")}
        description={t("The calendar \"{{name}}\" and all its events will be deleted.", { name: confirmDelete?.name })}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={() => confirmDelete && dispatch(deleteCalendar(confirmDelete.id!))}
        onClose={() => setConfirmDelete(null)}
      />
      {sharing && <ShareCalendarDialog calendar={sharing} onClose={() => setSharing(null)} />}
    </Box>
  );
};

export default CalendarSidebar;
