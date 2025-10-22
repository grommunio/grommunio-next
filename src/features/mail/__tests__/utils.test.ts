import { describe, expect, it } from "vitest";
import { dateGroup, formatListDate, formatRecipient, isValidEmail, prepareMailHtml, previewText, recipientsSummary, toRecipient } from "../utils";

const now = new Date("2024-09-11T15:00:00"); // Wednesday

describe("dateGroup", () => {
  it("groups by day relative to today", () => {
    expect(dateGroup("2024-09-11T08:00:00", now)).toBe("Today");
    expect(dateGroup("2024-09-10T23:59:00", now)).toBe("Yesterday");
    expect(dateGroup("2024-09-09T10:00:00", now)).toBe("This week");
    expect(dateGroup("2024-09-06T10:00:00", now)).toBe("Last week");
    expect(dateGroup("2024-08-28T10:00:00", now)).toBe("Two weeks ago");
    expect(dateGroup("2024-08-21T10:00:00", now)).toBe("Three weeks ago");
    expect(dateGroup("2024-08-05T10:00:00", now)).toBe("Last month");
    expect(dateGroup("2024-05-01T10:00:00", now)).toBe("Older");
  });

  it("handles missing or invalid dates", () => {
    expect(dateGroup(undefined, now)).toBe("Older");
    expect(dateGroup("not a date", now)).toBe("Older");
  });
});

describe("formatListDate", () => {
  it("shows only the time for today", () => {
    expect(formatListDate("2024-09-11T08:05:00", now)).toMatch(/8:05|08:05/);
  });
  it("shows the weekday within the last week", () => {
    expect(formatListDate("2024-09-09T10:00:00", now)).toMatch(/Mon/);
  });
  it("shows day and month in the same year and the full date otherwise", () => {
    expect(formatListDate("2024-03-02T10:00:00", now)).toMatch(/Mar/);
    expect(formatListDate("2023-03-02T10:00:00", now)).toMatch(/2023|23/);
  });
  it("returns an empty string for invalid input", () => {
    expect(formatListDate(null, now)).toBe("");
    expect(formatListDate("garbage", now)).toBe("");
  });
});

describe("recipients", () => {
  it("parses typed addresses", () => {
    expect(toRecipient("alice@example.com")).toEqual({ emailAddress: { address: "alice@example.com", name: "" } });
    expect(toRecipient("Alice Example <alice@example.com>")).toEqual({ emailAddress: { name: "Alice Example", address: "alice@example.com" } });
    expect(toRecipient('"Example, Alice" <alice@example.com>').emailAddress?.name).toBe("Example, Alice");
  });
  it("formats recipients", () => {
    expect(formatRecipient({ emailAddress: { name: "Alice", address: "a@x.org" } })).toBe("Alice <a@x.org>");
    expect(formatRecipient({ emailAddress: { address: "a@x.org" } })).toBe("a@x.org");
  });
  it("validates addresses", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
    expect(isValidEmail("alice@localhost")).toBe(false);
    expect(isValidEmail("<alice@example.com>")).toBe(false);
  });
  it("summarises recipients", () => {
    expect(recipientsSummary({ toRecipients: [{ emailAddress: { name: "A" } }, { emailAddress: { address: "b@x.org" } }] })).toBe("A, b@x.org");
  });
});

describe("previewText", () => {
  it("collapses whitespace and truncates", () => {
    expect(previewText({ bodyPreview: "Hello\n\n   world" })).toBe("Hello world");
    expect(previewText({ bodyPreview: "x".repeat(200) }, 20)).toHaveLength(20);
  });
});

describe("prepareMailHtml", () => {
  it("removes scripts and event handlers but keeps formatting", () => {
    const { html } = prepareMailHtml('<p onclick="x()" style="color:red">Hi<script>alert(1)</script></p>', {});
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain('style="color:red"');
  });

  it("opens links in a new tab without opener access", () => {
    const { html } = prepareMailHtml('<a href="https://example.com">x</a>', {});
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("drops javascript: urls", () => {
    const { html } = prepareMailHtml('<a href="javascript:alert(1)">x</a><img src="javascript:alert(2)">', {});
    expect(html).not.toContain("javascript:");
  });

  it("resolves inline images and counts missing ones", () => {
    const result = prepareMailHtml('<img src="cid:one"><img src="cid:two">', {
      inlineAttachments: [{ contentId: "one", contentBytes: "QUJD", contentType: "image/png" } as any],
    });
    expect(result.html).toContain("data:image/png;base64,QUJD");
    expect(result.missingInline).toBe(1);
  });

  it("renders plain text bodies escaped", () => {
    const { html } = prepareMailHtml("a < b & c", { contentType: "text" });
    expect(html).toContain("<pre>a &lt; b &amp; c</pre>");
  });
});
