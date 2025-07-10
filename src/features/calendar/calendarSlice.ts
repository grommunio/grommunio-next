// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Attachment, Calendar, Event } from "microsoft-graph";
import type { RootState } from "../../store";
import * as api from "../../api/calendar";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../actions/alerts";
import { CalendarEvent, CalendarPrefs, CalendarState, CalendarViewName } from "./types";
import { loadCalendarPrefs, loadView, loadVisibleCalendars, saveCalendarPrefs, saveView, saveVisibleCalendars } from "./prefs";
import { browserTimeZone, graphDateToDate } from "./dates";
import { EventReponseType } from "../../types/calendar";

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);

type ThunkApi = { state: RootState; rejectValue: string };

// Outlook's hex values for the Graph color enum
// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Light blue")
// t("Light green")
// t("Light orange")
// t("Light gray")
// t("Light yellow")
// t("Light teal")
// t("Light pink")
// t("Light brown")
// t("Light red")
export const CALENDAR_COLORS: Array<{ name: string; hex: string; label: string }> = [
  { name: "lightBlue", hex: "#a3c8f1", label: "Light blue" },
  { name: "lightGreen", hex: "#9bd38e", label: "Light green" },
  { name: "lightOrange", hex: "#f7b26f", label: "Light orange" },
  { name: "lightGray", hex: "#c3c3c3", label: "Light gray" },
  { name: "lightYellow", hex: "#f2e07a", label: "Light yellow" },
  { name: "lightTeal", hex: "#7fd0cc", label: "Light teal" },
  { name: "lightPink", hex: "#f4a9c7", label: "Light pink" },
  { name: "lightBrown", hex: "#c9a27a", label: "Light brown" },
  { name: "lightRed", hex: "#f09896", label: "Light red" },
];

