// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, CircularProgress, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MailOutline } from "@mui/icons-material";
import { KeyboardEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStore } from "react-redux";
import type { Message } from "microsoft-graph";
import { RootState, useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch, useSearchContext } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import EmptyState from "../../../components/common/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import FolderPane from "./FolderPane";
import MessageList from "./MessageList";
import MessageView from "./MessageView";
import ConversationView from "./ConversationView";
import type { ConversationAction } from "./ConversationListItem";
import Compose from "./Compose";
import MailToolbar from "./MailToolbar";
import MessageActionsMenu from "./MessageActionsMenu";
import useMailActions from "../useMailActions";
import useMarkAsRead from "../useMarkAsRead";
import {
  buildRows, ConversationGroup, conversationRowId, conversationViewApplies, flatRows, ListRow, rowIds, rowMessage,
  selectedRowId as findSelectedRow,
} from "../conversations";
import { folderSlug } from "../utils";
import { makeSelectConversationGroups, makeSelectListMessages } from "../selectors";
import {
  clearSearchLists, clearSelection, deleteConfirmClosed, deleteMessages, findFolder, findWellKnownFolder, listKey, loadCategories,
  loadChildFolders, loadFolders, loadMessageDetails, loadMessages, loadMoreMessages, moveMessages, requestDelete, setListFilter,
  setListSort, setSelection, startCompose, syncFolder, toggleSelection, togglePinned, updateMessages, updatePrefs,
} from "../mailSlice";
import { getMailFolder } from "../../../api/folders";
import { pushAlertStack } from "../../../features/alerts/alertsSlice";
import type { MailFilter, MailSort } from "../types";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../../types/messages";

const SYNC_INTERVAL = 30000;
const HIDDEN_SYNC_INTERVAL = 120000;

const WELL_KNOWN: WellKnownFolderName[] = ["inbox", "drafts", "sentitems", "deleteditems", "junkemail", "archive", "outbox"];


const isFocusFilter = (filter?: MailFilter) => filter === "focused" || filter === "other";

