// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "microsoft-graph";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { MessageContent, MessageHeader, MessageSubject } from "./MessageView";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { findFolder, loadConversation, startCompose } from "../mailSlice";
import { makeSelectConversationMessages } from "../selectors";
import { newlyExpanded, sortConversationMessages } from "../conversations";
import { formatListDate, previewText, senderAddress, senderName } from "../utils";
import useMarkAsRead from "../useMarkAsRead";

type ConversationViewProps = {
  message: Message;
  currentFolderId?: string;
  onBack?: () => void;
  onMore: (anchor: HTMLElement, id: string, bodyHtml?: string) => void;
  // For printing
  onBodyHtml: (html: string) => void;
};

const EMPTY = new Set<string>();

// t("{{count}} messages in this conversation_one")
// t("{{count}} messages in this conversation_other")

const ConversationView = ({ message, currentFolderId, onBack, onMore, onBodyHtml }: ConversationViewProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const conversationId = message.conversationId!;
  const order = useTypeSelector(state => state.mail.prefs.conversationOrder);
  const folders = useTypeSelector(state => state.mail.folders);
  const loadState = useTypeSelector(state => state.mail.conversations[conversationId]);
  const selectMessages = useMemo(() => makeSelectConversationMessages(conversationId, currentFolderId), [conversationId, currentFolderId]);
  const found = useTypeSelector(selectMessages);
  const messages = useMemo(() => {
    const all = found.some(m => m.id === message.id) ? found : [...found, message];
    return sortConversationMessages(all, order);
  }, [found, message, order]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const bodies = useRef<Record<string, string>>({});
  const seen = useRef<{ conversationId?: string; ids: Set<string> }>({ ids: new Set() });
  const [expandedState, setExpandedState] = useState<{ conversationId?: string; ids: Set<string> }>({ ids: new Set() });
  const expanded = expandedState.conversationId === conversationId ? expandedState.ids : EMPTY;

  useEffect(() => {
    if (!loadState?.loaded && !loadState?.loading) dispatch(loadConversation(conversationId));
  }, [conversationId, loadState?.loaded]);

  // Expand the newest, unread and opened messages when they first show up
  const idsKey = messages.map(m => m.id).join("|");
  useEffect(() => {
    if (seen.current.conversationId !== conversationId) seen.current = { conversationId, ids: new Set() };
    const add = newlyExpanded(messages, seen.current.ids, message.id!);
    messages.forEach(m => seen.current.ids.add(m.id!));
    if (add.length) {
      setExpandedState(prev => ({ conversationId, ids: new Set([...(prev.conversationId === conversationId ? prev.ids : []), ...add]) }));
    }
  }, [conversationId, idsKey]);

  // Opening another message of the conversation expands it and scrolls to it
  useEffect(() => {
    setExpandedState(prev => prev.conversationId === conversationId && prev.ids.has(message.id!) ? prev :
      { conversationId, ids: new Set([...(prev.conversationId === conversationId ? prev.ids : []), message.id!]) });
    const frame = requestAnimationFrame(() => {
      const item = itemRefs.current[message.id!];
      const root = scrollRef.current;
      if (!item || !root) return;
      // The first item sits below the subject: keep that visible
      if (messages[0]?.id === message.id) root.scrollTo({ top: 0 });
      else item.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [conversationId, message.id]);

  const expandedIds = useMemo(() => messages.filter(m => expanded.has(m.id!)).map(m => m.id!), [messages, expanded]);
  useMarkAsRead(expandedIds, conversationId);

  const toggle = (id: string) => setExpandedState(prev => {
    const ids = new Set(prev.conversationId === conversationId ? prev.ids : []);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    return { conversationId, ids };
  });

  const onKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggle(id);
  };

  const handleBody = (id: string) => (html: string) => {
    bodies.current[id] = html;
    if (id === message.id) onBodyHtml(html);
  };

  const folderName = (m: Message) => m.parentFolderId && m.parentFolderId !== currentFolderId ?
    findFolder(folders, m.parentFolderId)?.displayName : undefined;

  return (
    <Box ref={scrollRef} component="section" role="region" sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} aria-label={t("Reading pane")}>
      {loadState?.loading && <LinearProgress sx={{ position: "sticky", top: 0, zIndex: 1, height: 2 }} />}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 1 }}>
        <MessageSubject message={message} onBack={onBack} />
        {messages.length > 1 && (
          <Typography variant="caption" color="text.secondary">
            {t("{{count}} messages in this conversation", { count: messages.length })}
          </Typography>
        )}
      </Box>
      {loadState?.error && (
        <Alert severity="warning" sx={{ mx: { xs: 2, md: 3 }, mb: 1 }} action={<Button color="inherit" size="small" onClick={() => dispatch(loadConversation(conversationId))}>{t("Try again")}</Button>}>
          {t("Not all messages of this conversation could be loaded.")}
        </Alert>
      )}
      <Box sx={{ px: { xs: 1, md: 2 }, pb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.map(m => {
          const id = m.id!;
          const open = expanded.has(id);
          const unread = !m.isRead;
          const folder = folderName(m);
          return (
            <Box
              key={id}
              ref={(el: HTMLElement | null) => { itemRefs.current[id] = el; }}
              component="article"
              aria-label={senderName(m)}
              sx={{
                border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden", flexShrink: 0,
                borderLeft: unread ? 3 : 1, borderLeftColor: unread ? "primary.main" : "divider",
                bgcolor: id === message.id && !open ? (theme => alpha(theme.palette.primary.main, 0.06)) : "background.paper",
              }}
            >
              {open ? <>
                <Box sx={{ p: 2, pb: 1.5 }}>
                  <MessageHeader
                    message={m}
                    onHeaderClick={messages.length > 1 ? () => toggle(id) : undefined}
                    onReply={() => dispatch(startCompose({ mode: "reply", originalId: id }))}
                    onReplyAll={() => dispatch(startCompose({ mode: "replyAll", originalId: id }))}
                    onForward={() => dispatch(startCompose({ mode: "forward", originalId: id }))}
                    onMore={anchor => onMore(anchor, id, bodies.current[id])}
                  />
                  {folder && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, ml: 6.5 }}>{t("In {{folder}}", { folder })}</Typography>}
                </Box>
                <Box sx={{ px: 2, pb: 2 }}>
                  <MessageContent message={m} onBodyHtml={handleBody(id)} />
                </Box>
              </> : (
                <Box
                  role="button"
                  tabIndex={0}
                  aria-expanded={false}
                  onClick={() => toggle(id)}
                  onKeyDown={onKey(id)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
                  }}
                >
                  <PersonAvatar name={senderName(m)} email={senderAddress(m)} size={28} />
                  <Typography variant="body2" noWrap sx={{ fontWeight: unread ? 700 : 600, flexShrink: 0, maxWidth: "35%" }}>
                    {m.isDraft && <Box component="span" sx={{ color: "error.main", mr: 0.5 }}>[{t("Draft")}]</Box>}
                    {senderName(m)}
                  </Typography>
                  <Typography variant="body2" noWrap color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                    {previewText(m, 160)}
                  </Typography>
                  {folder && <Typography variant="caption" color="text.secondary" noWrap sx={{ flexShrink: 0 }}>{folder}</Typography>}
                  <Typography variant="caption" color={unread ? "primary.main" : "text.secondary"} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                    {formatListDate(m.receivedDateTime || m.sentDateTime)}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ConversationView;
