// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Checkbox, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArchiveOutlined, AttachFile, ChevronRight, DeleteOutline, DraftsOutlined, ExpandMore, Flag, FlagOutlined, MailOutline,
  PriorityHigh, PushPin,
} from "@mui/icons-material";
import { memo, MouseEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { OutlookCategory } from "microsoft-graph";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { formatListDate, previewText, senderAddress } from "../utils";
import { categoryColor } from "../categories";
import type { ConversationGroup } from "../conversations";
import { conversationRowId } from "../conversations";

export type ConversationAction = "delete" | "archive" | "flag" | "read";

type ConversationListItemProps = {
  group: ConversationGroup;
  selected: boolean;
  tabStop?: boolean;
  checked: boolean;
  selectionMode: boolean;
  expanded: boolean;
  compact: boolean;
  showAvatar: boolean;
  showPreview: boolean;
  categories: OutlookCategory[];
  onClick: (group: ConversationGroup, e: MouseEvent) => void;
  onToggleExpand: (group: ConversationGroup) => void;
  onCheck: (group: ConversationGroup) => void;
  onContextMenu: (group: ConversationGroup, e: MouseEvent) => void;
  onAction: (group: ConversationGroup, action: ConversationAction) => void;
  onDragStart?: (group: ConversationGroup, e: React.DragEvent) => void;
};

// t("{{count}} messages in this folder_one")
// t("{{count}} messages in this folder_other")
const ConversationListItem = memo(function ConversationListItem({
  group, selected, tabStop, checked, selectionMode, expanded, compact, showAvatar, showPreview, categories,
  onClick, onToggleExpand, onCheck, onContextMenu, onAction, onDragStart,
}: ConversationListItemProps) {
  const { t } = useTranslation();
  const { latest } = group;
  const unread = group.unread > 0;
  const senders = group.senders.join("; ");
  const date = formatListDate(latest.receivedDateTime || latest.sentDateTime || latest.lastModifiedDateTime);
  const allCategories = useMemo(() => Array.from(new Set(group.messages.flatMap(m => m.categories || []))), [group.messages]);
  const stop = (fn: () => void) => (e: MouseEvent) => { e.stopPropagation(); fn(); };
  // Controls inside rows are tabbable only in the tab-stop row (roving tabindex)
  const innerTab = tabStop ? 0 : -1;
  const checkbox = (sx: object) => (
    <Checkbox size="small" checked={checked} onClick={e => e.stopPropagation()} onChange={() => onCheck(group)} sx={sx} inputProps={{ "aria-label": t("Select conversation"), tabIndex: innerTab }} />
  );

  return (
    <Box
      role="option"
      aria-selected={selected}
      aria-expanded={expanded}
      tabIndex={tabStop ? 0 : -1}
      data-row-id={conversationRowId(group.id)}
      draggable
      onDragStart={e => onDragStart?.(group, e)}
      onClick={e => onClick(group, e)}
      onContextMenu={e => onContextMenu(group, e)}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1,
        py: compact ? 0.5 : 1,
        minHeight: compact ? 44 : 64,
        cursor: "pointer",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : alpha(theme.palette.primary.main, 0.08)) : checked ? "action.selected" : "transparent",
        "&:hover": { bgcolor: selected ? undefined : "action.hover" },
        "&:hover .hover-actions, &:focus-within .hover-actions": { opacity: 1 },
        "&:hover .list-date, &:focus-within .list-date": { opacity: 0 },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
        "&::before": unread ? {
          content: '""', position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, bgcolor: "primary.main",
        } : undefined,
      }}
    >
      <Box sx={{ width: showAvatar ? 36 : 24, display: "flex", justifyContent: "center", alignItems: "center", alignSelf: compact ? "center" : "flex-start", mt: compact ? 0 : 0.25, flexShrink: 0 }}>
        {selectionMode ? checkbox({ p: 0.5 }) : showAvatar ? (
          <Box sx={{ position: "relative", "&:hover .avatar, &:focus-within .avatar": { opacity: 0 }, "&:hover .avatar-check, &:focus-within .avatar-check": { opacity: 1 } }}>
            <Box className="avatar" sx={{ transition: "opacity .1s" }}>
              <PersonAvatar name={group.senders[0] || ""} email={senderAddress(latest) || group.senders[0] || ""} size={compact ? 28 : 32} />
            </Box>
            <Box className="avatar-check" sx={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity .1s" }}>
              {checkbox({ p: 0.5 })}
            </Box>
          </Box>
        ) : checkbox({ p: 0.5, opacity: checked ? 1 : 0.4 })}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            tabIndex={-1}
            onClick={stop(() => onToggleExpand(group))}
            aria-label={expanded ? t("Collapse conversation") : t("Expand conversation")}
            sx={{ p: 0, ml: -0.5 }}
          >
            {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
          <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: unread ? 700 : 400 }} title={senders}>
            {senders}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: 16 }}>
            {group.highImportance && <Tooltip title={t("High importance")}><PriorityHigh fontSize="inherit" color="error" /></Tooltip>}
            {group.hasAttachments && <AttachFile fontSize="inherit" />}
            {group.pinned && <PushPin fontSize="inherit" color="primary" />}
            {group.flagged && <Flag fontSize="inherit" color="error" />}
          </Box>
          <Typography className="list-date" variant="caption" sx={{ color: unread ? "primary.main" : "text.secondary", fontWeight: unread ? 600 : 400, whiteSpace: "nowrap", minWidth: 48, textAlign: "right" }}>
            {date}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, color: unread ? "text.primary" : "text.secondary", fontWeight: unread ? 600 : 400 }}>
            {latest.subject || t("(No subject)")}
          </Typography>
          <Tooltip title={t("{{count}} messages in this folder", { count: group.messages.length })}>
            <Typography variant="caption" sx={{ px: 0.75, borderRadius: 1, bgcolor: "action.hover", color: "text.secondary", lineHeight: "18px", flexShrink: 0 }}>
              {group.messages.length}
            </Typography>
          </Tooltip>
        </Box>
        {showPreview && !compact && (
          <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontSize: 13 }}>
            {previewText(latest, 120)}
          </Typography>
        )}
        {allCategories.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.25, flexWrap: "wrap" }}>
            {allCategories.map(cat => (
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
        <Tooltip title={t("Delete")}><IconButton size="small" tabIndex={innerTab} onClick={stop(() => onAction(group, "delete"))} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={t("Archive")}><IconButton size="small" tabIndex={innerTab} onClick={stop(() => onAction(group, "archive"))} aria-label={t("Archive")}><ArchiveOutlined fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={unread ? t("Mark as read") : t("Mark as unread")}>
          <IconButton size="small" tabIndex={innerTab} onClick={stop(() => onAction(group, "read"))} aria-label={unread ? t("Mark as read") : t("Mark as unread")}>
            {unread ? <DraftsOutlined fontSize="small" /> : <MailOutline fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={group.flagged ? t("Clear flag") : t("Flag")}>
          <IconButton size="small" tabIndex={innerTab} onClick={stop(() => onAction(group, "flag"))} aria-label={group.flagged ? t("Clear flag") : t("Flag")}>
            {group.flagged ? <Flag fontSize="small" color="error" /> : <FlagOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

export default ConversationListItem;
