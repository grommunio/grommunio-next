// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, CircularProgress, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Skeleton, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { ArrowDownward, ArrowUpward, Check, FilterList, Refresh, SwapVert, InboxOutlined, SearchOff } from "@mui/icons-material";
import { Fragment, KeyboardEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "microsoft-graph";
import type { ExtendedMailFolder } from "../../../types/messages";
import type { MailFilter, MailSort, MailSortField, MessageList as MessageListState } from "../types";
import MessageListItem from "./MessageListItem";
import ConversationListItem, { ConversationAction } from "./ConversationListItem";
import EmptyState from "../../../components/common/EmptyState";
import { dateGroup, DateGroup } from "../utils";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { canSortBy, updatePrefs } from "../mailSlice";
import { ConversationGroup, conversationViewApplies, ListRow } from "../conversations";

type MessageListProps = {
  folder?: ExtendedMailFolder;
  list?: MessageListState;
  messages: Message[];
  rows: ListRow[];
  selectedRowId?: string;
  expanded: ReadonlySet<string>;
  selection: string[];
  pinned: string[];
  isSearch: boolean;
  focusedTab?: "focused" | "other";
  onFocusedTab?: (tab: "focused" | "other") => void;
  onSelect: (message: Message, e: MouseEvent | KeyboardEvent) => void;
  onNavigate: (row: ListRow) => void;
  onCheck: (message: Message) => void;
  onCheckAll: (checked: boolean) => void;
  onContextMenu: (message: Message, position: { top: number; left: number }) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onFilter: (filter: MailFilter) => void;
  onSort: (sort: MailSort) => void;
  onDelete: (message: Message) => void;
  onArchive: (message: Message) => void;
  onToggleFlag: (message: Message) => void;
  onToggleRead: (message: Message) => void;
  onTogglePin: (message: Message) => void;
  onDragStart: (message: Message, e: React.DragEvent) => void;
  onToggleExpand: (group: ConversationGroup) => void;
  onSelectConversation: (group: ConversationGroup, e: MouseEvent | KeyboardEvent) => void;
  onCheckConversation: (group: ConversationGroup) => void;
  onConversationContextMenu: (group: ConversationGroup, position: { top: number; left: number }) => void;
  onConversationAction: (group: ConversationGroup, action: ConversationAction) => void;
  onConversationDragStart: (group: ConversationGroup, e: React.DragEvent) => void;
};

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("All")
// t("Unread")
// t("Flagged")
// t("To me")
// t("Has attachments")
// t("Date")
// t("From")
// t("Subject")
// t("Importance")
// t("Attachments")
const FILTERS: Array<{ value: MailFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "flagged", label: "Flagged" },
  { value: "tome", label: "To me" },
  { value: "attachments", label: "Has attachments" },
];

const SORTS: Array<{ value: MailSortField; label: string }> = [
  { value: "receivedDateTime", label: "Date" },
  { value: "from", label: "From" },
  { value: "subject", label: "Subject" },
  { value: "importance", label: "Importance" },
  { value: "hasAttachments", label: "Attachments" },
];

