import { afterEach, describe, expect, it } from "vitest";
import { dateFormatOptions, formatExample, isValidFormat, timeFormatOptions, toDayjsPattern } from "../formats";
import { clearExplicitLanguage, getExplicitLanguage, matchUiLanguage, resolveLanguage, setExplicitLanguage } from "../language";
import { buildWorkingHours, formatTimeOfDay, parseTimeOfDay, timeChoices } from "../workingHours";
import { externalReplyMessage } from "../autoReplies";
import { timeZoneStandardOf } from "../../../api/settings";
import { dayjs } from "../../calendar/dates";

describe("date and time formats", () => {
  it("offers only patterns of the mailbox culture plus the current value", () => {
    expect(dateFormatOptions("de-DE", "dd.MM.yyyy")).toContain("dd.MM.yyyy");
    expect(dateFormatOptions("de-DE", "dd.MM.yyyy")).not.toContain("MM/dd/yyyy");
    expect(timeFormatOptions("de-DE", "HH:mm")).not.toContain("h:mm tt");
    expect(timeFormatOptions("en-us", "h:mm tt")).toContain("HH:mm");
  });

  it("only offers the current value for unknown cultures", () => {
    expect(dateFormatOptions("sl-SI", "d. MM. yyyy")).toEqual(["d. MM. yyyy"]);
    expect(dateFormatOptions(undefined, "")).toEqual([]);
  });

  it("validates values before saving", () => {
    expect(isValidFormat("date", "en-US", "dd.MM.yyyy")).toBe(false);
    expect(isValidFormat("time", "de-DE", "h:mm tt")).toBe(false);
    expect(isValidFormat("date", "en-GB", "dd/MM/yyyy")).toBe(true);
    expect(isValidFormat("date", "sl-SI", "dd.MM.yyyy")).toBe(false);
  });

  it("previews .NET patterns", () => {
    expect(toDayjsPattern("dd.MM.yyyy")).toBe("DD.MM.YYYY");
    expect(toDayjsPattern("h:mm tt")).toBe("h:mm A");
    expect(formatExample("M/d/yyyy", dayjs("2024-03-05T14:30:00"))).toBe("M/d/yyyy (3/5/2024)");
  });
});

describe("time zone standard", () => {
  it("detects Windows and IANA names", () => {
    expect(timeZoneStandardOf("W. Europe Standard Time")).toBe("Windows");
    expect(timeZoneStandardOf("UTC")).toBe("Windows");
    expect(timeZoneStandardOf("Europe/Vienna")).toBe("Iana");
    expect(timeZoneStandardOf(undefined)).toBe("Windows");
  });
});

describe("UI language", () => {
  afterEach(() => clearExplicitLanguage());

  it("maps mailbox locales to shipped languages", () => {
    expect(matchUiLanguage("de-AT", ["de-DE", "en-US"])).toBe("de-DE");
    expect(matchUiLanguage("EN-us", ["de-DE", "en-US"])).toBe("en-US");
    expect(matchUiLanguage("xx-YY", ["de-DE"])).toBeNull();
  });

  it("prefers the sign-in choice of this session, then the mailbox, then the cache", () => {
    expect(resolveLanguage("fr-FR", "de-DE", "en-US")).toBe("fr-FR");
    expect(resolveLanguage(null, "de-DE", "en-US")).toBe("de-DE");
    expect(resolveLanguage(null, undefined, "en-US")).toBe("en-US");
  });

  it("keeps the sign-in choice in sessionStorage only", () => {
    setExplicitLanguage("it-IT");
    expect(getExplicitLanguage()).toBe("it-IT");
    expect(window.localStorage.getItem("lang.explicit")).toBeNull();
  });
});

describe("working hours", () => {
  it("keeps minutes", () => {
    expect(parseTimeOfDay("08:30:00.0000000")).toBe(510);
    expect(formatTimeOfDay(1050)).toBe("17:30:00.0000000");
    expect(parseTimeOfDay("garbage")).toBeNull();
  });

  it("includes the mailbox value in the choices", () => {
    expect(timeChoices(480, 600, [525])).toEqual([480, 510, 525, 540, 570, 600]);
  });

  it("sends unchanged times and the time zone as the mailbox had them", () => {
    const original = { daysOfWeek: ["monday" as const], startTime: "08:30:00", endTime: "17:30:00.0000000", timeZone: { name: "W. Europe Standard Time" } };
    const result = buildWorkingHours(original, ["monday", "tuesday"], 510, 1080, "Pacific Standard Time");
    expect(result).toEqual({ daysOfWeek: ["monday", "tuesday"], startTime: "08:30:00", endTime: "18:00:00.0000000", timeZone: { name: "W. Europe Standard Time" } });
  });

  it("uses the mailbox time zone, never the browser one", () => {
    expect(buildWorkingHours(undefined, ["friday"], 540, 1020, "W. Europe Standard Time").timeZone).toEqual({ name: "W. Europe Standard Time" });
    expect(buildWorkingHours(undefined, ["friday"], 540, 1020, undefined)).not.toHaveProperty("timeZone");
  });
});

describe("automatic replies", () => {
  it("keeps the stored external message when the editor was never used or is hidden", () => {
    expect(externalReplyMessage(false, "<p>in</p>", null, "<p>out</p>")).toBe("<p>out</p>");
    expect(externalReplyMessage(false, "<p>in</p>", "<p>edited</p>", "<p>out</p>")).toBe("<p>edited</p>");
    expect(externalReplyMessage(true, "<p>in</p>", "<p>edited</p>", "<p>out</p>")).toBe("<p>in</p>");
  });
});
