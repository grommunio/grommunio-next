import { describe, expect, it } from "vitest";
import { safeRedirectTarget } from "../UnauthenticatedRoute";

describe("safeRedirectTarget", () => {
  const origin = "https://mail.example.com";

  it("keeps same-origin paths with query and hash", () => {
    expect(safeRedirectTarget("/calendar/week?x=1#top", origin)).toBe("/calendar/week?x=1#top");
  });

  it.each([
    null,
    "",
    "calendar",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "https://evil.com/",
    "/\t/evil.com",
    "/login",
    "/login?redirect=/login",
  ])("rejects %j", value => {
    expect(safeRedirectTarget(value, origin)).toBe("/");
  });
});
