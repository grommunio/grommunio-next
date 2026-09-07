import { describe, expect, it } from "vitest";
import type { Message } from "microsoft-graph";
import reducer, { loadConversation, loadMessages, loadFolders, sendCompose } from "../mailSlice";
import { makeSelectConversationGroups, makeSelectConversationMessages } from "../selectors";
import {
  buildRows, conversationMessages, conversationViewApplies, groupConversations, newlyExpanded, rowIds, selectedRowId,
  sortConversationMessages,
} from "../conversations";
import type { RootState } from "../../../store";
import type { ExtendedMailFolder } from "../../../types/messages";

const msg = (id: string, conversationId: string | undefined, minute: number, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId,
  receivedDateTime: new Date(Date.UTC(2024, 0, 1, 12, minute)).toISOString(),
  isRead: true,
  from: { emailAddress: { name: `Sender ${id}`, address: `${id}@x.org` } },
  subject: `Subject ${id}`,
  parentFolderId: "inbox",
  ...extra,
});

describe("groupConversations", () => {
  const messages = [
    msg("a3", "A", 30),
    msg("b2", "B", 20, { isRead: false, hasAttachments: true }),
    msg("a1", "A", 10, { flag: { flagStatus: "flagged" }, importance: "high" }),
    msg("c1", undefined, 5),
    msg("b1", "B", 1, { from: { emailAddress: { name: "Sender a3", address: "a3@x.org" } } }),
  ];

  it("groups by conversationId and aggregates the row state", () => {
    const groups = groupConversations(messages);
    expect(groups.map(g => g.id)).toEqual(["A", "B", "c1"]);
    const [a, b, c] = groups;
    expect(a.ids).toEqual(["a3", "a1"]);
    expect(a.latest.id).toBe("a3");
    expect(a.unread).toBe(0);
    expect(a.flagged).toBe(true);
    expect(a.highImportance).toBe(true);
    expect(a.hasAttachments).toBe(false);
    expect(a.senders).toEqual(["Sender a3", "Sender a1"]);
    expect(b.unread).toBe(1);
    expect(b.hasAttachments).toBe(true);
    expect(b.senders).toEqual(["Sender b2", "Sender a3"]);
    // Messages without a conversation stand alone
    expect(c.ids).toEqual(["c1"]);
  });

  it("orders groups by their newest message", () => {
    // B gets a newer message than A: B moves up even though its first message is further down
    const groups = groupConversations([msg("a3", "A", 30), msg("b9", "B", 40), msg("b1", "B", 1)], { sort: { field: "receivedDateTime", direction: "desc" } });
    expect(groups.map(g => g.id)).toEqual(["B", "A"]);
    const asc = groupConversations([msg("b1", "B", 1), msg("a3", "A", 30), msg("b9", "B", 40)], { sort: { field: "receivedDateTime", direction: "asc" } });
    expect(asc.map(g => g.id)).toEqual(["A", "B"]);
  });

  it("keeps the list order for other sorts and pinned conversations on top", () => {
    const bySubject = groupConversations([msg("b1", "B", 1), msg("a3", "A", 30), msg("b9", "B", 40)], { sort: { field: "subject", direction: "asc" } });
    expect(bySubject.map(g => g.id)).toEqual(["B", "A"]);
    const pinned = groupConversations([msg("a3", "A", 30), msg("b1", "B", 1)], { pinned: ["b1"] });
    expect(pinned.map(g => g.id)).toEqual(["B", "A"]);
    expect(pinned[0].pinned).toBe(true);
  });
});

describe("conversation rows", () => {
  const groups = groupConversations([msg("a3", "A", 30), msg("a1", "A", 10), msg("c1", "C", 5)]);

  it("shows single messages as message rows and expands conversations inline", () => {
    expect(buildRows(groups, new Set()).map(r => `${r.kind}:${r.id}`)).toEqual(["conversation:conv:A", "message:c1"]);
    const rows = buildRows(groups, new Set(["A"]));
    expect(rows.map(r => r.id)).toEqual(["conv:A", "a3", "a1", "c1"]);
    expect(rows[1].kind === "message" && rows[1].nested).toBe(true);
    expect(rowIds(rows[0])).toEqual(["a3", "a1"]);
  });

  it("selects the conversation row unless a child was chosen", () => {
    const collapsed = buildRows(groups, new Set());
    expect(selectedRowId(collapsed, "a1", true)).toBe("conv:A");
    const rows = buildRows(groups, new Set(["A"]));
    expect(selectedRowId(rows, "a1", false)).toBe("conv:A");
    expect(selectedRowId(rows, "a1", true)).toBe("a1");
    expect(selectedRowId(rows, "c1", false)).toBe("c1");
    expect(selectedRowId(rows, undefined, false)).toBeUndefined();
  });

  it("applies only outside Sent Items, Drafts and search", () => {
    expect(conversationViewApplies(true, "inbox", false)).toBe(true);
    expect(conversationViewApplies(true, "custom", false)).toBe(true);
    expect(conversationViewApplies(true, "sentitems", false)).toBe(false);
    expect(conversationViewApplies(true, "drafts", false)).toBe(false);
    expect(conversationViewApplies(true, "inbox", true)).toBe(false);
    expect(conversationViewApplies(false, "inbox", false)).toBe(false);
  });
});

