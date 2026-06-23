import { describe, expect, it } from "vitest";
import type { PatternedRecurrence } from "microsoft-graph";
import { applyWeekStart, dayjs } from "../dates";
import {
  alignRecurrence, availabilityRanges, isAllDaySelection, safeHttpUrl, sameDomain, toExclusiveAllDayEnd, toInclusiveAllDayEnd,
} from "../eventUtils";

describe("all-day end conversion", () => {
  it("shows the last day of a Graph all-day event", () => {
    const start = dayjs("2024-09-11T00:00:00");
    expect(toInclusiveAllDayEnd(start, dayjs("2024-09-12T00:00:00")).format("YYYY-MM-DD")).toBe("2024-09-11");
    expect(toInclusiveAllDayEnd(start, dayjs("2024-09-14T00:00:00")).format("YYYY-MM-DD")).toBe("2024-09-13");
  });

  it("never ends before the start and handles timed ends", () => {
    const start = dayjs("2024-09-11T10:00:00");
    expect(toInclusiveAllDayEnd(start, dayjs("2024-09-11T11:00:00")).format("YYYY-MM-DD")).toBe("2024-09-11");
    expect(toInclusiveAllDayEnd(start, dayjs("2024-09-11T00:00:00")).format("YYYY-MM-DD")).toBe("2024-09-11");
  });

  it("always sends an exclusive end and round-trips", () => {
    expect(toExclusiveAllDayEnd(dayjs("2024-09-11T00:00:00")).format("YYYY-MM-DDTHH:mm")).toBe("2024-09-12T00:00");
    expect(toExclusiveAllDayEnd(dayjs("2024-09-12T15:00:00")).format("YYYY-MM-DDTHH:mm")).toBe("2024-09-13T00:00");
    const start = dayjs("2024-09-11T00:00:00");
    const graphEnd = dayjs("2024-09-14T00:00:00");
    expect(toExclusiveAllDayEnd(toInclusiveAllDayEnd(start, graphEnd)).isSame(graphEnd)).toBe(true);
  });
});

describe("isAllDaySelection", () => {
  const day = (d: string) => new Date(`${d}T00:00:00`);

  it("detects all-day row selections in time grid views", () => {
    expect(isAllDaySelection("week", { start: day("2024-09-11"), end: day("2024-09-12"), slots: [day("2024-09-11")], action: "click" })).toBe(true);
    expect(isAllDaySelection("week", { start: day("2024-09-11"), end: day("2024-09-13"), slots: [day("2024-09-11"), day("2024-09-12")], action: "select" })).toBe(true);
  });

  it("treats time grid selections as timed", () => {
    const start = new Date("2024-09-11T10:00:00");
    const end = new Date("2024-09-11T11:00:00");
    expect(isAllDaySelection("day", { start, end, slots: [start, new Date("2024-09-11T10:30:00"), end], action: "select" })).toBe(false);
    const slots = Array.from({ length: 49 }, (_, i) => dayjs("2024-09-11T00:00:00").add(i * 30, "minute").toDate());
    expect(isAllDaySelection("day", { start: day("2024-09-11"), end: day("2024-09-12"), slots, action: "select" })).toBe(false);
  });

  it("only uses multi-day selections in month view", () => {
    expect(isAllDaySelection("month", { start: day("2024-09-11"), end: day("2024-09-12"), slots: [day("2024-09-11")], action: "click" })).toBe(false);
    expect(isAllDaySelection("month", { start: day("2024-09-11"), end: day("2024-09-14"), slots: [day("2024-09-11"), day("2024-09-12"), day("2024-09-13")], action: "select" })).toBe(true);
  });
});

describe("alignRecurrence", () => {
  const monthly: PatternedRecurrence = {
    pattern: { type: "absoluteMonthly", interval: 1, dayOfMonth: 11, firstDayOfWeek: "monday" },
    range: { type: "endDate", startDate: "2024-09-11", endDate: "2024-12-31" },
  };

  it("moves range.startDate and the pattern to the new start", () => {
    const aligned = alignRecurrence(monthly, dayjs("2024-09-20T10:00:00"));
    expect(aligned.range?.startDate).toBe("2024-09-20");
    expect(aligned.range?.endDate).toBe("2024-12-31");
    expect(aligned.pattern?.dayOfMonth).toBe(20);
    expect(monthly.range?.startDate).toBe("2024-09-11");
  });

  it("recomputes relative and yearly patterns", () => {
    const relative = alignRecurrence({ pattern: { type: "relativeYearly", interval: 1, daysOfWeek: ["monday"], index: "first", month: 1 }, range: { type: "noEnd", startDate: "2024-01-01" } },
      dayjs("2024-09-29T09:00:00"));
    expect(relative.pattern).toMatchObject({ daysOfWeek: ["sunday"], index: "last", month: 9 });
  });

  it("keeps the end date after the start", () => {
    const aligned = alignRecurrence(monthly, dayjs("2025-02-01T09:00:00"));
    expect(aligned.range?.endDate).toBe("2025-02-01");
  });
});

describe("misc helpers", () => {
  it("only accepts http(s) join links", () => {
    expect(safeHttpUrl("https://meet.example.com/abc")).toBe("https://meet.example.com/abc");
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
    expect(safeHttpUrl(null)).toBeUndefined();
  });

  it("compares mail domains", () => {
    expect(sameDomain("a@Example.com", "b@example.com")).toBe(true);
    expect(sameDomain("a@example.org", "b@example.com")).toBe(false);
    expect(sameDomain("a@example.org", undefined)).toBe(false);
  });

  it("collapses availability views", () => {
    expect(availabilityRanges("0022100")).toEqual([{ from: 2, to: 4, code: "2" }, { from: 4, to: 5, code: "1" }]);
    expect(availabilityRanges("000")).toEqual([]);
  });

  it("applies the week start preference to dayjs", () => {
    const wednesday = dayjs("2024-09-11T12:00:00");
    applyWeekStart(1);
    expect(wednesday.startOf("week").format("YYYY-MM-DD")).toBe("2024-09-09");
    applyWeekStart(0);
    expect(wednesday.startOf("week").format("YYYY-MM-DD")).toBe("2024-09-08");
    applyWeekStart(6);
    expect(wednesday.startOf("week").format("YYYY-MM-DD")).toBe("2024-09-07");
    applyWeekStart(0);
  });
});

import { weekNumber } from "../dates";

describe("weekNumber", () => {
  it("uses ISO weeks when weeks start on Monday", () => {
    // 2024-12-30 belongs to ISO week 1 of 2025
    expect(weekNumber(new Date("2024-12-30T12:00:00"), 1)).toBe(1);
    expect(weekNumber(new Date("2024-10-28T12:00:00"), 1)).toBe(44);
  });
});
