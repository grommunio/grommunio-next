import { describe, expect, it } from "vitest";
import { quoteSearch } from "../graph";
import { customHostsFor } from "../utils";

describe("quoteSearch", () => {
  it("wraps plain text in quotes", () => {
    expect(quoteSearch("invoice")).toBe('"invoice"');
  });

  it("escapes inner quotes and backslashes", () => {
    expect(quoteSearch('invoice "march 2024"')).toBe('"invoice \\"march 2024\\""');
    expect(quoteSearch("a\\b")).toBe('"a\\\\b"');
  });
});

describe("customHostsFor", () => {
  it("returns the host name without port", () => {
    expect([...customHostsFor("https://mail.example.com:8443/graph/")!]).toEqual(["mail.example.com"]);
  });

  it("ignores invalid URLs", () => {
    expect(customHostsFor("not a url")).toBeUndefined();
  });
});