const MessageList = ({
  folder, list, messages, rows, selectedRowId, expanded, selection, pinned, isSearch, focusedTab, onFocusedTab,
  onSelect, onNavigate, onCheck, onCheckAll, onContextMenu, onLoadMore, onRefresh, onFilter, onSort,
  onDelete, onArchive, onToggleFlag, onToggleRead, onTogglePin, onDragStart,
  onToggleExpand, onSelectConversation, onCheckConversation, onConversationContextMenu, onConversationAction, onConversationDragStart,
}: MessageListProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const prefs = useTypeSelector(state => state.mail.prefs);
  const categories = useTypeSelector(state => state.mail.categories);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filter = list?.filter || "all";
  const sort = list?.sort || { field: "receivedDateTime", direction: "desc" };
  // Graph cannot combine other sorts with a filter or the Focused Inbox tab
  const sortable = (field: MailSortField) => !list || canSortBy(list, field);
  const selectionMode = selection.length > 0;
  const allChecked = messages.length > 0 && selection.length === messages.length;
  const showRecipients = folder?.wellKnownName === "sentitems" || folder?.wellKnownName === "drafts" || folder?.wellKnownName === "outbox";
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  const selectionSet = useMemo(() => new Set(selection), [selection]);
  const canGroup = conversationViewApplies(true, folder?.wellKnownName, isSearch);

  // Infinite scroll. Re-observe after each load, the sentinel may never leave the viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !list?.loaded || list.loading || list.loadingMore || !list.nextLink) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) onLoadMore();
    }, { root: scrollRef.current, rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, list?.key, list?.loaded, list?.loading, list?.loadingMore, list?.nextLink, messages.length]);

  // Keep focus on the open row when it changes
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !selectedRowId || !root.contains(document.activeElement)) return;
    const option = Array.from(root.querySelectorAll<HTMLElement>("[role='option']")).find(el => el.dataset.rowId === selectedRowId);
    if (option && document.activeElement !== option && !option.contains(document.activeElement)) option.focus();
  }, [selectedRowId]);

  const handleItemContextMenu = useCallback((message: Message, e: MouseEvent) => {
    e.preventDefault();
    // The context menu key reports no pointer position
    if (e.clientX === 0 && e.clientY === 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onContextMenu(message, { top: rect.top + rect.height / 2, left: rect.left + 48 });
    } else {
      onContextMenu(message, { top: e.clientY, left: e.clientX });
    }
  }, [onContextMenu]);

  const handleConversationContextMenu = useCallback((group: ConversationGroup, e: MouseEvent) => {
    e.preventDefault();
    if (e.clientX === 0 && e.clientY === 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onConversationContextMenu(group, { top: rect.top + rect.height / 2, left: rect.left + 48 });
    } else {
      onConversationContextMenu(group, { top: e.clientY, left: e.clientX });
    }
  }, [onConversationContextMenu]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute("role") !== "option" || rows.length === 0) return;
    const index = rows.findIndex(r => r.id === target.dataset.rowId);
    const current = rows[index];
    if (!current) return;
    let next: ListRow | undefined;
    switch (e.key) {
    case "ArrowDown": next = rows[Math.min(rows.length - 1, index + 1)]; break;
    case "ArrowUp": next = rows[Math.max(0, index - 1)]; break;
    case "Home": next = rows[0]; break;
    case "End": next = rows[rows.length - 1]; break;
    case "ArrowRight":
      if (current.kind !== "conversation") return;
      if (!expanded.has(current.group.id)) {
        onToggleExpand(current.group);
        e.preventDefault();
        return;
      }
      next = rows[index + 1];
      break;
    case "ArrowLeft":
      if (current.kind === "conversation") {
        if (expanded.has(current.group.id)) onToggleExpand(current.group);
        e.preventDefault();
        return;
      }
      if (!current.nested) return;
      next = rows.find(r => r.kind === "conversation" && r.group === current.group);
      break;
    case "Enter":
      if (current.kind === "conversation") onSelectConversation(current.group, e);
      else onSelect(current.message, e);
      e.preventDefault();
      return;
    case " ":
      if (current.kind === "conversation") onCheckConversation(current.group);
      else onCheck(current.message);
      e.preventDefault();
      return;
    case "ContextMenu":
    case "F10": {
      if (e.key === "F10" && !e.shiftKey) return;
      const rect = target.getBoundingClientRect();
      const position = { top: rect.top + rect.height / 2, left: rect.left + 48 };
      if (current.kind === "conversation") onConversationContextMenu(current.group, position);
      else onContextMenu(current.message, position);
      e.preventDefault();
      return;
    }
    default:
      return;
    }
    e.preventDefault();
    if (next && next !== current) {
      onNavigate(next);
      root().querySelector<HTMLElement>(`[data-row-id="${CSS.escape(next.id)}"]`)?.focus();
    }
  };
  const root = () => scrollRef.current as HTMLDivElement;
  // Roving tab stop
  const tabStopId = selectedRowId && rows.some(r => r.id === selectedRowId) ? selectedRowId : rows[0]?.id;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [list?.key, filter, sort.field, sort.direction]);

  const groupByDate = sort.field === "receivedDateTime" && !isSearch;
  let lastGroup: DateGroup | null = null;

  const loading = list?.loading && messages.length === 0;

  return (
    <Box component="section" role="region" sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }} aria-label={t("Message list")}>
      <Box sx={{ display: "flex", alignItems: "center", px: 1, minHeight: 44, borderBottom: 1, borderColor: "divider", gap: 0.5 }}>
        <Checkbox
          size="small"
          checked={allChecked}
          indeterminate={selectionMode && !allChecked}
          onChange={e => onCheckAll(e.target.checked)}
          sx={{ p: 0.5 }}
          inputProps={{ "aria-label": t("Select all") }}
        />
        {folder?.wellKnownName === "inbox" && prefs.focusedInbox && onFocusedTab && !isSearch ? (
          <Tabs value={focusedTab || "focused"} onChange={(_e, v) => onFocusedTab(v)} sx={{ minHeight: 36, flex: 1 }} TabIndicatorProps={{ sx: { height: 2 } }}>
            <Tab value="focused" label={t("Focused")} sx={{ minHeight: 36, py: 0 }} />
            <Tab value="other" label={t("Other")} sx={{ minHeight: 36, py: 0 }} />
          </Tabs>
        ) : (
          <Typography variant="subtitle2" noWrap sx={{ flex: 1, px: 0.5 }}>
            {isSearch ? t("Search results") : selectionMode ? t("{{count}} selected", { count: selection.length }) : ""}
            {!isSearch && !selectionMode && list?.total !== undefined && filter === "all" && (
              <Typography component="span" variant="caption" color="text.secondary">{list.total}</Typography>
            )}
          </Typography>
        )}
        <Tooltip title={t("Refresh")}>
          <IconButton size="small" onClick={onRefresh} aria-label={t("Refresh")}><Refresh fontSize="small" /></IconButton>
        </Tooltip>
        {!isSearch && <>
          <Tooltip title={t("Filter")}>
            <Button size="small" color={filter === "all" ? "inherit" : "primary"} startIcon={<FilterList />} onClick={e => setFilterAnchor(e.currentTarget)} sx={{ minWidth: 0, px: 1, textTransform: "none" }}>
              {t(FILTERS.find(f => f.value === filter)?.label || "Filter")}
            </Button>
          </Tooltip>
          <Tooltip title={t("Sort")}>
            <IconButton size="small" onClick={e => setSortAnchor(e.currentTarget)} aria-label={t("Sort")}><SwapVert fontSize="small" /></IconButton>
          </Tooltip>
        </>}
      </Box>

      <Box ref={scrollRef} role="listbox" aria-multiselectable aria-label={t("Messages")} onKeyDown={handleKeyDown} sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1, p: 1, borderBottom: 1, borderColor: "divider" }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" /><Skeleton width="90%" /><Skeleton width="40%" />
            </Box>
          </Box>
        ))}
        {!loading && list?.error && (
          <EmptyState title={t("Messages could not be loaded")} description={list.error} action={<Button onClick={onRefresh}>{t("Try again")}</Button>} />
        )}
        {!loading && !list?.error && list?.loaded && messages.length === 0 && (
          isSearch ?
            <EmptyState icon={<SearchOff />} title={t("No results")} description={t("No messages match your search.")} /> :
            <EmptyState icon={<InboxOutlined />} title={filter === "all" ? t("Nothing here") : t("No messages match this filter")} description={filter === "all" ? t("This folder is empty.") : undefined} />
        )}
        {!loading && rows.map(row => {
          const nested = row.kind === "message" && row.nested;
          const shown = row.kind === "conversation" ? row.group.latest : row.message;
          const isPinned = row.kind === "conversation" ? row.group.pinned : pinnedSet.has(row.id);
          let header: DateGroup | null = null;
          if (groupByDate && !nested) {
            const group: DateGroup = isPinned ? "Pinned" : dateGroup(shown.receivedDateTime || shown.sentDateTime || shown.lastModifiedDateTime);
            if (group !== lastGroup) {
              header = group;
              lastGroup = group;
            }
          }
          return (
            <Fragment key={row.id}>
              {header && (
                <Typography variant="caption" role="presentation" sx={{ display: "block", px: 1.5, py: 0.5, fontWeight: 600, color: "text.secondary", bgcolor: "background.default", position: "sticky", top: 0, zIndex: 1 }}>
                  {t(header)}
                </Typography>
              )}
              {row.kind === "conversation" ? (
                <ConversationListItem
                  group={row.group}
                  selected={row.id === selectedRowId}
                  tabStop={row.id === tabStopId}
                  checked={row.group.ids.every(id => selectionSet.has(id))}
                  selectionMode={selectionMode}
                  expanded={expanded.has(row.group.id)}
                  compact={prefs.density === "compact"}
                  showAvatar={prefs.showAvatars}
                  showPreview={prefs.showPreview}
                  categories={categories}
                  onClick={onSelectConversation}
                  onToggleExpand={onToggleExpand}
                  onCheck={onCheckConversation}
                  onContextMenu={handleConversationContextMenu}
                  onAction={onConversationAction}
                  onDragStart={onConversationDragStart}
                />
              ) : (
                <MessageListItem
                  message={row.message}
                  selected={row.id === selectedRowId}
                  tabStop={row.id === tabStopId}
                  checked={selectionSet.has(row.id)}
                  selectionMode={selectionMode}
                  pinned={isPinned}
                  compact={prefs.density === "compact"}
                  showAvatar={prefs.showAvatars && !nested}
                  showPreview={prefs.showPreview}
                  showRecipients={showRecipients}
                  categories={categories}
                  nested={nested}
                  onClick={onSelect}
                  onCheck={onCheck}
                  onContextMenu={handleItemContextMenu}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  onToggleFlag={onToggleFlag}
                  onToggleRead={onToggleRead}
                  onTogglePin={onTogglePin}
                  onDragStart={onDragStart}
                />
              )}
            </Fragment>
          );
        })}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {list?.loadingMore && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}><CircularProgress size={20} /></Box>
        )}
        {list?.loaded && !list.nextLink && messages.length > 0 && (
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "text.secondary", py: 2 }}>
            {t("End of list")}
          </Typography>
        )}
      </Box>

      <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
        {FILTERS.map(f => (
          <MenuItem key={f.value} selected={filter === f.value} onClick={() => { onFilter(f.value); setFilterAnchor(null); }}>
            <ListItemIcon>{filter === f.value && <Check fontSize="small" />}</ListItemIcon>
            <ListItemText>{t(f.label)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
        {SORTS.map(s => (
          <MenuItem
            key={s.value}
            selected={sort.field === s.value}
            disabled={!sortable(s.value)}
            onClick={() => { onSort({ field: s.value, direction: s.value === "receivedDateTime" ? "desc" : "asc" }); setSortAnchor(null); }}
          >
            <ListItemIcon>{sort.field === s.value && <Check fontSize="small" />}</ListItemIcon>
            <ListItemText>{t(s.label)}</ListItemText>
          </MenuItem>
        ))}
        {!sortable("from") && (
          <Typography variant="caption" component="li" sx={{ display: "block", px: 2, py: 0.5, maxWidth: 240, color: "text.secondary" }}>
            {t("Filtered lists can only be sorted by date")}
          </Typography>
        )}
        <Divider />
        <MenuItem onClick={() => { onSort({ ...sort, direction: sort.direction === "asc" ? "desc" : "asc" }); setSortAnchor(null); }}>
          <ListItemIcon>{sort.direction === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}</ListItemIcon>
          <ListItemText>{sort.direction === "asc" ? t("Ascending") : t("Descending")}</ListItemText>
        </MenuItem>
        {canGroup && <Divider />}
        {canGroup && (
          <MenuItem onClick={() => { dispatch(updatePrefs({ conversationView: !prefs.conversationView })); setSortAnchor(null); }}>
            <ListItemIcon>{prefs.conversationView && <Check fontSize="small" />}</ListItemIcon>
            <ListItemText>{t("Group messages by conversation")}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageList;
