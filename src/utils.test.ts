import { describe, expect, it } from "vitest";
import { buildQuery, readableBytesFormat, resolveContactsFromEmails, parseParams, invertColor } from "./utils";
import type { Contact } from "microsoft-graph";

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

describe("buildQuery", () => {
  it("returns the endpoint when there are no params", () => {
    expect(buildQuery("/me/messages")).toBe("/me/messages");
  });

  it("appends defined params only", () => {
    expect(buildQuery("/me/messages", { skip: 25, search: undefined, filter: "isRead eq false" }))
      .toBe("/me/messages?skip=25&filter=isRead eq false");
  });
});

describe("parseParams", () => {
  it("parses a query string", () => {
    expect(parseParams("redirect=%2Fcalendar&foo")).toEqual({ redirect: "/calendar", foo: "" });
    expect(parseParams("")).toEqual({});
  });
});

describe("invertColor", () => {
  it("inverts hex colors", () => {
    expect(invertColor("#000000")).toBe("#ffffff");
    expect(invertColor("#fff")).toBe("#000000");
    expect(invertColor("#102030")).toBe("#efdfcf");
  });
});

describe("resolveContactsFromEmails", () => {
  const contacts: Contact[] = [
    { id: "1", displayName: "Alice Example", emailAddresses: [{ address: "alice@example.com", name: "Alice" }] },
  ];

  it("matches known contacts case-insensitively", () => {
    const res = resolveContactsFromEmails([{ emailAddress: { address: "Alice@Example.com" } }], contacts);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });

  it("creates pseudo contacts for unknown recipients", () => {
    const res = resolveContactsFromEmails([{ emailAddress: { address: "bob@example.com", name: "Bob" } }], contacts);
    expect(res[0].id).toBeUndefined();
    expect(res[0].displayName).toBe("Bob");
    expect(res[0].emailAddresses?.[0].address).toBe("bob@example.com");
  });

  it("accepts plain address strings and comma separated lists", () => {
    expect(resolveContactsFromEmails("alice@example.com, bob@example.com", contacts).map(c => c.displayName))
      .toEqual(["Alice Example", "bob@example.com"]);
    expect(resolveContactsFromEmails(["carol@example.com"], contacts)[0].displayName).toBe("carol@example.com");
  });

  it("handles missing input", () => {
    expect(resolveContactsFromEmails(undefined, contacts)).toEqual([]);
    expect(resolveContactsFromEmails(null, contacts)).toEqual([]);
  });
});
