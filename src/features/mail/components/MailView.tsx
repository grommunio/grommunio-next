// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MailOutline } from "@mui/icons-material";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Message } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import EmptyState from "../../../components/common/EmptyState";
import FolderPane from "./FolderPane";
import MessageList from "./MessageList";
import MessageView from "./MessageView";
import Compose from "./Compose";
import MailToolbar from "./MailToolbar";
import MessageActionsMenu from "./MessageActionsMenu";
import useMailActions from "../useMailActions";
import useMailNotifications from "../useMailNotifications";
import { makeSelectListMessages } from "../selectors";
import {
  clearSearchLists, clearSelection, deleteMessages, findFolder, findWellKnownFolder, listKey, loadCategories, loadFolders,
  loadMessages, loadMoreMessages, moveMessages, setListFilter, setListSort, setSelection, startCompose, syncFolder,
  toggleSelection, togglePinned, updateMessages, updatePrefs,
} from "../mailSlice";
import { pushAlertStack } from "../../../features/alerts/alertsSlice";
import type { MailFilter, MailSort } from "../types";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../../types/messages";

const SYNC_INTERVAL = 30000;
const FOLDER_REFRESH_INTERVAL = 120000;

const WELL_KNOWN: WellKnownFolderName[] = ["inbox", "drafts", "sentitems", "deleteditems", "junkemail", "archive", "outbox"];

// Well-known name where possible, id otherwise
export function folderSlug(folder: ExtendedMailFolder): string {
  return folder.wellKnownName !== "custom" ? folder.wellKnownName : encodeURIComponent(folder.id || "");
}

