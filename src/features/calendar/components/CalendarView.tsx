// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, ButtonGroup, CircularProgress, IconButton, Menu, MenuItem, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Add, ChevronLeft, ChevronRight, KeyboardArrowDown, MenuOpen, Today } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Calendar as BigCalendar, dayjsLocalizer, SlotInfo, View, Views } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Recipient } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import CalendarSidebar from "./CalendarSidebar";
import EventPopover from "./EventPopover";
import EventEditor, { EventEditorTarget } from "./EventEditor";
import { eventMoved, loadCalendars, loadEvents, makeSelectCalendarEvents, selectCalendarLoading, setView, updateCalendarPrefs, updateEvent } from "../calendarSlice";
import { applyWeekStart, dateToGraphDate, dayjs, roundToStep, setDayjsLocale, weekNumber } from "../dates";
import { isAllDaySelection } from "../eventUtils";
import { loadCategories } from "../../mail/mailSlice";
import type { CalendarEvent, CalendarViewName } from "../types";
import { pushAlertStack } from "../../../features/alerts/alertsSlice";

const DnDCalendar = withDragAndDrop<CalendarEvent, object>(BigCalendar as any);

const VIEWS: Array<{ value: CalendarViewName; label: string; rbc: View }> = [
  { value: "day", label: "Day", rbc: Views.DAY },
  { value: "work_week", label: "Work week", rbc: Views.WORK_WEEK },
  { value: "week", label: "Week", rbc: Views.WEEK },
  { value: "month", label: "Month", rbc: Views.MONTH },
  { value: "agenda", label: "Agenda", rbc: Views.AGENDA },
];

function rangeFor(view: CalendarViewName, date: Date, weekStartsOn: number): { start: Date; end: Date } {
  const d = dayjs(date);
  switch (view) {
  case "day": return { start: d.startOf("day").toDate(), end: d.endOf("day").toDate() };
  case "month": {
    const start = d.startOf("month");
    const offset = (start.day() - weekStartsOn + 7) % 7;
    const gridStart = start.subtract(offset, "day");
    return { start: gridStart.toDate(), end: gridStart.add(42, "day").toDate() };
  }
  case "agenda": return { start: d.startOf("day").toDate(), end: d.add(30, "day").endOf("day").toDate() };
  default: {
    const offset = (d.day() - weekStartsOn + 7) % 7;
    const start = d.startOf("day").subtract(offset, "day");
    return { start: start.toDate(), end: start.add(7, "day").toDate() };
  }
  }
}

function titleFor(view: CalendarViewName, date: Date, weekStartsOn: number): string {
  const d = dayjs(date);
  if (view === "day") return d.format("dddd, LL");
  if (view === "month") return d.format("MMMM YYYY");
  if (view === "agenda") return `${d.format("LL")} – ${d.add(30, "day").format("LL")}`;
  const { start, end } = rangeFor(view, date, weekStartsOn);
  const s = dayjs(start);
  const e = dayjs(end).subtract(1, "day");
  if (s.isSame(e, "month")) return `${s.format("D")} – ${e.format("D MMMM YYYY")}`;
  return `${s.format("D MMM")} – ${e.format("D MMM YYYY")}`;
}

