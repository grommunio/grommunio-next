import { describe, expect, it } from "vitest";
import reducer, { loadEvents } from "../calendarSlice";

describe("calendar reducer", () => {
  const initial = reducer(undefined, { type: "init" });
  const week1 = { start: "2024-09-09T00:00:00.000Z", end: "2024-09-16T00:00:00.000Z" };
  const week2 = { start: "2024-09-16T00:00:00.000Z", end: "2024-09-23T00:00:00.000Z" };

  it("ignores responses for a range that is no longer requested", () => {
    let state = reducer(initial, loadEvents.pending("r1", { ...week1, calendarIds: ["cal"] }));
    state = reducer(state, loadEvents.pending("r2", { ...week2, calendarIds: ["cal"] }));
    state = reducer(state, loadEvents.fulfilled({ ...week2, byCalendar: { cal: [{ id: "new" }] } }, "r2", { ...week2, calendarIds: ["cal"] }));
    state = reducer(state, loadEvents.fulfilled({ ...week1, byCalendar: { cal: [{ id: "old" }] } }, "r1", { ...week1, calendarIds: ["cal"] }));
    expect(state.range).toEqual(week2);
    expect(state.events.cal.map(e => e.id)).toEqual(["new"]);
    expect(state.loading).toEqual({});
  });

  it("keeps the loading state when a stale request fails", () => {
    let state = reducer(initial, loadEvents.pending("r1", { ...week1, calendarIds: ["cal"] }));
    state = reducer(state, loadEvents.pending("r2", { ...week2, calendarIds: ["cal"] }));
    state = reducer(state, loadEvents.rejected(new Error("x"), "r1", { ...week1, calendarIds: ["cal"] }, "x"));
    expect(state.loading.cal).toBe(true);
    expect(state.error).toBeUndefined();
  });
});
