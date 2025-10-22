import { describe, expect, it } from "vitest";
import reducer, { filterToOData, findFolder, listKey, messagesReceived, messagesRemoved, setSelection, sortToOData, toggleSelection, togglePinned, loadMessages, loadFolders } from "../mailSlice";
import type { ExtendedMailFolder } from "../../../types/messages";

const folders: ExtendedMailFolder[] = [
  { id: "inbox-id", displayName: "Posteingang", wellKnownName: "inbox", childFolders: [{ id: "sub", displayName: "Sub", wellKnownName: "custom", childFolders: [] }] },
  { id: "custom-id", displayName: "Zeta", wellKnownName: "custom", childFolders: [] },
  { id: "drafts-id", displayName: "Entwürfe", wellKnownName: "drafts", childFolders: [] },
];

describe("mail helpers", () => {
  it("builds list keys", () => {
    expect(listKey("abc")).toBe("folder:abc");
    expect(listKey("abc", "hello")).toBe("search:abc:hello");
    expect(listKey(undefined, "hello")).toBe("search:all:hello");
  });

  it("translates filters and sorts to OData", () => {
    expect(filterToOData("all")).toBeUndefined();
    expect(filterToOData("unread")).toBe("isRead eq false");
    expect(filterToOData("flagged")).toBe("flag/flagStatus eq 'flagged'");
    expect(filterToOData("tome", "me@x.org")).toContain("me@x.org");
    expect(filterToOData("tome", "o'neil@x.org")).toContain("o''neil@x.org");
    expect(sortToOData({ field: "from", direction: "asc" })).toBe("from/emailAddress/name asc");
    expect(sortToOData({ field: "receivedDateTime", direction: "desc" })).toBe("receivedDateTime desc");
  });

  it("finds folders recursively", () => {
    expect(findFolder(folders, "sub")?.displayName).toBe("Sub");
    expect(findFolder(folders, "nope")).toBeUndefined();
    expect(findFolder(folders, undefined)).toBeUndefined();
  });
});

describe("mail reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("sorts well-known folders first and custom folders alphabetically", () => {
    const state = reducer(initial, loadFolders.fulfilled(folders, "req"));
    expect(state.folders.map(f => f.wellKnownName)).toEqual(["inbox", "drafts", "custom"]);
    expect(state.foldersLoaded).toBe(true);
  });

  it("stores list results and merges messages", () => {
    const arg = { folderId: "inbox-id" };
    let state = reducer(initial, loadMessages.pending("req", arg));
    expect(state.lists["folder:inbox-id"].loading).toBe(true);
    state = reducer(state, loadMessages.fulfilled({ key: "folder:inbox-id", messages: [{ id: "m1", subject: "a" }, { id: "m2", subject: "b" }], nextLink: "next", total: 2 }, "req", arg));
    expect(state.lists["folder:inbox-id"].ids).toEqual(["m1", "m2"]);
    expect(state.lists["folder:inbox-id"].nextLink).toBe("next");
    expect(state.messages.m1.subject).toBe("a");

    // A later slim update must not drop an already loaded body
    state = reducer(state, messagesReceived([{ id: "m1", body: { content: "<p>x</p>" } }]));
    state = reducer(state, messagesReceived([{ id: "m1", subject: "a2" }]));
    expect(state.messages.m1.body?.content).toBe("<p>x</p>");
    expect(state.messages.m1.subject).toBe("a2");

    state = reducer(state, messagesRemoved(["m1"]));
    expect(state.lists["folder:inbox-id"].ids).toEqual(["m2"]);
    expect(state.lists["folder:inbox-id"].total).toBe(1);
    expect(state.messages.m1).toBeUndefined();
  });

  it("manages selection and pins", () => {
    let state = reducer(initial, setSelection(["a", "b"]));
    state = reducer(state, toggleSelection("a"));
    expect(state.selection).toEqual(["b"]);
    state = reducer(state, togglePinned("x"));
    expect(state.pinned).toContain("x");
    state = reducer(state, togglePinned("x"));
    expect(state.pinned).not.toContain("x");
  });
});
