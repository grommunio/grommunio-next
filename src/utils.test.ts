import { describe, expect, it } from "vitest";
import { avatarColor, initialsOf, invertColor, readableBytesFormat, toReadableTimeInTimezone } from "./utils";

describe("readableBytesFormat", () => {
  it("formats bytes with binary units", () => {
    expect(readableBytesFormat(0)).toBe("0 B");
    expect(readableBytesFormat(512)).toBe("512 B");
    expect(readableBytesFormat(1024)).toBe("1.0 KB");
    expect(readableBytesFormat(1536)).toBe("1.5 KB");
    expect(readableBytesFormat(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("does not run past the last unit", () => {
    expect(readableBytesFormat(2 ** 50)).toBe("1024.0 TB");
  });
});

describe("invertColor", () => {
  it("inverts hex colors", () => {
    expect(invertColor("#000000")).toBe("#ffffff");
    expect(invertColor("#fff")).toBe("#000000");
    expect(invertColor("#102030")).toBe("#efdfcf");
  });
});

describe("initialsOf", () => {
  it("uses the first letters of first and last word", () => {
    expect(initialsOf("Alice Example")).toBe("AE");
    expect(initialsOf("Alice Marie Example")).toBe("AE");
    expect(initialsOf("alice@example.com")).toBe("AL");
    expect(initialsOf("")).toBe("");
    expect(initialsOf('"Example, Alice" <a@x.org>')).toBe("EA");
  });
});

describe("avatarColor", () => {
  it("is deterministic and case insensitive", () => {
    expect(avatarColor("Alice@Example.com")).toBe(avatarColor("alice@example.com"));
    expect(avatarColor("a")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("toReadableTimeInTimezone", () => {
  it("formats UTC values in local time", () => {
    const result = toReadableTimeInTimezone({ dateTime: "2024-09-11T10:30:00.0000000", timeZone: "UTC" }, "YYYY-MM-DD HH:mm");
    const expected = new Date("2024-09-11T10:30:00Z");
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(result).toBe(`${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())} ${pad(expected.getHours())}:${pad(expected.getMinutes())}`);
  });
  it("returns an empty string for missing values", () => {
    expect(toReadableTimeInTimezone(undefined)).toBe("");
    expect(toReadableTimeInTimezone({ dateTime: undefined })).toBe("");
  });
});