describe("conversation reading pane", () => {
  const thread = [msg("m2", "A", 20), msg("m1", "A", 10), msg("m3", "A", 30, { isRead: false })];

  it("sorts newest or oldest first", () => {
    expect(sortConversationMessages(thread, "newestFirst").map(m => m.id)).toEqual(["m3", "m2", "m1"]);
    expect(sortConversationMessages(thread, "oldestFirst").map(m => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("expands the newest, unread and opened messages once", () => {
    const withUnread = [...thread, msg("m0", "A", 0, { isRead: false })];
    expect(newlyExpanded(withUnread, new Set(), "m1").sort()).toEqual(["m0", "m1", "m3"]);
    // Already seen messages are left as the user set them
    expect(newlyExpanded(withUnread, new Set(["m0", "m1", "m2", "m3"]), "m1")).toEqual([]);
    // A new arrival is the newest and expands
    expect(newlyExpanded([...thread, msg("m4", "A", 40)], new Set(["m1", "m2", "m3"]))).toEqual(["m4"]);
  });

  it("skips messages in excluded folders", () => {
    const store = Object.fromEntries([
      msg("x1", "A", 1),
      msg("x2", "A", 2, { parentFolderId: "deleted" }),
      msg("x3", "B", 3),
    ].map(m => [m.id!, m]));
    expect(conversationMessages(store, "A", new Set(["deleted"])).map(m => m.id)).toEqual(["x1"]);
  });
});

describe("conversation selectors and state", () => {
  const folders: ExtendedMailFolder[] = [
    { id: "inbox", displayName: "Inbox", wellKnownName: "inbox", childFolders: [] },
    { id: "deleted", displayName: "Deleted Items", wellKnownName: "deleteditems", childFolders: [] },
    { id: "junk", displayName: "Junk", wellKnownName: "junkemail", childFolders: [] },
  ];
  let state = reducer(undefined, { type: "init" });
  state = reducer(state, loadFolders.fulfilled(folders, "f"));
  state = reducer(state, loadMessages.pending("req", { folderId: "inbox" }));
  state = reducer(state, loadMessages.fulfilled({
    key: "folder:inbox",
    messages: [msg("i3", "A", 30), msg("i2", "B", 20), msg("i1", "A", 10)],
  }, "req", { folderId: "inbox" }));
  const root = (mail: typeof state) => ({ mail } as unknown as RootState);

  it("groups the loaded list", () => {
    const groups = makeSelectConversationGroups("folder:inbox")(root(state));
    expect(groups.map(g => [g.id, g.ids])).toEqual([["A", ["i3", "i1"]], ["B", ["i2"]]]);
  });

  it("stores loaded conversations and leaves out Deleted Items and Junk", () => {
    let next = reducer(state, loadConversation.pending("c", "A"));
    expect(next.conversations.A.loading).toBe(true);
    next = reducer(next, loadConversation.fulfilled([
      msg("s1", "A", 15, { parentFolderId: "sent" }),
      msg("d1", "A", 16, { parentFolderId: "deleted" }),
      msg("j1", "A", 17, { parentFolderId: "junk" }),
    ], "c", "A"));
    expect(next.conversations.A).toEqual({ loading: false, loaded: true });
    const ids = makeSelectConversationMessages("A", "inbox")(root(next)).map(m => m.id).sort();
    expect(ids).toEqual(["i1", "i3", "s1"]);
    // Opened from Deleted Items: those messages are shown
    const fromDeleted = makeSelectConversationMessages("A", "deleted")(root(next)).map(m => m.id).sort();
    expect(fromDeleted).toEqual(["d1", "i1", "i3", "s1"]);
    // Sending marks loaded conversations for reload
    next = reducer(next, sendCompose.fulfilled(1, "s", { patch: {} }));
    expect(next.conversations.A.loaded).toBe(false);
  });
});
