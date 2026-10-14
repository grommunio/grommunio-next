// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Attachment, Calendar, Event } from "microsoft-graph";
import type { RootState } from "../../store";
import * as api from "../../api/calendar";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../features/alerts/alertsSlice";
import { CalendarEvent, CalendarPrefs, CalendarState, CalendarViewName } from "./types";
import { isSharedCalendarId, loadSharedCalendars, saveSharedCalendars, sharedCalendarId, SharedCalendarRef, loadCalendarPrefs, loadView, loadVisibleCalendars, saveCalendarPrefs, saveView, saveVisibleCalendars } from "./prefs";
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

export const loadEvents = createAsyncThunk<{ start: string; end: string; byCalendar: Record<string, Event[]>; errors: Record<string, string> }, LoadEventsArg, ThunkApi>(
  "calendar/loadEvents",
  async ({ start, end, calendarIds }, { getState, rejectWithValue }) => {
    const state = getState().calendar;
    const ids = calendarIds || state.visibleCalendarIds;
    try {
      const errors: Record<string, string> = {};
      const results = await Promise.all(ids.map(async id => {
        if (!isSharedCalendarId(id)) return [id, await api.getCalendarView(id, start, end, browserTimeZone())] as const;
        // A shared calendar without permission must not break the others
        const ref = state.shared.find(r => sharedCalendarId(r.address) === id);
        try {
          return [id, ref ? await api.getSharedCalendarView(ref.address, start, end, browserTimeZone()) : []] as const;
        } catch (err) {
          errors[id] = errorMessage(err);
          return [id, [] as Event[]] as const;
        }
      }));
      const byCalendar: Record<string, Event[]> = {};
      results.forEach(([id, events]) => { byCalendar[id] = events; });
      return { start, end, byCalendar, errors };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const ALREADY_OPEN = "This calendar is already open";

export const addSharedCalendar = createAsyncThunk<SharedCalendarRef, { address: string; name?: string }, ThunkApi>(
  "calendar/addSharedCalendar",
  async ({ address, name }, { dispatch, getState, rejectWithValue }) => {
    const normalized = address.trim().toLowerCase();
    if (getState().calendar.shared.some(r => r.address === normalized)) return rejectWithValue(ALREADY_OPEN);
    try {
      await api.getSharedCalendar(normalized);
      return { address: normalized, name: name || normalized };
    } catch (err) {
      dispatch(pushAlertStack({ message: "The calendar of {{name}} could not be opened. It may not be shared with you.", params: { name: name || normalized }, severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);
// t("This calendar is already open")
// t("The calendar of {{name}} could not be opened. It may not be shared with you.")

// For series changes, only the server can expand the occurrences
export const refreshEvents = createAsyncThunk<void, void, ThunkApi>(
  "calendar/refreshEvents",
  async (_arg, { dispatch, getState }) => {
    const range = getState().calendar.requestedRange || getState().calendar.range;
    if (range) await dispatch(loadEvents({ start: range.start, end: range.end }));
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

export type AttachmentFailure = { index: number; name: string; error: string };
export type SavedEvent = { event: Event; failed: AttachmentFailure[] };

// One failed upload doesn't stop the others
async function uploadFiles(eventId: string, files: File[] = []): Promise<AttachmentFailure[]> {
  const failed: AttachmentFailure[] = [];
  for (const [index, file] of files.entries()) {
    try {
      await api.addEventFileAttachment(eventId, file);
    } catch (err) {
      failed.push({ index, name: file.name, error: errorMessage(err) });
    }
  }
  return failed;
}

const attachmentWarning = (failed: AttachmentFailure[]) => pushAlertStack({
  message: "The event was saved, but these attachments could not be added: {{files}}",
  params: { files: failed.map(f => f.name).join(", ") },
  severity: "warning",
});
// t("The event was saved, but these attachments could not be added: {{files}}")
// t("The file is too large")

// Don't reject on attachment failures, the event exists and a retry must PATCH it
export const createEvent = createAsyncThunk<SavedEvent, { event: Event; calendarId?: string; files?: File[] }, ThunkApi>(
  "calendar/createEvent",
  async ({ event, calendarId, files }, { dispatch, rejectWithValue }) => {
    let created: Event;
    try {
      created = await api.postEvent(event, calendarId, browserTimeZone());
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
    const failed = await uploadFiles(created.id!, files);
    if (failed.length) dispatch(attachmentWarning(failed));
    else dispatch(pushAlertStack({ message: event.attendees?.length ? "Invitation sent" : "Event saved", severity: "success" }));
    return { event: created, failed };
  },
);

// Id only: skip the PATCH, just upload
export const updateEvent = createAsyncThunk<SavedEvent, { event: Event; files?: File[]; silent?: boolean }, ThunkApi>(
  "calendar/updateEvent",
  async ({ event, files, silent }, { dispatch, rejectWithValue }) => {
    let updated: Event;
    try {
      const { id, ...props } = event;
      updated = Object.keys(props).length ? await api.patchEvent(event, browserTimeZone()) : { id };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
    const failed = await uploadFiles(event.id!, files);
    if (failed.length) dispatch(attachmentWarning(failed));
    else if (!silent) dispatch(pushAlertStack({ message: "Event saved", severity: "success" }));
    return { event: updated, failed };
  },
);

// cancel notifies attendees, decline answers the organizer, delete is silent
export type DeleteMode = "cancel" | "decline" | "delete";

export const deleteEvent = createAsyncThunk<string, { id: string; comment?: string; mode?: DeleteMode }, ThunkApi>(
  "calendar/deleteEvent",
  async ({ id, comment, mode = "delete" }, { dispatch, rejectWithValue }) => {
    try {
      if (mode === "cancel") await api.cancelEvent(id, comment);
      else if (mode === "decline") {
        await api.respondToEvent(id, EventReponseType.decline, { comment, sendResponse: true });
        // The server usually removes declined meetings already
        await api.deleteEvent(id).catch(() => undefined);
      } else await api.deleteEvent(id);
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
      dispatch(pushAlertStack({ message: sendResponse === false ? "Response saved" : "Response sent", severity: "success" }));
      // t("Response saved")
      // Declined meetings are removed from the calendar by the server
      if (response === EventReponseType.decline) dispatch(refreshEvents());
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
  shared: loadSharedCalendars(),
  calendarErrors: {},
};

// Fake entries for shared calendars so sidebar and colors treat them alike
function sharedCalendarEntries(refs: SharedCalendarRef[]): Calendar[] {
  return refs.map(ref => ({
    id: sharedCalendarId(ref.address),
    name: ref.name,
    hexColor: ref.color,
    owner: { address: ref.address, name: ref.name },
    canEdit: false,
    canShare: false,
    isRemovable: true,
  }));
}

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
    removeSharedCalendar(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.shared = state.shared.filter(r => sharedCalendarId(r.address) !== id);
      saveSharedCalendars(state.shared);
      state.calendars = state.calendars.filter(c => c.id !== id);
      state.visibleCalendarIds = state.visibleCalendarIds.filter(v => v !== id);
      saveVisibleCalendars(state.visibleCalendarIds);
      delete state.events[id];
      delete state.calendarErrors[id];
    },
    setSharedCalendarColor(state, action: PayloadAction<{ id: string; color: string }>) {
      state.shared = state.shared.map(r => sharedCalendarId(r.address) === action.payload.id ? { ...r, color: action.payload.color } : r);
      saveSharedCalendars(state.shared);
      state.calendars = state.calendars.map(c => c.id === action.payload.id ? { ...c, hexColor: action.payload.color } : c);
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
        state.calendars = [...action.payload, ...sharedCalendarEntries(state.shared)];
        state.calendarsLoaded = true;
        state.calendarsLoading = false;
        const ids = state.calendars.map(c => c.id!);
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
      .addCase(addSharedCalendar.fulfilled, (state, action) => {
        state.shared.push(action.payload);
        saveSharedCalendars(state.shared);
        state.calendars.push(...sharedCalendarEntries([action.payload]));
        const id = sharedCalendarId(action.payload.address);
        if (!state.visibleCalendarIds.includes(id)) state.visibleCalendarIds.push(id);
        saveVisibleCalendars(state.visibleCalendarIds);
      })
      .addCase(deleteCalendar.fulfilled, (state, action) => {
        state.calendars = state.calendars.filter(c => c.id !== action.payload);
        state.visibleCalendarIds = state.visibleCalendarIds.filter(id => id !== action.payload);
        delete state.events[action.payload];
        saveVisibleCalendars(state.visibleCalendarIds);
      })
      .addCase(loadEvents.pending, (state, action) => {
        state.requestedRange = { start: action.meta.arg.start, end: action.meta.arg.end };
        (action.meta.arg.calendarIds || state.visibleCalendarIds).forEach(id => { state.loading[id] = true; });
      })
      .addCase(loadEvents.fulfilled, (state, action) => {
        const { start, end, byCalendar } = action.payload;
        // Stale response for a range the user already left
        if (state.requestedRange && (state.requestedRange.start !== start || state.requestedRange.end !== end)) return;
        if (!state.range || state.range.start !== start || state.range.end !== end) {
          // New range, drop the old events
          state.events = {};
        }
        state.range = { start, end };
        Object.entries(byCalendar).forEach(([id, events]) => {
          state.events[id] = events;
          delete state.loading[id];
          if (action.payload.errors[id]) state.calendarErrors[id] = action.payload.errors[id];
          else delete state.calendarErrors[id];
        });
        state.error = undefined;
      })
      .addCase(loadEvents.rejected, (state, action) => {
        const { start, end } = action.meta.arg;
        if (state.requestedRange && (state.requestedRange.start !== start || state.requestedRange.end !== end)) return;
        state.loading = {};
        state.error = action.payload || action.error.message;
      })
      .addCase(loadEventDetails.fulfilled, (state, action) => {
        if (action.payload.id) state.details[action.payload.id] = action.payload;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        const calendarId = action.meta.arg.calendarId || state.calendars.find(c => c.isDefaultCalendar)?.id || state.visibleCalendarIds[0];
        if (calendarId && state.events[calendarId] && !action.payload.event.recurrence) {
          state.events[calendarId].push(action.payload.event);
        }
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        replaceEvent(state, action.payload.event);
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

export const { setView, toggleCalendarVisible, removeSharedCalendar, setSharedCalendarColor, updateCalendarPrefs, eventMoved } = calendarSlice.actions;
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
        result.push({ ...event, calendarId, color, readOnly: isSharedCalendarId(calendarId), start_: graphDateToDate(event.start), end_: graphDateToDate(event.end) });
      });
    });
    return result;
  },
);

export const selectCalendarLoading = (state: RootState) => Object.keys(state.calendar.loading).length > 0;
