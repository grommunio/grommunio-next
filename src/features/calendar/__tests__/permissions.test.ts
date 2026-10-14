import { describe, expect, it } from "vitest";
import { attendeePatch, deleteModeFor, INVITE_ROLES, isWritableCalendar, roleOptions } from "../eventUtils";

describe("new event calendars", () => {
  it("excludes shared and read-only calendars", () => {
    expect(isWritableCalendar({ id: "own", canEdit: true })).toBe(true);
    expect(isWritableCalendar({ id: "own" })).toBe(true);
    expect(isWritableCalendar({ id: "birthdays", canEdit: false })).toBe(false);
    expect(isWritableCalendar({ id: "shared:alice@example.com" })).toBe(false);
  });
});

describe("deleteModeFor", () => {
  const attendee = { emailAddress: { address: "a@example.com" } };
  it("cancels own meetings and deletes own appointments", () => {
    expect(deleteModeFor({ isOrganizer: true, attendees: [attendee] })).toBe("cancel");
    expect(deleteModeFor({ isOrganizer: true, attendees: [] })).toBe("delete");
  });
  it("declines received meetings unless already declined", () => {
    expect(deleteModeFor({ isOrganizer: false, attendees: [attendee] })).toBe("decline");
    expect(deleteModeFor({ isOrganizer: false, responseStatus: { response: "declined" } })).toBe("delete");
  });
});

describe("attendeePatch", () => {
  it("keeps only the properties an attendee may change", () => {
    expect(attendeePatch({
      subject: "x", start: { dateTime: "2024-01-01T10:00:00", timeZone: "UTC" }, attendees: [],
      isReminderOn: true, reminderMinutesBeforeStart: 5, showAs: "free", categories: ["Red"], sensitivity: "private",
    })).toEqual({ isReminderOn: true, reminderMinutesBeforeStart: 5, showAs: "free", categories: ["Red"], sensitivity: "private" });
  });
});

describe("roleOptions", () => {
  const values = (o: ReturnType<typeof roleOptions>) => o.map(r => r.value);
  it("lets the organization entry be set to none", () => {
    expect(values(roleOptions({ role: "freeBusyRead", isRemovable: false, allowedRoles: ["none", "freeBusyRead", "limitedRead", "read"] })))
      .toEqual(["none", "freeBusyRead", "limitedRead", "read"]);
  });
  it("shows custom and unknown roles read-only", () => {
    const custom = roleOptions({ role: "custom", allowedRoles: ["read", "custom"] });
    expect(custom.find(r => r.value === "custom")?.disabled).toBe(true);
    expect(values(custom)).toEqual(["read", "custom"]);
    const unknown = roleOptions({ role: "future" as never });
    expect(unknown.at(-1)).toMatchObject({ value: "future", disabled: true });
  });
  it("offers private delegate access when allowed", () => {
    expect(values(roleOptions({ role: "delegateWithPrivateEventAccess" }))).toContain("delegateWithPrivateEventAccess");
    expect(INVITE_ROLES.map(r => r.value)).not.toContain("none");
  });
});