const MailView = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ folder?: string; messageId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { folders, foldersLoaded, prefs, selection, pinned, compose, lists } = useTypeSelector(state => state.mail);
  const [search, setSearch] = useState("");
  const [focusedTab, setFocusedTab] = useState<"focused" | "other">("focused");
  const [contextMenu, setContextMenu] = useState<{ position: { top: number; left: number }; ids: string[] } | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [bodyHtml, setBodyHtml] = useState("");
  const [composeFullscreen, setComposeFullscreen] = useState(false);
  const readTimer = useRef<ReturnType<typeof setTimeout>>();

  const folder = useMemo(() => {
    const slug = params.folder;
    if (!slug) return undefined;
    if (WELL_KNOWN.includes(slug as WellKnownFolderName)) return folders.find(f => f.wellKnownName === slug);
    return findFolder(folders, decodeURIComponent(slug));
  }, [folders, params.folder]);

  const messageId = params.messageId ? decodeURIComponent(params.messageId) : undefined;
  const key = listKey(folder?.id, search || undefined);
  const list = lists[key];
  const selectListMessages = useMemo(() => makeSelectListMessages(key), [key]);
  const messages = useTypeSelector(selectListMessages);
  const selectedMessage = useTypeSelector(state => messageId ? state.mail.messages[messageId] : undefined);

  useEffect(() => {
    dispatch(loadFolders());
    dispatch(loadCategories());
  }, []);

  useEffect(() => {
    if (foldersLoaded && !params.folder) {
      navigate("/mail/inbox", { replace: true });
    }
  }, [foldersLoaded, params.folder]);

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
  useEffect(() => {
    if (!folder?.id && !search) return;
    dispatch(loadMessages({ folderId: folder?.id, search: search || undefined, filter: effectiveFilter }));
  }, [folder?.id, search, effectiveFilter]);

  // Periodic sync of the open folder and refresh of folder counts
  useEffect(() => {
    if (!folder?.id || search) return;
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      dispatch(syncFolder(folder.id!));
    };
    sync();
    const syncTimer = setInterval(sync, SYNC_INTERVAL);
    const folderTimer = setInterval(() => document.visibilityState === "visible" && dispatch(loadFolders()), FOLDER_REFRESH_INTERVAL);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(syncTimer);
      clearInterval(folderTimer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [folder?.id, search, list?.loaded]);

  // Mark as read when a message is opened
  useEffect(() => {
    clearTimeout(readTimer.current);
    if (!selectedMessage || selectedMessage.isRead || prefs.markAsRead === "never") return;
    const mark = () => dispatch(updateMessages({ ids: [selectedMessage.id!], props: { isRead: true } }));
    if (prefs.markAsRead === "onSelect") mark();
    else readTimer.current = setTimeout(mark, prefs.markAsReadDelay * 1000);
    return () => clearTimeout(readTimer.current);
  }, [selectedMessage?.id, selectedMessage?.isRead]);

  useGlobalSearch(t("Search mail"), q => {
    dispatch(clearSearchLists());
    setSearch(q);
  }, () => setSearch(""));

  const openMessage = useCallback((id: string) => {
    if (folder) navigate(`/mail/${folderSlug(folder)}/${encodeURIComponent(id)}`);
  }, [folder, navigate]);

  useMailNotifications(openMessage);

  const handleSelectFolder = (next: ExtendedMailFolder) => {
    dispatch(clearSelection());
    setSearch("");
    navigate(`/mail/${folderSlug(next)}`);
  };

  const handleSelectMessage = (message: Message, e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      dispatch(toggleSelection(message.id!));
      return;
    }
    if (e.shiftKey && messageId) {
      const ids = messages.map(m => m.id!);
      const a = ids.indexOf(messageId);
      const b = ids.indexOf(message.id!);
      if (a !== -1 && b !== -1) {
        dispatch(setSelection(ids.slice(Math.min(a, b), Math.max(a, b) + 1)));
        return;
      }
    }
    if (selection.length) dispatch(clearSelection());
    if (message.isDraft && folder?.wellKnownName === "drafts") {
      dispatch(startCompose({ mode: "draft", originalId: message.id! }));
      return;
    }
    openMessage(message.id!);
  };

  const handleCheck = (message: Message) => dispatch(toggleSelection(message.id!));
  const handleCheckAll = (checked: boolean) => dispatch(checked ? setSelection(messages.map(m => m.id!)) : clearSelection());

  const handleContextMenu = (message: Message, e: MouseEvent) => {
    e.preventDefault();
    const ids = selection.includes(message.id!) ? selection : [message.id!];
    setContextMenu({ position: { top: e.clientY, left: e.clientX }, ids });
  };

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

  const handleDragStart = (message: Message, e: React.DragEvent) => {
    const ids = selection.includes(message.id!) ? selection : [message.id!];
    e.dataTransfer.setData("application/x-message-ids", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };

  // Actions for the current target: the checked messages or the open one
  const targetIds = useMemo(() => selection.length ? selection : messageId ? [messageId] : [], [selection, messageId]);
  const actions = useMailActions(targetIds);

  // Hover actions act on that one message, not the selection
  const itemDelete = (m: Message) => dispatch(deleteMessages({ ids: [m.id!] }));
  const itemArchive = (m: Message) => {
    const archive = findWellKnownFolder(folders, "archive");
    if (archive?.id) dispatch(moveMessages({ ids: [m.id!], destinationId: archive.id }));
    else dispatch(pushAlertStack({ message: t("This mailbox has no archive folder"), severity: "warning" }));
  };
  const itemToggleFlag = (m: Message) => dispatch(updateMessages({ ids: [m.id!], props: { flag: { flagStatus: m.flag?.flagStatus === "flagged" ? "notFlagged" : "flagged" } } }));
  const itemToggleRead = (m: Message) => dispatch(updateMessages({ ids: [m.id!], props: { isRead: !m.isRead } }));

  // Move to the next message after the current one disappears
  const prevIds = useRef<string[]>([]);
  useEffect(() => {
    if (messageId && list?.loaded && !messages.some(m => m.id === messageId) && !selectedMessage) {
      const idx = prevIds.current.indexOf(messageId);
      const next = messages[Math.min(idx, messages.length - 1)];
      if (folder) navigate(`/mail/${folderSlug(folder)}${next ? "/" + encodeURIComponent(next.id!) : ""}`, { replace: true });
    }
    prevIds.current = messages.map(m => m.id!);
  }, [messages, messageId, selectedMessage, list?.loaded]);

  const moveSelection = (delta: number) => {
    if (messages.length === 0) return;
    const idx = messageId ? messages.findIndex(m => m.id === messageId) : -1;
    const next = messages[Math.max(0, Math.min(messages.length - 1, idx + delta))];
    if (next) openMessage(next.id!);
  };

  useKeyboardShortcuts([
    { key: "n", handler: () => dispatch(startCompose({ mode: "new" })) },
    { key: "r", handler: () => targetIds.length === 1 && actions.reply() },
    { key: "a", shift: true, handler: () => targetIds.length === 1 && actions.replyAll() },
    { key: "f", handler: () => targetIds.length === 1 && actions.forward() },
    { key: "Delete", handler: () => actions.remove() },
    { key: "e", handler: () => actions.archive() },
    { key: "u", handler: () => actions.toggleRead() },
    { key: "i", handler: () => actions.toggleFlag() },
    { key: "j", handler: () => moveSelection(1) },
    { key: "k", handler: () => moveSelection(-1) },
    { key: "ArrowDown", handler: () => moveSelection(1) },
    { key: "ArrowUp", handler: () => moveSelection(-1) },
    { key: "a", ctrl: true, handler: () => handleCheckAll(true) },
    { key: "Escape", handler: () => { dispatch(clearSelection()); if (search) setSearch(""); } },
  ], !compose);

  const showFolderPane = prefs.folderPaneVisible && !isMobile;
  const showList = !isMobile || (!messageId && !compose);
  const showPane = prefs.readingPane !== "off" ? (!isMobile || messageId || compose) : (messageId || compose);
  const paneVertical = prefs.readingPane === "bottom" && !isMobile;

  const readingPane = (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      {compose ? (
        <Compose fullscreen={composeFullscreen} onToggleFullscreen={() => setComposeFullscreen(!composeFullscreen)} />
      ) : selectedMessage ? (
        <MessageView
          message={selectedMessage}
          onReply={actions.reply}
          onReplyAll={actions.replyAll}
          onForward={actions.forward}
          onMore={anchor => setMoreAnchor(anchor)}
          onBack={isMobile || prefs.readingPane === "off" ? () => folder && navigate(`/mail/${folderSlug(folder)}`) : undefined}
          onBodyHtml={setBodyHtml}
        />
      ) : (
        <EmptyState icon={<MailOutline />} title={t("Select an item to read")} description={t("Nothing is selected")} />
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <MailToolbar
        ids={targetIds}
        onNewMessage={() => dispatch(startCompose({ mode: "new" }))}
        onToggleFolders={() => dispatch(updatePrefs({ folderPaneVisible: !prefs.folderPaneVisible }))}
        bodyHtml={bodyHtml}
      />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {showFolderPane && (
          <Box sx={{ width: prefs.folderPaneWidth, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <FolderPane selectedId={folder?.id} onSelect={handleSelectFolder} />
          </Box>
        )}
        {compose && composeFullscreen ? readingPane : (
          <Box sx={{ display: "flex", flex: 1, minWidth: 0, flexDirection: paneVertical ? "column" : "row" }}>
            {showList && (
              <Box sx={{
                width: paneVertical || isMobile || prefs.readingPane === "off" && !messageId ? "100%" : prefs.listWidth,
                height: paneVertical ? "45%" : "100%",
                flexShrink: 0,
                borderRight: paneVertical ? 0 : 1,
                borderBottom: paneVertical ? 1 : 0,
                borderColor: "divider",
                bgcolor: "background.paper",
                display: prefs.readingPane === "off" && messageId && !isMobile ? "none" : "block",
              }}>
                <MessageList
                  folder={folder}
                  list={list}
                  messages={messages}
                  selectedId={messageId}
                  selection={selection}
                  pinned={pinned}
                  isSearch={Boolean(search)}
                  focusedTab={focusedTab}
                  onFocusedTab={setFocusedTab}
                  onSelect={handleSelectMessage}
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
                  onTogglePin={m => dispatch(togglePinned(m.id!))}
                  onDragStart={handleDragStart}
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
        ids={messageId ? [messageId] : []}
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        bodyHtml={bodyHtml}
        compact
      />
    </Box>
  );
};

export default MailView;