export function calendarColor(calendar: Calendar | undefined, fallback: string): string {
  if (!calendar) return fallback;
  if (calendar.hexColor && /^#[0-9a-f]{6}$/i.test(calendar.hexColor)) return calendar.hexColor;
  const preset = CALENDAR_COLORS.find(c => c.name === calendar.color);
  return preset?.hex || fallback;
}

export const loadCalendars = createAsyncThunk<Calendar[], void, ThunkApi>(
  "calendar/loadCalendars",
  async (_arg, { rejectWithValue }) => {
    try {
      return await api.getUserCalendars();
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const createCalendar = createAsyncThunk<Calendar, { name: string; color?: string }, ThunkApi>(
  "calendar/createCalendar",
  async (arg, { dispatch, rejectWithValue }) => {
    try {
      return await api.createUserCalendar({ name: arg.name, color: (arg.color || "auto") as Calendar["color"] });
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const updateCalendar = createAsyncThunk<Calendar, { id: string; name?: string; color?: string }, ThunkApi>(
  "calendar/updateCalendar",
  async ({ id, ...props }, { dispatch, rejectWithValue }) => {
    try {
      return await api.patchUserCalendar(id, props as Partial<Calendar>);
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteCalendar = createAsyncThunk<string, string, ThunkApi>(
  "calendar/deleteCalendar",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.deleteUserCalendar(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

type LoadEventsArg = { start: string; end: string; calendarIds?: string[]; force?: boolean };

export const loadEvents = createAsyncThunk<{ start: string; end: string; byCalendar: Record<string, Event[]> }, LoadEventsArg, ThunkApi>(
  "calendar/loadEvents",
  async ({ start, end, calendarIds }, { getState, rejectWithValue }) => {
    const state = getState().calendar;
    const ids = calendarIds || state.visibleCalendarIds;
    try {
      const results = await Promise.all(ids.map(async id => [id, await api.getCalendarView(id, start, end, browserTimeZone())] as const));
      const byCalendar: Record<string, Event[]> = {};
      results.forEach(([id, events]) => { byCalendar[id] = events; });
      return { start, end, byCalendar };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const loadEventDetails = createAsyncThunk<Event, string, ThunkApi>(
  "calendar/loadEventDetails",
  async (id, { rejectWithValue }) => {
    try {
      return await api.getEvent(id, browserTimeZone());
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const createEvent = createAsyncThunk<Event, { event: Event; calendarId?: string; files?: File[] }, ThunkApi>(
  "calendar/createEvent",
  async ({ event, calendarId, files }, { dispatch, rejectWithValue }) => {
    try {
      const created = await api.postEvent(event, calendarId);
      for (const file of files || []) {
        await api.addEventFileAttachment(created.id!, file);
      }
      dispatch(pushAlertStack({ message: event.attendees?.length ? "Invitation sent" : "Event saved", severity: "success" }));
      return created;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const updateEvent = createAsyncThunk<Event, { event: Event; files?: File[]; silent?: boolean }, ThunkApi>(
  "calendar/updateEvent",
  async ({ event, files, silent }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await api.patchEvent(event);
      for (const file of files || []) {
        await api.addEventFileAttachment(updated.id!, file);
      }
      if (!silent) dispatch(pushAlertStack({ message: "Event saved", severity: "success" }));
      return updated;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteEvent = createAsyncThunk<string, { id: string; comment?: string; notify?: boolean }, ThunkApi>(
  "calendar/deleteEvent",
  async ({ id, comment, notify }, { dispatch, rejectWithValue }) => {
    try {
      if (notify) await api.cancelEvent(id, comment);
      else await api.deleteEvent(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const respondToEvent = createAsyncThunk<{ id: string; response: EventReponseType }, { id: string; response: EventReponseType; comment?: string; sendResponse?: boolean }, ThunkApi>(
  "calendar/respondToEvent",
  async ({ id, response, comment, sendResponse }, { dispatch, rejectWithValue }) => {
    try {
      await api.respondToEvent(id, response, { comment, sendResponse });
      dispatch(pushAlertStack({ message: "Response sent", severity: "success" }));
      return { id, response };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const loadEventAttachments = createAsyncThunk<{ id: string; attachments: Attachment[] }, string, ThunkApi>(
  "calendar/loadEventAttachments",
  async (id, { rejectWithValue }) => {
    try {
      return { id, attachments: await api.eventAttachments({ id }) };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

const initialState: CalendarState = {
  calendars: [],
  calendarsLoaded: false,
  calendarsLoading: false,
  visibleCalendarIds: loadVisibleCalendars() || [],
  events: {},
  loading: {},
  details: {},
  view: loadView(),
  prefs: loadCalendarPrefs(),
};

const RESPONSE_MAP: Record<EventReponseType, string> = {
  [EventReponseType.accept]: "accepted",
  [EventReponseType.tentatively]: "tentativelyAccepted",
  [EventReponseType.decline]: "declined",
};

function replaceEvent(state: CalendarState, event: Event) {
  Object.keys(state.events).forEach(calendarId => {
    state.events[calendarId] = state.events[calendarId].map(e => e.id === event.id ? { ...e, ...event } : e);
  });
  if (state.details[event.id!]) state.details[event.id!] = { ...state.details[event.id!], ...event };
}

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setView(state, action: PayloadAction<CalendarViewName>) {
      state.view = action.payload;
      saveView(action.payload);
    },
    toggleCalendarVisible(state, action: PayloadAction<string>) {
      const idx = state.visibleCalendarIds.indexOf(action.payload);
      if (idx === -1) state.visibleCalendarIds.push(action.payload);
      else {
        state.visibleCalendarIds.splice(idx, 1);
        delete state.events[action.payload];
      }
      saveVisibleCalendars(state.visibleCalendarIds);
    },
    updateCalendarPrefs(state, action: PayloadAction<Partial<CalendarPrefs>>) {
      state.prefs = { ...state.prefs, ...action.payload };
      saveCalendarPrefs(state.prefs);
    },
    // Optimistic move/resize while the request runs
    eventMoved(state, action: PayloadAction<{ id: string; start: Event["start"]; end: Event["end"]; isAllDay?: boolean }>) {
      const { id, start, end, isAllDay } = action.payload;
      Object.keys(state.events).forEach(calendarId => {
        state.events[calendarId] = state.events[calendarId].map(e => e.id === id ? { ...e, start, end, ...(isAllDay !== undefined ? { isAllDay } : {}) } : e);
      });
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadCalendars.pending, state => { state.calendarsLoading = true; })
      .addCase(loadCalendars.fulfilled, (state, action) => {
        state.calendars = action.payload;
        state.calendarsLoaded = true;
        state.calendarsLoading = false;
        const ids = action.payload.map(c => c.id!);
        // First run shows the default calendar, later runs drop deleted ones
        if (loadVisibleCalendars() === null) {
          const def = action.payload.find(c => c.isDefaultCalendar) || action.payload[0];
          state.visibleCalendarIds = def?.id ? [def.id] : [];
        } else {
          state.visibleCalendarIds = state.visibleCalendarIds.filter(id => ids.includes(id));
          if (state.visibleCalendarIds.length === 0 && ids.length) state.visibleCalendarIds = [ids[0]];
        }
        saveVisibleCalendars(state.visibleCalendarIds);
      })
      .addCase(loadCalendars.rejected, (state, action) => {
        state.calendarsLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createCalendar.fulfilled, (state, action) => {
        state.calendars.push(action.payload);
        if (action.payload.id) {
          state.visibleCalendarIds.push(action.payload.id);
          saveVisibleCalendars(state.visibleCalendarIds);
        }
      })
      .addCase(updateCalendar.fulfilled, (state, action) => {
        state.calendars = state.calendars.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c);
      })
      .addCase(deleteCalendar.fulfilled, (state, action) => {
        state.calendars = state.calendars.filter(c => c.id !== action.payload);
        state.visibleCalendarIds = state.visibleCalendarIds.filter(id => id !== action.payload);
        delete state.events[action.payload];
        saveVisibleCalendars(state.visibleCalendarIds);
      })
      .addCase(loadEvents.pending, (state, action) => {
        (action.meta.arg.calendarIds || state.visibleCalendarIds).forEach(id => { state.loading[id] = true; });
      })
      .addCase(loadEvents.fulfilled, (state, action) => {
        const { start, end, byCalendar } = action.payload;
        if (!state.range || state.range.start !== start || state.range.end !== end) {
          // New range, drop the old events
          state.events = {};
        }
        state.range = { start, end };
        Object.entries(byCalendar).forEach(([id, events]) => {
          state.events[id] = events;
          delete state.loading[id];
        });
        state.error = undefined;
      })
      .addCase(loadEvents.rejected, (state, action) => {
        state.loading = {};
        state.error = action.payload || action.error.message;
      })
      .addCase(loadEventDetails.fulfilled, (state, action) => {
        if (action.payload.id) state.details[action.payload.id] = action.payload;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        const calendarId = action.meta.arg.calendarId || state.calendars.find(c => c.isDefaultCalendar)?.id || state.visibleCalendarIds[0];
        if (calendarId && state.events[calendarId] && !action.payload.recurrence) {
          state.events[calendarId].push(action.payload);
        }
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        replaceEvent(state, action.payload);
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        Object.keys(state.events).forEach(calendarId => {
          state.events[calendarId] = state.events[calendarId].filter(e => e.id !== action.payload && e.seriesMasterId !== action.payload);
        });
        delete state.details[action.payload];
      })
      .addCase(respondToEvent.fulfilled, (state, action) => {
        const response = RESPONSE_MAP[action.payload.response];
        replaceEvent(state, { id: action.payload.id, responseStatus: { response: response as any, time: new Date().toISOString() } });
      });
  },
});

export const { setView, toggleCalendarVisible, updateCalendarPrefs, eventMoved } = calendarSlice.actions;
export default calendarSlice.reducer;

export const selectCalendars = (state: RootState) => state.calendar.calendars;
export const selectVisibleCalendarIds = (state: RootState) => state.calendar.visibleCalendarIds;
export const selectCalendarEventsRaw = (state: RootState) => state.calendar.events;

export const makeSelectCalendarEvents = (fallbackColor: string) => createSelector(
  [selectCalendars, selectCalendarEventsRaw, selectVisibleCalendarIds],
  (calendars, events, visible): CalendarEvent[] => {
    const result: CalendarEvent[] = [];
    visible.forEach(calendarId => {
      const calendar = calendars.find(c => c.id === calendarId);
      const color = calendarColor(calendar, fallbackColor);
      (events[calendarId] || []).forEach(event => {
        if (event.isCancelled) return;
        result.push({ ...event, calendarId, color, start_: graphDateToDate(event.start), end_: graphDateToDate(event.end) });
      });
    });
    return result;
  },
);

export const selectCalendarLoading = (state: RootState) => Object.keys(state.calendar.loading).length > 0;