const CalendarView = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ view?: string; date?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { view: storedView, prefs, calendarsLoaded, visibleCalendarIds, calendars } = useTypeSelector(state => state.calendar);
  const loading = useTypeSelector(selectCalendarLoading);
  const selectEvents = useMemo(() => makeSelectCalendarEvents(theme.palette.primary.main), [theme.palette.primary.main]);
  const events = useTypeSelector(selectEvents);
  const [localeReady, setLocaleReady] = useState("en");
  const [popover, setPopover] = useState<{ event: CalendarEvent; position: { top: number; left: number } } | null>(null);
  const [editor, setEditor] = useState<EventEditorTarget | null>(null);
  const [viewMenu, setViewMenu] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

  const view: CalendarViewName = (VIEWS.find(v => v.value === params.view)?.value) || storedView;
  const date = useMemo(() => {
    const parsed = params.date ? dayjs(params.date) : null;
    return parsed && parsed.isValid() ? parsed.toDate() : new Date();
  }, [params.date]);

  // Rebuild when App changes the dayjs locale
  useEffect(() => {
    setDayjsLocale(i18n.language).then(setLocaleReady);
  }, [i18n.language]);

  const localizer = useMemo(() => {
    dayjs.locale(localeReady);
    // Week start comes from the preference, not the locale
    applyWeekStart(prefs.weekStartsOn);
    const l = dayjsLocalizer(dayjs);
    l.startOfWeek = () => prefs.weekStartsOn;
    // The stock month grid forces Monday in leap years
    l.firstVisibleDay = (d: Date) => dayjs(d).startOf("month").startOf("week").toDate();
    l.lastVisibleDay = (d: Date) => dayjs(d).endOf("month").endOf("week").toDate();
    l.visibleDays = (d: Date) => {
      const days: Date[] = [];
      const last = dayjs(d).endOf("month").endOf("week");
      for (let day = dayjs(d).startOf("month").startOf("week"); !day.isAfter(last); day = day.add(1, "day")) days.push(day.toDate());
      return days;
    };
    return l;
  }, [localeReady, prefs.weekStartsOn]);

  useEffect(() => {
    dispatch(loadCalendars());
    dispatch(loadCategories());
  }, []);

  // "Schedule meeting" from contacts
  useEffect(() => {
    const newEvent = (location.state as { newEvent?: { attendees?: Recipient[] } } | null)?.newEvent;
    if (!newEvent) return;
    const start = roundToStep(dayjs());
    setEditor({ mode: "create", start: start.toDate(), end: start.add(prefs.defaultDuration, "minute").toDate(), attendees: newEvent.attendees || [] });
    navigate(`/calendar/${view}/${dayjs(date).format("YYYY-MM-DD")}`, { replace: true, state: null });
  }, [location.state, navigate, view, date, prefs.defaultDuration]);

  useEffect(() => {
    if (!params.view || !params.date) {
      navigate(`/calendar/${view}/${dayjs(date).format("YYYY-MM-DD")}`, { replace: true });
    } else if (view !== storedView) {
      dispatch(setView(view));
    }
  }, [params.view, params.date, view]);

  const range = useMemo(() => rangeFor(view, date, prefs.weekStartsOn), [view, date, prefs.weekStartsOn]);

  useEffect(() => {
    if (!calendarsLoaded || visibleCalendarIds.length === 0) return;
    dispatch(loadEvents({ start: range.start.toISOString(), end: range.end.toISOString() }));
  }, [calendarsLoaded, visibleCalendarIds.join(","), range.start.getTime(), range.end.getTime()]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && visibleCalendarIds.length) {
        dispatch(loadEvents({ start: range.start.toISOString(), end: range.end.toISOString() }));
      }
    }, 120000);
    return () => clearInterval(timer);
  }, [range.start.getTime(), range.end.getTime(), visibleCalendarIds.join(",")]);

  useGlobalSearch(t("Search events"), q => setSearch(q.toLowerCase()), () => setSearch(""));

  const go = (newView: CalendarViewName, newDate: Date) => navigate(`/calendar/${newView}/${dayjs(newDate).format("YYYY-MM-DD")}`);

  const navigateBy = (delta: number) => {
    const unit = view === "month" ? "month" : view === "day" ? "day" : view === "agenda" ? "month" : "week";
    go(view, dayjs(date).add(delta, unit).toDate());
  };

  const shownEvents = useMemo(() => {
    if (!search) return events;
    return events.filter(e => (e.subject || "").toLowerCase().includes(search) || (e.location?.displayName || "").toLowerCase().includes(search) || (e.bodyPreview || "").toLowerCase().includes(search));
  }, [events, search]);

  const handleSelectSlot = (slot: SlotInfo) => {
    setPopover(null);
    // All-day row or multi-day month selection, end is exclusive
    if (isAllDaySelection(view, slot)) {
      setEditor({ mode: "create", start: slot.start, end: slot.end, allDay: true });
      return;
    }
    if (view === "month") {
      // Single day: next full hour
      const start = dayjs(slot.start).hour(Math.min(dayjs().hour() + 1, 23)).minute(0).second(0).millisecond(0);
      setEditor({ mode: "create", start: start.toDate(), end: start.add(prefs.defaultDuration, "minute").toDate() });
      return;
    }
    setEditor({ mode: "create", start: slot.start, end: slot.end });
  };

  const handleSelectEvent = (event: CalendarEvent, e: React.SyntheticEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ event, position: { top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 380) } });
  };

  const moveOrResize = useCallback(async ({ event, start, end, isAllDay }: EventInteractionArgs<CalendarEvent>) => {
    if (event.isOrganizer === false) {
      dispatch(pushAlertStack({ message: t("Only the organizer can move this event"), severity: "warning" }));
      return;
    }
    // isAllDay is only set for the all-day row, undefined means a timed drop
    const allDay = isAllDay ?? (view === "month" ? Boolean(event.isAllDay) : false);
    const s = dayjs(start);
    let e = dayjs(end);
    if (allDay && e.isSame(s, "day")) e = s.add(1, "day").startOf("day");
    if (!allDay && event.isAllDay) e = s.add(prefs.defaultDuration, "minute");
    const startGraph = dateToGraphDate(s, allDay);
    const endGraph = dateToGraphDate(e, allDay);
    dispatch(eventMoved({ id: event.id!, start: startGraph, end: endGraph, isAllDay: allDay }));
    const result = await dispatch(updateEvent({ event: { id: event.id!, start: startGraph, end: endGraph, isAllDay: allDay }, silent: true }));
    if (updateEvent.rejected.match(result)) {
      dispatch(loadEvents({ start: range.start.toISOString(), end: range.end.toISOString() }));
    }
  }, [range, dispatch, view, prefs.defaultDuration, t]);

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const classes: string[] = [];
    if (event.sensitivity === "private") classes.push("gn-event-private");
    if (event.showAs === "tentative" || event.responseStatus?.response === "tentativelyAccepted") classes.push("gn-event-tentative");
    if (event.responseStatus?.response === "declined") classes.push("gn-event-declined");
    if (event.isCancelled) classes.push("gn-event-cancelled");
    return {
      className: classes.join(" "),
      style: { backgroundColor: event.color, color: theme.palette.getContrastText(event.color), borderLeftColor: "rgba(0,0,0,0.25)" },
    };
  }, [theme]);

  const slotPropGetter = useCallback((slotDate: Date) => {
    const d = dayjs(slotDate);
    const working = prefs.workDays.includes(d.day()) && d.hour() >= prefs.workDayStart && d.hour() < prefs.workDayEnd;
    return { className: working ? undefined : "gn-nonworking" };
  }, [prefs.workDays, prefs.workDayStart, prefs.workDayEnd]);

  useKeyboardShortcuts([
    { key: "n", handler: () => setEditor({ mode: "create", start: roundToStep(dayjs()).toDate(), end: roundToStep(dayjs()).add(prefs.defaultDuration, "minute").toDate() }) },
    { key: "t", handler: () => go(view, new Date()) },
    { key: "ArrowLeft", handler: () => navigateBy(-1) },
    { key: "ArrowRight", handler: () => navigateBy(1) },
    { key: "1", handler: () => go("day", date) },
    { key: "2", handler: () => go("work_week", date) },
    { key: "3", handler: () => go("week", date) },
    { key: "4", handler: () => go("month", date) },
    { key: "5", handler: () => go("agenda", date) },
  ], !editor);

  const dark = theme.palette.mode === "dark";
  const cssVars = {
    "--gn-divider": theme.palette.divider,
    "--gn-text": theme.palette.text.primary,
    "--gn-text-secondary": theme.palette.text.secondary,
    "--gn-primary": theme.palette.primary.main,
    "--gn-today": dark ? "rgba(79,120,199,0.14)" : "rgba(29,75,153,0.07)",
    "--gn-offrange": dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
    "--gn-nonworking": dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
    "--gn-selection": dark ? "rgba(79,120,199,0.4)" : "rgba(29,75,153,0.2)",
  } as React.CSSProperties;

  // Week number in the first cell of each month row
  const monthComponents = useMemo(() => !prefs.showWeekNumbers ? {} : {
    month: {
      dateHeader: ({ date: d, label }: { date: Date; label: string }) => (
        <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 0.5 }}>
          {dayjs(d).day() === prefs.weekStartsOn
            ? <Box component="span" sx={{ color: "text.secondary", fontSize: 10 }} aria-label={t("Week {{n}}", { n: weekNumber(d, prefs.weekStartsOn) })}>{weekNumber(d, prefs.weekStartsOn)}</Box>
            : <span />}
          <span>{label}</span>
        </Box>
      ),
    },
  }, [prefs.showWeekNumbers, prefs.weekStartsOn, t]);

  const currentView = VIEWS.find(v => v.value === view)!;
  const messages = useMemo(() => ({
    today: t("Today"), previous: t("Back"), next: t("Next"), month: t("Month"), week: t("Week"), work_week: t("Work week"), day: t("Day"), agenda: t("Agenda"),
    date: t("Date"), time: t("Time"), event: t("Event"), allDay: t("All day"), noEventsInRange: t("There are no events in this range."),
    showMore: (count: number) => t("+{{count}} more", { count }),
  }), [t]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box role="toolbar" aria-label={t("Calendar actions")} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, minHeight: 48, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", flexWrap: "wrap" }}>
        {!isMobile && (
          <Tooltip title={t("Toggle sidebar")}>
            <IconButton size="small" onClick={() => dispatch(updateCalendarPrefs({ sidebarVisible: !prefs.sidebarVisible }))} aria-label={t("Toggle sidebar")}><MenuOpen /></IconButton>
          </Tooltip>
        )}
        <Button variant="contained" startIcon={<Add />} onClick={() => setEditor({ mode: "create", start: roundToStep(dayjs()).toDate(), end: roundToStep(dayjs()).add(prefs.defaultDuration, "minute").toDate() })} sx={{ whiteSpace: "nowrap" }}>
          {t("New event")}
        </Button>
        <Button size="small" color="inherit" startIcon={<Today />} onClick={() => go(view, new Date())}>{t("Today")}</Button>
        <ButtonGroup size="small" variant="text" color="inherit">
          <IconButton size="small" onClick={() => navigateBy(-1)} aria-label={t("Back")}><ChevronLeft /></IconButton>
          <IconButton size="small" onClick={() => navigateBy(1)} aria-label={t("Next")}><ChevronRight /></IconButton>
        </ButtonGroup>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16, mx: 1, whiteSpace: "nowrap" }}>{titleFor(view, date, prefs.weekStartsOn)}</Typography>
        {prefs.showWeekNumbers && view !== "month" && view !== "agenda" && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {t("Week {{n}}", { n: weekNumber(date, prefs.weekStartsOn) })}
          </Typography>
        )}
        {loading && <CircularProgress size={16} />}
        <Box sx={{ flex: 1 }} />
        {isMobile ? (
          <>
            <Button size="small" color="inherit" endIcon={<KeyboardArrowDown />} onClick={e => setViewMenu(e.currentTarget)}>{t(currentView.label)}</Button>
            <Menu anchorEl={viewMenu} open={Boolean(viewMenu)} onClose={() => setViewMenu(null)}>
              {VIEWS.map(v => <MenuItem key={v.value} selected={v.value === view} onClick={() => { go(v.value, date); setViewMenu(null); }}>{t(v.label)}</MenuItem>)}
            </Menu>
          </>
        ) : (
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_e, v: CalendarViewName | null) => v && go(v, date)} aria-label={t("View")}>
            {VIEWS.map(v => <ToggleButton key={v.value} value={v.value} sx={{ px: 1.5, textTransform: "none" }}>{t(v.label)}</ToggleButton>)}
          </ToggleButtonGroup>
        )}
      </Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {prefs.sidebarVisible && !isMobile && (
          <Box sx={{ width: 264, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <CalendarSidebar date={date} onDateChange={d => go(view === "month" ? "day" : view, d)} events={events} />
          </Box>
        )}
        <Box className="gn-calendar" sx={{ flex: 1, minWidth: 0, p: 1.5, bgcolor: "background.default" }} style={cssVars}>
          <DnDCalendar
            localizer={localizer}
            culture={localeReady}
            events={shownEvents}
            date={date}
            view={currentView.rbc}
            views={[Views.DAY, Views.WORK_WEEK, Views.WEEK, Views.MONTH, Views.AGENDA]}
            onNavigate={d => go(view, d)}
            onView={v => { const found = VIEWS.find(x => x.rbc === v); if (found) go(found.value, date); }}
            startAccessor="start_"
            endAccessor="end_"
            titleAccessor={e => e.subject || t("(No title)")}
            allDayAccessor={e => Boolean(e.isAllDay)}
            tooltipAccessor={e => `${e.subject || ""}${e.location?.displayName ? ` · ${e.location.displayName}` : ""}`}
            selectable
            resizable
            popup
            step={prefs.timeStep}
            timeslots={60 / prefs.timeStep}
            scrollToTime={dayjs().hour(Math.max(prefs.workDayStart - 1, 0)).minute(0).toDate()}
            showMultiDayTimes
            length={30}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onDoubleClickEvent={event => !event.readOnly && setEditor({ mode: "edit", event, scope: "occurrence" })}
            onEventDrop={moveOrResize}
            onEventResize={moveOrResize}
            draggableAccessor={e => e.isOrganizer !== false && !e.readOnly}
            resizableAccessor={e => e.isOrganizer !== false && !e.readOnly}
            eventPropGetter={eventPropGetter}
            slotPropGetter={slotPropGetter}
            messages={messages}
            components={monthComponents}
            formats={{
              timeGutterFormat: (d: Date) => dayjs(d).format("LT"),
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => `${dayjs(start).format("LT")} – ${dayjs(end).format("LT")}`,
              dayFormat: (d: Date) => dayjs(d).format("ddd D"),
              dayHeaderFormat: (d: Date) => dayjs(d).format("dddd, LL"),
              agendaDateFormat: (d: Date) => dayjs(d).format("ddd, LL"),
              agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => `${dayjs(start).format("LT")} – ${dayjs(end).format("LT")}`,
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => `${dayjs(start).format("LL")} – ${dayjs(end).format("LL")}`,
            }}
          />
        </Box>
      </Box>
      {popover && (
        <EventPopover
          event={popover.event}
          anchorPosition={popover.position}
          onClose={() => setPopover(null)}
          onEdit={scope => { setEditor({ mode: "edit", event: popover.event, scope }); setPopover(null); }}
        />
      )}
      {editor && <EventEditor target={editor} onClose={() => setEditor(null)} />}
      {calendarsLoaded && calendars.length === 0 && (
        <Typography sx={{ p: 2 }} color="text.secondary">{t("No calendars found")}</Typography>
      )}
    </Box>
  );
};

export default CalendarView;
