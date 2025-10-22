import { describe, expect, it } from "vitest";
import { dateToGraphDate, dayjs, formatDuration, formatEventRange, graphDateToDate, roundToStep } from "../dates";

describe("graphDateToDate", () => {
  it("interprets wall clock times without zone as local time", () => {
    const date = graphDateToDate({ dateTime: "2024-09-11T10:30:00.0000000", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(30);
  });

  it("converts UTC values", () => {
    const date = graphDateToDate({ dateTime: "2024-09-11T10:30:00.0000000", timeZone: "UTC" });
    expect(date.toISOString()).toBe("2024-09-11T10:30:00.000Z");
  });

  it("returns an invalid date for missing input", () => {
    expect(isNaN(graphDateToDate(undefined).getTime())).toBe(true);
  });
});

describe("dateToGraphDate", () => {
  it("formats without offset and starts all-day events at midnight", () => {
    const d = dayjs("2024-09-11T10:30:00");
    expect(dateToGraphDate(d).dateTime).toBe("2024-09-11T10:30:00");
    expect(dateToGraphDate(d, true).dateTime).toBe("2024-09-11T00:00:00");
    expect(dateToGraphDate(d).timeZone).toBeTruthy();
  });
});

describe("roundToStep", () => {
  it("rounds up to the next step", () => {
    expect(roundToStep(dayjs("2024-09-11T10:01:00")).format("HH:mm")).toBe("10:30");
    expect(roundToStep(dayjs("2024-09-11T10:30:00")).format("HH:mm")).toBe("10:30");
    expect(roundToStep(dayjs("2024-09-11T10:31:00"), 15).format("HH:mm")).toBe("10:45");
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    const start = new Date("2024-09-11T10:00:00");
    expect(formatDuration(start, new Date("2024-09-11T10:45:00"))).toBe("45 min");
    expect(formatDuration(start, new Date("2024-09-11T12:30:00"))).toBe("2 h 30 min");
    expect(formatDuration(start, new Date("2024-09-13T10:00:00"))).toBe("2 d");
  });

  it("formats ranges, treating the all-day end as exclusive", () => {
    const single = formatEventRange(new Date("2024-09-11T00:00:00"), new Date("2024-09-12T00:00:00"), true);
    expect(single).not.toContain("–");
    const multi = formatEventRange(new Date("2024-09-11T00:00:00"), new Date("2024-09-14T00:00:00"), true);
    expect(multi).toContain("–");
    const timed = formatEventRange(new Date("2024-09-11T10:00:00"), new Date("2024-09-11T11:00:00"), false);
    expect(timed).toContain("–");
  });
});
