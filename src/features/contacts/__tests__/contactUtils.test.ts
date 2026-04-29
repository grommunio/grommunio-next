import { describe, expect, it } from "vitest";
import type { Contact } from "microsoft-graph";
import { birthdayDate, buildContactPayload, ContactDraft, folderWithDescendants, formatBirthday, orderFolders, runLimited } from "../contactUtils";

const draft = (c: Partial<ContactDraft> = {}): ContactDraft => ({
  givenName: "", surname: "", displayName: "", jobTitle: "", personalNotes: "",
  emailAddresses: [{ address: "" }], businessPhones: [""], homePhones: [""],
  businessAddress: { street: "", city: "", state: "", postalCode: "", countryOrRegion: "" },
  homeAddress: { street: "", city: "", state: "", postalCode: "", countryOrRegion: "" },
  categories: [],
  ...c,
});

describe("buildContactPayload", () => {
  it("omits blanks on create and never sends read-only properties", () => {
    const payload = buildContactPayload(draft({ givenName: "Alice", surname: "Example", id: "x", parentFolderId: "f", lastModifiedDateTime: "2024-01-01" } as Partial<ContactDraft>));
    expect(payload).toEqual({ givenName: "Alice", surname: "Example", displayName: "Alice Example" });
  });

  it("sends null/[] for fields cleared on update and only changed fields", () => {
    const original: Contact = {
      id: "1", displayName: "Alice", givenName: "Alice", jobTitle: "CEO", birthday: "1990-05-04T00:00:00Z",
      businessPhones: ["+1"], homePhones: [], emailAddresses: [{ address: "a@x.org", name: "Alice" }],
      businessAddress: { city: "Vienna" }, homeAddress: {}, categories: [], parentFolderId: "f",
    };
    const payload = buildContactPayload(draft({
      ...original, jobTitle: "", birthday: null, businessPhones: [""], homePhones: [""],
      emailAddresses: [{ address: "a@x.org", name: "Alice" }],
      businessAddress: { street: "", city: "", state: "", postalCode: "", countryOrRegion: "" },
      homeAddress: { street: "", city: "", state: "", postalCode: "", countryOrRegion: "" },
    }), original);
    expect(payload).toEqual({ jobTitle: null, birthday: null, businessPhones: [], businessAddress: null });
  });
});

describe("birthdays", () => {
  it("uses the UTC calendar date", () => {
    expect(birthdayDate("1990-05-04T00:00:00Z")).toBe("1990-05-04");
    expect(formatBirthday("1990-05-04T00:00:00Z", "en-US")).toBe("May 4, 1990");
    expect(formatBirthday(undefined)).toBe("");
  });
});

describe("folders", () => {
  const folders = [
    { id: "b", displayName: "B" },
    { id: "a2", displayName: "Child", parentFolderId: "a" },
    { id: "a", displayName: "A", parentFolderId: "root" },
    { id: "a3", displayName: "Grandchild", parentFolderId: "a2" },
  ];
  it("orders the tree depth first with depth", () => {
    expect(orderFolders(folders).map(({ folder, depth }) => `${folder.id}:${depth}`)).toEqual(["a:0", "a2:1", "a3:2", "b:0"]);
  });
  it("finds nested descendants", () => {
    expect([...folderWithDescendants(folders, "a")].sort()).toEqual(["a", "a2", "a3"]);
  });
});

describe("runLimited", () => {
  it("keeps order and limits concurrency", async () => {
    let running = 0, peak = 0;
    const result = await runLimited([1, 2, 3, 4, 5, 6], 2, async n => {
      running++; peak = Math.max(peak, running);
      await new Promise(r => setTimeout(r, 1));
      running--;
      return n * 2;
    });
    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
    expect(peak).toBe(2);
  });
});
