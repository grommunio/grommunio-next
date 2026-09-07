// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Checkbox, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArchiveOutlined, AttachFile, DeleteOutline, Event, EventAvailable, EventBusy, Flag, FlagOutlined,
  MailOutline, DraftsOutlined, PriorityHigh, PushPin, PushPinOutlined, QuestionMark,
} from "@mui/icons-material";
import { memo, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { EventMessage, Message, OutlookCategory } from "microsoft-graph";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { formatListDate, previewText, recipientsSummary, senderAddress, senderName } from "../utils";
import { categoryColor } from "../categories";

export type MessageListItemProps = {
  message: Message;
  selected: boolean;
  // Roving tabindex
  tabStop?: boolean;
  checked: boolean;
  selectionMode: boolean;
  pinned: boolean;
  compact: boolean;
  showAvatar: boolean;
  showPreview: boolean;
  showRecipients: boolean;
  categories: OutlookCategory[];
  nested?: boolean;
  onClick: (message: Message, e: MouseEvent) => void;
  onCheck: (message: Message) => void;
  onContextMenu: (message: Message, e: MouseEvent) => void;
  onDelete: (message: Message) => void;
  onArchive: (message: Message) => void;
  onToggleFlag: (message: Message) => void;
  onToggleRead: (message: Message) => void;
  onTogglePin: (message: Message) => void;
  onDragStart?: (message: Message, e: React.DragEvent) => void;
};

function meetingIcon(message: Message) {
  switch ((message as EventMessage).meetingMessageType) {
  case "meetingRequest": return <Event fontSize="inherit" />;
  case "meetingAccepted": return <EventAvailable fontSize="inherit" />;
  case "meetingTenativelyAccepted": return <QuestionMark fontSize="inherit" />;
  case "meetingDeclined":
  case "meetingCancelled": return <EventBusy fontSize="inherit" />;
  default: return null;
  }
}

const MessageListItem = memo(function MessageListItem({
  message, selected, tabStop, checked, selectionMode, pinned, compact, showAvatar, showPreview, showRecipients, categories, nested,
  onClick, onCheck, onContextMenu, onDelete, onArchive, onToggleFlag, onToggleRead, onTogglePin, onDragStart,
}: MessageListItemProps) {
  const { t } = useTranslation();
  const unread = !message.isRead;
  const flagged = message.flag?.flagStatus === "flagged";
  const name = showRecipients ? (recipientsSummary(message) || t("(No recipients)")) : senderName(message);
  const address = showRecipients ? "" : senderAddress(message);
  const date = formatListDate(message.receivedDateTime || message.sentDateTime || message.lastModifiedDateTime);
  const stop = (fn: () => void) => (e: MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <Box
      role="option"
      aria-selected={selected}
      tabIndex={tabStop ? 0 : -1}
      data-message-id={message.id}
      data-row-id={message.id}
      draggable
      onDragStart={e => onDragStart?.(message, e)}
      onClick={e => onClick(message, e)}
      onContextMenu={e => onContextMenu(message, e)}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1,
        pl: nested ? 4 : 1,
        py: compact || nested ? 0.5 : 1,
        minHeight: compact || nested ? 44 : 64,
        cursor: "pointer",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : alpha(theme.palette.primary.main, 0.08)) : checked ? "action.selected" : "transparent",
        "&:hover": { bgcolor: selected ? undefined : "action.hover" },
        // Keyboard users need the actions too
        "&:hover .hover-actions, &:focus-within .hover-actions": { opacity: 1 },
        "&:hover .list-date, &:focus-within .list-date": { opacity: 0 },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
        "&::before": unread ? {
          content: '""', position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, bgcolor: "primary.main",
        } : undefined,
      }}
    >
      <Box
        className={selectionMode ? "" : "check-wrapper"}
        sx={{ width: showAvatar ? 36 : 24, display: "flex", justifyContent: "center", alignItems: "center", alignSelf: compact ? "center" : "flex-start", mt: compact ? 0 : 0.25, flexShrink: 0 }}
      >
        {selectionMode ? (
          <Checkbox size="small" checked={checked} onClick={e => e.stopPropagation()} onChange={() => onCheck(message)} sx={{ p: 0.5 }} inputProps={{ "aria-label": t("Select message") }} />
        ) : showAvatar ? (
          <Box sx={{ position: "relative", "&:hover .avatar, &:focus-within .avatar": { opacity: 0 }, "&:hover .avatar-check, &:focus-within .avatar-check": { opacity: 1 } }}>
            <Box className="avatar" sx={{ transition: "opacity .1s" }}>
              <PersonAvatar name={name} email={address || name} size={compact ? 28 : 32} />
            </Box>
            <Checkbox
              className="avatar-check"
              size="small"
              checked={checked}
              onClick={e => e.stopPropagation()}
              onChange={() => onCheck(message)}
              sx={{ position: "absolute", inset: 0, opacity: 0, p: 0.5, transition: "opacity .1s" }}
              inputProps={{ "aria-label": t("Select message") }}
            />
          </Box>
        ) : (
          <Checkbox size="small" checked={checked} onClick={e => e.stopPropagation()} onChange={() => onCheck(message)} sx={{ p: 0.5, opacity: checked ? 1 : 0.4 }} inputProps={{ "aria-label": t("Select message") }} />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: unread ? 700 : 400 }} title={address}>
            {message.isDraft && !showRecipients && <Box component="span" sx={{ color: "error.main", mr: 0.5 }}>[{t("Draft")}]</Box>}
            {name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: 16 }}>
            {message.importance === "high" && <Tooltip title={t("High importance")}><PriorityHigh fontSize="inherit" color="error" /></Tooltip>}
            {meetingIcon(message)}
            {message.hasAttachments && <AttachFile fontSize="inherit" />}
            {pinned && <PushPin fontSize="inherit" color="primary" />}
            {flagged && <Flag fontSize="inherit" color="error" />}
          </Box>
          <Typography className="list-date" variant="caption" sx={{ color: unread ? "primary.main" : "text.secondary", fontWeight: unread ? 600 : 400, whiteSpace: "nowrap", minWidth: 48, textAlign: "right" }}>
            {date}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, color: unread ? "text.primary" : "text.secondary", fontWeight: unread ? 600 : 400 }}>
            {message.subject || t("(No subject)")}
          </Typography>
        </Box>
        {showPreview && !compact && (
          <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontSize: 13 }}>
            {previewText(message, 120)}
          </Typography>
        )}
        {Boolean(message.categories?.length) && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.25, flexWrap: "wrap" }}>
            {message.categories!.map(cat => (
              <Box key={cat} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 0.75, borderRadius: 1, bgcolor: "action.hover", fontSize: 11, lineHeight: "18px", maxWidth: 140 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: categoryColor(cat, categories), flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box
        className="hover-actions"
        sx={{
          position: "absolute", right: 4, top: compact ? 4 : 6, display: "flex", gap: 0, opacity: 0, transition: "opacity .1s",
          bgcolor: "background.paper", borderRadius: 1, boxShadow: 1, px: 0.25,
        }}
      >
        <Tooltip title={t("Delete")}><IconButton size="small" onClick={stop(() => onDelete(message))} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={t("Archive")}><IconButton size="small" onClick={stop(() => onArchive(message))} aria-label={t("Archive")}><ArchiveOutlined fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={unread ? t("Mark as read") : t("Mark as unread")}>
          <IconButton size="small" onClick={stop(() => onToggleRead(message))} aria-label={unread ? t("Mark as read") : t("Mark as unread")}>
            {unread ? <DraftsOutlined fontSize="small" /> : <MailOutline fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={flagged ? t("Clear flag") : t("Flag")}>
          <IconButton size="small" onClick={stop(() => onToggleFlag(message))} aria-label={flagged ? t("Clear flag") : t("Flag")}>
            {flagged ? <Flag fontSize="small" color="error" /> : <FlagOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={pinned ? t("Unpin") : t("Pin")}>
          <IconButton size="small" onClick={stop(() => onTogglePin(message))} aria-label={pinned ? t("Unpin") : t("Pin")}>
            {pinned ? <PushPin fontSize="small" color="primary" /> : <PushPinOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

export default MessageListItem;
