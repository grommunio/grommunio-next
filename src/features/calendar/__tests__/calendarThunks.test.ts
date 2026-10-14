import { beforeEach, describe, expect, it, vi } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import calendarReducer, { addSharedCalendar, ALREADY_OPEN, createEvent, deleteEvent, loadEvents, updateEvent } from "../calendarSlice";
import alertsReducer from "../../alerts/alertsSlice";
import * as calendarApi from "../../../api/calendar";
import { EventReponseType } from "../../../types/calendar";

vi.mock("../../../api/calendar", () => ({
  postEvent: vi.fn(),
  patchEvent: vi.fn(),
  addEventFileAttachment: vi.fn(),
  deleteEvent: vi.fn(),
  cancelEvent: vi.fn(),
  respondToEvent: vi.fn(),
  getSharedCalendar: vi.fn(),
  getCalendarView: vi.fn(),
}));

const api = vi.mocked(calendarApi);

function makeStore() {
  return configureStore({
    reducer: combineReducers({ calendar: calendarReducer, alerts: alertsReducer }),
    middleware: getDefault => getDefault({ serializableCheck: false }),
  });
}

const file = (name: string) => new File(["x"], name);
const week = { start: "2024-09-09T00:00:00.000Z", end: "2024-09-16T00:00:00.000Z" };

describe("calendar thunks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps a created event when an attachment fails and reports the failed file", async () => {
    const store = makeStore();
    api.getCalendarView.mockResolvedValue([]);
    await store.dispatch(loadEvents({ ...week, calendarIds: ["cal"] }) as any);
    api.postEvent.mockResolvedValue({ id: "e1", subject: "Meeting" });
    api.addEventFileAttachment.mockImplementation(async (_id, f) => {
      if (f.name === "big.bin") throw new Error("too large");
      return { name: f.name };
    });
    const result = await store.dispatch(createEvent({ event: { subject: "Meeting" }, calendarId: "cal", files: [file("a.txt"), file("big.bin")] }) as any);
    expect(createEvent.fulfilled.match(result)).toBe(true);
    expect(result.payload.failed).toEqual([{ index: 1, name: "big.bin", error: "too large" }]);
    expect(store.getState().calendar.events.cal.map(e => e.id)).toEqual(["e1"]);
    expect(store.getState().alerts.stack.at(-1)).toMatchObject({ severity: "warning", params: { files: "big.bin" } });
  });

  it("sends the browser time zone with POST and PATCH", async () => {
    const store = makeStore();
    api.postEvent.mockResolvedValue({ id: "e1" });
    api.patchEvent.mockResolvedValue({ id: "e1" });
    await store.dispatch(createEvent({ event: {} }) as any);
    await store.dispatch(updateEvent({ event: { id: "e1", subject: "x" } }) as any);
    expect(api.postEvent.mock.calls[0][2]).toEqual(expect.any(String));
    expect(api.patchEvent.mock.calls[0][1]).toEqual(expect.any(String));
  });

  it("only uploads files when retrying with an unchanged event", async () => {
    const store = makeStore();
    api.addEventFileAttachment.mockResolvedValue({});
    const result = await store.dispatch(updateEvent({ event: { id: "e1" }, files: [file("a.txt")] }) as any);
    expect(updateEvent.fulfilled.match(result)).toBe(true);
    expect(api.patchEvent).not.toHaveBeenCalled();
    expect(api.addEventFileAttachment).toHaveBeenCalledWith("e1", expect.any(File));
  });

  it("declines with a response when an attendee deletes a meeting", async () => {
    const store = makeStore();
    api.respondToEvent.mockResolvedValue();
    api.deleteEvent.mockRejectedValue(new Error("gone"));
    const result = await store.dispatch(deleteEvent({ id: "e1", mode: "decline", comment: "Sorry" }) as any);
    expect(deleteEvent.fulfilled.match(result)).toBe(true);
    expect(api.respondToEvent).toHaveBeenCalledWith("e1", EventReponseType.decline, { comment: "Sorry", sendResponse: true });
    expect(api.cancelEvent).not.toHaveBeenCalled();
  });

  it("deletes without notice in delete mode", async () => {
    const store = makeStore();
    api.deleteEvent.mockResolvedValue();
    await store.dispatch(deleteEvent({ id: "e1", mode: "delete" }) as any);
    expect(api.deleteEvent).toHaveBeenCalledWith("e1");
    expect(api.respondToEvent).not.toHaveBeenCalled();
  });

  it("rejects an already open shared calendar with a known value", async () => {
    const store = makeStore();
    api.getSharedCalendar.mockResolvedValue({});
    await store.dispatch(addSharedCalendar({ address: "bob@example.com" }) as any);
    const again = await store.dispatch(addSharedCalendar({ address: "Bob@example.com" }) as any);
    expect(again.payload).toBe(ALREADY_OPEN);
  });
});