// Plural forms used by the delete confirmation:
// t("{{count}} messages will be deleted permanently_one")
// t("{{count}} messages will be deleted permanently_other")
// t("{{count}} messages will be moved to Deleted Items_one")
// t("{{count}} messages will be moved to Deleted Items_other")
const MailView = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const store = useStore<RootState>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ folder?: string; messageId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { setQuery } = useSearchContext();

  // Narrow selectors, the whole slice would re-render on every change
  const folders = useTypeSelector(state => state.mail.folders);
  const foldersLoaded = useTypeSelector(state => state.mail.foldersLoaded);
  const prefs = useTypeSelector(state => state.mail.prefs);
  const selection = useTypeSelector(state => state.mail.selection);
  const pinned = useTypeSelector(state => state.mail.pinned);
  const compose = useTypeSelector(state => state.mail.compose);
  const deleteConfirm = useTypeSelector(state => state.mail.deleteConfirm);
  const [search, setSearch] = useState("");
  const [focusedTab, setFocusedTab] = useState<"focused" | "other">("focused");
  const [contextMenu, setContextMenu] = useState<{ position: { top: number; left: number }; ids: string[] } | null>(null);
  const [more, setMore] = useState<{ anchor: HTMLElement; id: string; bodyHtml?: string } | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  // Picked from the rows of an expanded conversation
  const [childSelected, setChildSelected] = useState(false);
  const [bodyHtml, setBodyHtml] = useState("");
  const [composeFullscreen, setComposeFullscreen] = useState(false);
  const [folderDrawer, setFolderDrawer] = useState(false);

  const folder = useMemo(() => {
    const slug = params.folder;
    if (!slug) return undefined;
    if (WELL_KNOWN.includes(slug as WellKnownFolderName)) return folders.find(f => f.wellKnownName === slug);
    return findFolder(folders, decodeURIComponent(slug));
  }, [folders, params.folder]);
  const inboxId = useMemo(() => findWellKnownFolder(folders, "inbox")?.id || undefined, [folders]);

  const messageId = params.messageId ? decodeURIComponent(params.messageId) : undefined;
  const key = listKey(folder?.id, search || undefined);
  const list = useTypeSelector(state => state.mail.lists[key]);
  const selectListMessages = useMemo(() => makeSelectListMessages(key), [key]);
  const messages = useTypeSelector(selectListMessages);
  const selectGroups = useMemo(() => makeSelectConversationGroups(key), [key]);
  const groups = useTypeSelector(selectGroups);
  const conversationMode = conversationViewApplies(prefs.conversationView, folder?.wellKnownName, Boolean(search));
  const rows = useMemo(() => conversationMode ? buildRows(groups, expanded) : flatRows(messages), [conversationMode, groups, expanded, messages]);
  const selectedMessage = useTypeSelector(state => messageId ? state.mail.messages[messageId] : undefined);
  const selectedError = useTypeSelector(state => messageId ? state.mail.detailsError[messageId] : undefined);
  const selectedLoading = useTypeSelector(state => messageId ? state.mail.loadingDetails[messageId] : false);

  useEffect(() => {
    dispatch(loadFolders());
    dispatch(loadCategories());
  }, []);

  useEffect(() => {
    if (foldersLoaded && !params.folder) {
      navigate("/mail/inbox", { replace: true });
    }
  }, [foldersLoaded, params.folder]);

  // Nested folder not loaded yet, or a deleted one
  const resolving = useRef<string | null>(null);
  useEffect(() => {
    const slug = params.folder;
    if (!foldersLoaded || !slug || folder || resolving.current === slug) return;
    resolving.current = slug;
    const fallback = () => navigate("/mail/inbox", { replace: true });
    if (WELL_KNOWN.includes(slug as WellKnownFolderName)) return fallback();
    const reveal = async (id: string, depth: number): Promise<void> => {
      const info = await getMailFolder(id);
      const parentId = info.parentFolderId;
      if (!parentId || depth > 10) throw new Error("not found");
      if (!findFolder(store.getState().mail.folders, parentId)) await reveal(parentId, depth + 1);
      await dispatch(loadChildFolders(parentId)).unwrap();
    };
    reveal(decodeURIComponent(slug), 0)
      .then(() => { if (!findFolder(store.getState().mail.folders, decodeURIComponent(slug))) fallback(); })
      .catch(fallback);
  }, [foldersLoaded, folder, params.folder]);

  // Navigated here with recipients, from contacts
  useEffect(() => {
    const state = location.state as { compose?: { to?: string; subject?: string } } | null;
    if (state?.compose) {
      dispatch(startCompose({ mode: "new", to: state.compose.to ? [{ emailAddress: { address: state.compose.to } }] : [], subject: state.compose.subject }));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  // Load the list for the current folder / search
  const effectiveFilter: MailFilter | undefined = folder?.wellKnownName === "inbox" && prefs.focusedInbox && !search ? focusedTab : undefined;
  const listFilter = useRef<MailFilter | undefined>();
  listFilter.current = list?.filter;
  useEffect(() => {
    if (!folder?.id && !search) return;
    // Turning Focused Inbox off must not keep the inbox on "focused"/"other"
    const filter = effectiveFilter ?? (isFocusFilter(listFilter.current) ? "all" : undefined);
    dispatch(loadMessages({ folderId: folder?.id, search: search || undefined, filter }));
  }, [folder?.id, search, effectiveFilter]);

  // The inbox is synced app-wide by useBackgroundMailSync
  const syncIds = useMemo(() => (!search && folder?.id && folder.id !== inboxId ? [folder.id] : []), [folder?.id, inboxId, search]);
  useEffect(() => {
    if (syncIds.length === 0) return;
    let last = 0;
    const run = () => {
      last = Date.now();
      syncIds.forEach(id => dispatch(syncFolder(id)));
    };
    // Hidden tabs sync slower so desktop notifications still arrive
    const tick = () => {
      if (document.visibilityState !== "visible" && Date.now() - last < HIDDEN_SYNC_INTERVAL) return;
      run();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") run(); };
    run();
    const timer = setInterval(tick, SYNC_INTERVAL);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncIds.join("|"), list?.loaded]);

  const selectedRowId = conversationMode ? findSelectedRow(rows, messageId, childSelected) : messageId;
  const selectedRow = useMemo(() => rows.find(r => r.id === selectedRowId), [rows, selectedRowId]);
  // The conversation pane marks its expanded messages itself
  const conversationPane = conversationMode && Boolean(selectedMessage?.conversationId);

  // Expansion is per folder view
  useEffect(() => {
    setExpanded(new Set());
    setChildSelected(false);
  }, [key]);

  // Only on selection change so "mark as unread" sticks
  useMarkAsRead(selectedMessage?.id && !conversationPane ? [selectedMessage.id] : [], selectedMessage?.id);

  const resetSearch = () => {
    setSearch("");
    setQuery("");
  };

  useGlobalSearch(t("Search mail"), q => {
    dispatch(clearSearchLists());
    setSearch(q);
  }, () => setSearch(""));

  const openMessage = useCallback((id: string, replace = false) => {
    if (folder) navigate(`/mail/${folderSlug(folder)}/${encodeURIComponent(id)}`, { replace });
  }, [folder, navigate]);


  const handleSelectFolder = useCallback((next: ExtendedMailFolder) => {
    dispatch(clearSelection());
    setSearch("");
    setQuery("");
    setFolderDrawer(false);
    navigate(`/mail/${folderSlug(next)}`);
  }, [navigate, setQuery]);

  // Refs keep the memoised list items stable
  const latest = useRef({ rows, selectedRowId, selection, folder, openMessage });
  latest.current = { rows, selectedRowId, selection, folder, openMessage };

  // Shift+click range select
  const selectRange = (rowId: string) => {
    const { rows, selectedRowId } = latest.current;
    const a = rows.findIndex(r => r.id === selectedRowId);
    const b = rows.findIndex(r => r.id === rowId);
    if (a === -1 || b === -1) return false;
    dispatch(setSelection(Array.from(new Set(rows.slice(Math.min(a, b), Math.max(a, b) + 1).flatMap(rowIds)))));
    return true;
  };

  const toggleIds = (ids: string[]) => {
    const { selection } = latest.current;
    const all = ids.every(id => selection.includes(id));
    dispatch(setSelection(all ? selection.filter(id => !ids.includes(id)) : Array.from(new Set([...selection, ...ids]))));
  };

  const handleSelectMessage = useCallback((message: Message, e: MouseEvent | KeyboardEvent) => {
    const { selection, folder, openMessage } = latest.current;
    if (e.ctrlKey || e.metaKey) {
      dispatch(toggleSelection(message.id!));
      return;
    }
    if (e.shiftKey && selectRange(message.id!)) return;
    if (selection.length) dispatch(clearSelection());
    if (message.isDraft && folder?.wellKnownName === "drafts") {
      dispatch(startCompose({ mode: "draft", originalId: message.id! }));
      return;
    }
    setChildSelected(true);
    openMessage(message.id!);
  }, []);

  const handleSelectConversation = useCallback((group: ConversationGroup, e: MouseEvent | KeyboardEvent) => {
    const { selection, openMessage } = latest.current;
    if (e.ctrlKey || e.metaKey) {
      toggleIds(group.ids);
      return;
    }
    if (e.shiftKey && selectRange(conversationRowId(group.id))) return;
    if (selection.length) dispatch(clearSelection());
    setChildSelected(false);
    openMessage(group.latest.id!);
  }, []);

  // Keyboard navigation replaces the history entry
  const handleNavigate = useCallback((row: ListRow) => {
    setChildSelected(row.kind === "message" && Boolean(row.nested));
    latest.current.openMessage(rowMessage(row).id!, true);
  }, []);

  const handleToggleExpand = useCallback((group: ConversationGroup) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(group.id)) next.delete(group.id);
    else next.add(group.id);
    return next;
  }), []);

  const handleCheck = useCallback((message: Message) => dispatch(toggleSelection(message.id!)), []);
  const handleCheckConversation = useCallback((group: ConversationGroup) => toggleIds(group.ids), []);
  const handleCheckAll = (checked: boolean) => dispatch(checked ? setSelection(messages.map(m => m.id!)) : clearSelection());

  const handleContextMenu = useCallback((message: Message, position: { top: number; left: number }) => {
    const { selection } = latest.current;
    const ids = selection.includes(message.id!) ? selection : [message.id!];
    setContextMenu({ position, ids });
  }, []);

  // The selection if it covers the conversation
  const conversationTargets = (group: ConversationGroup) => {
    const { selection } = latest.current;
    return group.ids.every(id => selection.includes(id)) ? selection : group.ids;
  };

  const handleConversationContextMenu = useCallback((group: ConversationGroup, position: { top: number; left: number }) => {
    setContextMenu({ position, ids: conversationTargets(group) });
  }, []);

  const handleConversationDragStart = useCallback((group: ConversationGroup, e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-message-ids", JSON.stringify(conversationTargets(group)));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleLoadMore = useCallback(() => dispatch(loadMoreMessages(key)), [key]);
  const handleRefresh = () => {
    dispatch(loadMessages({ folderId: folder?.id, search: search || undefined, force: true }));
    dispatch(loadFolders());
  };
  const handleFilter = (filter: MailFilter) => {
    dispatch(setListFilter({ key, filter }));
    dispatch(loadMessages({ folderId: folder?.id, filter, force: true }));
  };
  const handleSort = (sort: MailSort) => {
    dispatch(setListSort({ key, sort }));
    dispatch(loadMessages({ folderId: folder?.id, sort, force: true }));
  };

  const handleDragStart = useCallback((message: Message, e: React.DragEvent) => {
    const { selection } = latest.current;
    const ids = selection.includes(message.id!) ? selection : [message.id!];
    e.dataTransfer.setData("application/x-message-ids", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const targetIds = useMemo(() => selection.length ? selection :
    selectedRow?.kind === "conversation" ? selectedRow.group.ids :
      messageId ? [messageId] : [], [selection, messageId, selectedRow]);
  const actions = useMailActions(targetIds);
  // Reply and forward use the open message when a conversation is the target
  const replyIds = useMemo(() => selection.length ? selection : messageId ? [messageId] : [], [selection, messageId]);
  const replyActions = useMailActions(replyIds);

  // Hover actions act on that one message, not the selection
  const itemDelete = useCallback((m: Message) => dispatch(requestDelete([m.id!])), []);
  const itemArchive = useCallback((m: Message) => {
    const archive = findWellKnownFolder(store.getState().mail.folders, "archive");
    if (archive?.id) dispatch(moveMessages({ ids: [m.id!], destinationId: archive.id }));
    // t("This mailbox has no archive folder")
    else dispatch(pushAlertStack({ message: "This mailbox has no archive folder", severity: "warning" }));
  }, []);
  const itemToggleFlag = useCallback((m: Message) => dispatch(updateMessages({ ids: [m.id!], props: { flag: { flagStatus: m.flag?.flagStatus === "flagged" ? "notFlagged" : "flagged" } } })), []);
  const itemToggleRead = useCallback((m: Message) => dispatch(updateMessages({ ids: [m.id!], props: { isRead: !m.isRead } })), []);
  const itemTogglePin = useCallback((m: Message) => dispatch(togglePinned(m.id!)), []);

  // Hover actions of a conversation row act on all its messages in the folder
  const conversationAction = useCallback((group: ConversationGroup, action: ConversationAction) => {
    const ids = group.ids;
    switch (action) {
    case "delete": dispatch(requestDelete(ids)); break;
    case "archive": {
      const archive = findWellKnownFolder(store.getState().mail.folders, "archive");
      if (archive?.id) dispatch(moveMessages({ ids, destinationId: archive.id }));
      else dispatch(pushAlertStack({ message: "This mailbox has no archive folder", severity: "warning" }));
      break;
    }
    case "flag":
      dispatch(updateMessages({ ids, props: { flag: { flagStatus: group.flagged ? "notFlagged" : "flagged" } } }));
      break;
    case "read": {
      const isRead = group.unread > 0;
      const changed = group.messages.filter(m => Boolean(m.isRead) !== isRead).map(m => m.id!);
      if (changed.length) dispatch(updateMessages({ ids: changed, props: { isRead } }));
      break;
    }
    }
  }, []);

  // Deep link to a message outside the loaded page
  const prevIds = useRef<string[]>([]);
  useEffect(() => {
    if (!foldersLoaded || !messageId || selectedMessage || selectedError || prevIds.current.includes(messageId)) return;
    dispatch(loadMessageDetails(messageId));
  }, [foldersLoaded, messageId, Boolean(selectedMessage), selectedError]);

  // Move on once the current message disappears or fails to load
  useEffect(() => {
    if (messageId && list?.loaded && !messages.some(m => m.id === messageId) && !selectedMessage &&
      (prevIds.current.includes(messageId) || selectedError)) {
      const idx = prevIds.current.indexOf(messageId);
      const next = idx === -1 ? undefined : messages[Math.min(idx, messages.length - 1)];
      if (folder) navigate(`/mail/${folderSlug(folder)}${next ? "/" + encodeURIComponent(next.id!) : ""}`, { replace: true });
    }
    prevIds.current = messages.map(m => m.id!);
  }, [messages, messageId, selectedMessage, list?.loaded, selectedError]);

  const moveSelection = (delta: number) => {
    if (rows.length === 0) return;
    const idx = selectedRowId ? rows.findIndex(r => r.id === selectedRowId) : -1;
    const next = rows[Math.max(0, Math.min(rows.length - 1, idx + delta))];
    if (next) handleNavigate(next);
  };

  useKeyboardShortcuts([
    { key: "n", handler: () => dispatch(startCompose({ mode: "new" })) },
    { key: "r", handler: () => replyIds.length === 1 && replyActions.reply() },
    { key: "a", shift: true, handler: () => replyIds.length === 1 && replyActions.replyAll() },
    { key: "f", handler: () => replyIds.length === 1 && replyActions.forward() },
    { key: "Delete", handler: () => actions.remove() },
    { key: "Delete", shift: true, handler: () => actions.remove(true) },
    { key: "e", handler: () => actions.archive() },
    { key: "u", handler: () => actions.toggleRead() },
    { key: "i", handler: () => actions.toggleFlag() },
    { key: "j", handler: () => moveSelection(1) },
    { key: "k", handler: () => moveSelection(-1) },
    { key: "ArrowDown", handler: () => moveSelection(1) },
    { key: "ArrowUp", handler: () => moveSelection(-1) },
    { key: "a", ctrl: true, handler: () => handleCheckAll(true) },
    { key: "Escape", handler: () => { dispatch(clearSelection()); if (search) resetSearch(); } },
  ], !compose && !contextMenu && !more && !deleteConfirm);

  const paneOpen = Boolean(messageId || compose);
  const showFolderPane = prefs.folderPaneVisible && !isMobile;
  const showList = !isMobile || !paneOpen;
  const showPane = prefs.readingPane !== "off" ? (!isMobile || paneOpen) : paneOpen;
  const paneVertical = prefs.readingPane === "bottom" && !isMobile;

  const folderPane = <FolderPane selectedId={folder?.id} onSelect={handleSelectFolder} />;

  const readingPane = (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      {compose ? (
        <Compose fullscreen={composeFullscreen} onToggleFullscreen={() => setComposeFullscreen(!composeFullscreen)} />
      ) : selectedMessage && conversationPane ? (
        <ConversationView
          message={selectedMessage}
          currentFolderId={folder?.id || undefined}
          onMore={(anchor, id, html) => setMore({ anchor, id, bodyHtml: html })}
          onBack={isMobile || prefs.readingPane === "off" ? () => folder && navigate(`/mail/${folderSlug(folder)}`) : undefined}
          onBodyHtml={setBodyHtml}
        />
      ) : selectedMessage ? (
        <MessageView
          message={selectedMessage}
          onReply={replyActions.reply}
          onReplyAll={replyActions.replyAll}
          onForward={replyActions.forward}
          onMore={anchor => setMore({ anchor, id: selectedMessage.id! })}
          onBack={isMobile || prefs.readingPane === "off" ? () => folder && navigate(`/mail/${folderSlug(folder)}`) : undefined}
          onBodyHtml={setBodyHtml}
        />
      ) : messageId && selectedLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
      ) : (
        <EmptyState icon={<MailOutline />} title={t("Select an item to read")} description={t("Nothing is selected")} />
      )}
    </Box>
  );

  const deleteCount = deleteConfirm?.ids.length || 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <MailToolbar
        ids={targetIds}
        replyIds={replyIds}
        onNewMessage={() => dispatch(startCompose({ mode: "new" }))}
        onToggleFolders={() => isMobile ? setFolderDrawer(true) : dispatch(updatePrefs({ folderPaneVisible: !prefs.folderPaneVisible }))}
        bodyHtml={bodyHtml}
      />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {showFolderPane && (
          <Box component="nav" aria-label={t("Folders")} sx={{ width: prefs.folderPaneWidth, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            {folderPane}
          </Box>
        )}
        {isMobile && (
          <Drawer open={folderDrawer} onClose={() => setFolderDrawer(false)} PaperProps={{ sx: { width: 280 } }}>
            <Box component="nav" aria-label={t("Folders")} sx={{ height: "100%" }}>{folderPane}</Box>
          </Drawer>
        )}
        {compose && composeFullscreen ? readingPane : (
          <Box sx={{ display: "flex", flex: 1, minWidth: 0, flexDirection: paneVertical ? "column" : "row" }}>
            {showList && (
              <Box sx={{
                width: paneVertical || isMobile || prefs.readingPane === "off" && !paneOpen ? "100%" : prefs.listWidth,
                height: paneVertical ? "45%" : "100%",
                flexShrink: 0,
                borderRight: paneVertical ? 0 : 1,
                borderBottom: paneVertical ? 1 : 0,
                borderColor: "divider",
                bgcolor: "background.paper",
                // Without a reading pane an open message or compose takes the whole width
                display: prefs.readingPane === "off" && paneOpen && !isMobile ? "none" : "block",
              }}>
                <MessageList
                  folder={folder}
                  list={list}
                  messages={messages}
                  rows={rows}
                  selectedRowId={selectedRowId}
                  expanded={expanded}
                  selection={selection}
                  pinned={pinned}
                  isSearch={Boolean(search)}
                  focusedTab={focusedTab}
                  onFocusedTab={setFocusedTab}
                  onSelect={handleSelectMessage}
                  onNavigate={handleNavigate}
                  onCheck={handleCheck}
                  onCheckAll={handleCheckAll}
                  onContextMenu={handleContextMenu}
                  onLoadMore={handleLoadMore}
                  onRefresh={handleRefresh}
                  onFilter={handleFilter}
                  onSort={handleSort}
                  onDelete={itemDelete}
                  onArchive={itemArchive}
                  onToggleFlag={itemToggleFlag}
                  onToggleRead={itemToggleRead}
                  onTogglePin={itemTogglePin}
                  onDragStart={handleDragStart}
                  onToggleExpand={handleToggleExpand}
                  onSelectConversation={handleSelectConversation}
                  onCheckConversation={handleCheckConversation}
                  onConversationContextMenu={handleConversationContextMenu}
                  onConversationAction={conversationAction}
                  onConversationDragStart={handleConversationDragStart}
                />
              </Box>
            )}
            {showPane && readingPane}
          </Box>
        )}
      </Box>
      <MessageActionsMenu
        ids={contextMenu?.ids || []}
        anchorPosition={contextMenu?.position}
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        bodyHtml={contextMenu?.ids.length === 1 && contextMenu.ids[0] === messageId ? bodyHtml : undefined}
      />
      <MessageActionsMenu
        ids={more ? [more.id] : []}
        anchorEl={more?.anchor}
        open={Boolean(more)}
        onClose={() => setMore(null)}
        bodyHtml={more?.bodyHtml ?? bodyHtml}
        compact
      />
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.hard ? t("Delete permanently?") : t("Delete messages?")}
        description={deleteConfirm?.hard ?
          t("{{count}} messages will be deleted permanently", { count: deleteCount }) + " " + t("This cannot be undone.") :
          t("{{count}} messages will be moved to Deleted Items", { count: deleteCount })}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={() => deleteConfirm && dispatch(deleteMessages({ ids: deleteConfirm.ids, permanent: deleteConfirm.permanent }))}
        onClose={() => dispatch(deleteConfirmClosed())}
      />
    </Box>
  );
};

export default MailView;
