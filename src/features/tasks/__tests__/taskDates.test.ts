import { describe, expect, it } from "vitest";
import { buildRecurrence, dueDateValue, formatDateOnly, graphCalendarDate, repeatKey } from "../taskDates";

describe("task dates", () => {
  it("reads midnight values as date-only in every zone", () => {
    expect(graphCalendarDate({ dateTime: "2024-05-04T00:00:00.0000000", timeZone: "UTC" })).toBe("2024-05-04");
    expect(graphCalendarDate({ dateTime: "2024-05-04T00:00:00", timeZone: "Europe/Berlin" })).toBe("2024-05-04");
    expect(graphCalendarDate(null)).toBeNull();
  });

  it("reads other instants as the local calendar date", () => {
    const value = { dateTime: "2024-05-03T22:00:00.0000000", timeZone: "UTC" };
    const local = new Date(Date.UTC(2024, 4, 3, 22));
    const expected = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
    expect(graphCalendarDate(value)).toBe(expected);
  });

  it("writes due dates as UTC midnight and round-trips them", () => {
    const value = dueDateValue("2024-05-04");
    expect(value).toEqual({ dateTime: "2024-05-04T00:00:00", timeZone: "UTC" });
    expect(graphCalendarDate(value)).toBe("2024-05-04");
    expect(dueDateValue(null)).toBeNull();
  });

  it("formats a date without zone shifts", () => {
    expect(formatDateOnly("2024-05-04", "en-US", { dateStyle: "long" })).toBe("May 4, 2024");
  });
});

describe("buildRecurrence", () => {
  it("derives Graph-required fields from the due date", () => {
    // 2024-05-04 is a Saturday
    expect(buildRecurrence("weekly", "2024-05-04")).toEqual({
      pattern: { type: "weekly", interval: 1, daysOfWeek: ["saturday"], firstDayOfWeek: "sunday" },
      range: { type: "noEnd", startDate: "2024-05-04" },
    });
    expect(buildRecurrence("monthly", "2024-05-04")?.pattern).toEqual({ type: "absoluteMonthly", interval: 1, dayOfMonth: 4 });
    expect(buildRecurrence("yearly", "2024-05-04")?.pattern).toEqual({ type: "absoluteYearly", interval: 1, dayOfMonth: 4, month: 5 });
    expect(buildRecurrence("daily", "2024-05-04")?.range).toEqual({ type: "noEnd", startDate: "2024-05-04" });
    expect(buildRecurrence("none", "2024-05-04")).toBeNull();
  });

  it("maps recurrences back to presets", () => {
    (["daily", "weekdays", "weekly", "monthly", "yearly"] as const).forEach(key => expect(repeatKey(buildRecurrence(key, "2024-05-04"))).toBe(key));
    expect(repeatKey(null)).toBe("none");
  });
});
