// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Divider, IconButton, Tooltip } from "@mui/material";
import {
  ArchiveOutlined, DeleteOutline, DraftsOutlined, DriveFileMoveOutlined, Edit, Flag, FlagOutlined, Forward, LabelOutlined,
  MailOutline, MenuOpen, MoreHoriz, Reply, ReplyAll, ReportGmailerrorredOutlined, Inbox, PushPinOutlined, PushPin,
} from "@mui/icons-material";
import { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import useMailActions from "../useMailActions";
import MoveToMenu from "./MoveToMenu";
import CategoryMenu from "./CategoryMenu";
import MessageActionsMenu from "./MessageActionsMenu";
import { useTypeSelector } from "../../../store";

type MailToolbarProps = {
  ids: string[];
  onNewMessage: () => void;
  onToggleFolders: () => void;
  bodyHtml?: string;
};

const MailToolbar = ({ ids, onNewMessage, onToggleFolders, bodyHtml }: MailToolbarProps) => {
  const { t } = useTranslation();
  const actions = useMailActions(ids);
  const pinned = useTypeSelector(state => state.mail.pinned);
  const [moveAnchor, setMoveAnchor] = useState<HTMLElement | null>(null);
  const [catAnchor, setCatAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

  const enabled = ids.length > 0;
  const single = ids.length === 1;
  const isPinned = single && pinned.includes(ids[0]);

  const action = (title: string, icon: JSX.Element, onClick: (e: MouseEvent<HTMLElement>) => void, disabled = !enabled, hideBelow?: "sm" | "md" | "lg") => (
    <Tooltip title={title}>
      <span style={{ display: "inline-flex" }}>
        <IconButton size="small" onClick={onClick} disabled={disabled} aria-label={title} sx={hideBelow ? { display: { xs: "none", [hideBelow]: "inline-flex" } } : undefined}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box role="toolbar" aria-label={t("Mail actions")} sx={{ display: "flex", alignItems: "center", gap: 0.25, px: 1, minHeight: 48, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", flexShrink: 0 }}>
      <Tooltip title={t("Toggle folder pane")}>
        <IconButton size="small" onClick={onToggleFolders} aria-label={t("Toggle folder pane")}><MenuOpen /></IconButton>
      </Tooltip>
      <Button variant="contained" startIcon={<Edit />} onClick={onNewMessage} sx={{ mx: 1, whiteSpace: "nowrap" }}>
        {t("New mail")}
      </Button>
      <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
      {action(actions.isDeletedFolder ? t("Delete permanently") : t("Delete"), <DeleteOutline />, () => actions.remove())}
      {action(t("Archive"), <ArchiveOutlined />, actions.archive)}
      {action(actions.isJunkFolder ? t("Not junk") : t("Mark as junk"), actions.isJunkFolder ? <Inbox /> : <ReportGmailerrorredOutlined />, actions.junk, !enabled, "md")}
      {action(t("Move to"), <DriveFileMoveOutlined />, e => setMoveAnchor(e.currentTarget))}
      <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
      {action(t("Reply"), <Reply />, actions.reply, !single)}
      {action(t("Reply all"), <ReplyAll />, actions.replyAll, !single)}
      {action(t("Forward"), <Forward />, actions.forward, !single)}
      <Divider orientation="vertical" flexItem sx={{ my: 1, display: { xs: "none", sm: "block" } }} />
      {action(actions.allRead ? t("Mark as unread") : t("Mark as read"), actions.allRead ? <MailOutline /> : <DraftsOutlined />, actions.toggleRead, !enabled, "sm")}
      {action(actions.allFlagged ? t("Clear flag") : t("Flag"), actions.allFlagged ? <Flag color="error" /> : <FlagOutlined />, actions.toggleFlag, !enabled, "sm")}
      {action(t("Categorize"), <LabelOutlined />, e => setCatAnchor(e.currentTarget), !enabled, "md")}
      {action(isPinned ? t("Unpin") : t("Pin"), isPinned ? <PushPin color="primary" /> : <PushPinOutlined />, actions.togglePin, !single, "lg")}
      <Box sx={{ flex: 1 }} />
      {action(t("More actions"), <MoreHoriz />, e => setMoreAnchor(e.currentTarget))}

      <MoveToMenu
        anchorEl={moveAnchor}
        open={Boolean(moveAnchor)}
        onClose={() => setMoveAnchor(null)}
        title={t("Move to")}
        excludeId={actions.first?.parentFolderId || undefined}
        onSelect={folder => actions.move(folder.id!)}
        onNewFolder={actions.moveToNewFolder}
      />
      <CategoryMenu
        anchorEl={catAnchor}
        open={Boolean(catAnchor)}
        onClose={() => setCatAnchor(null)}
        applied={actions.appliedCategories}
        onToggle={actions.toggleCategory}
        onClear={actions.clearCategories}
      />
      <MessageActionsMenu ids={ids} anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)} bodyHtml={bodyHtml} compact />
    </Box>
  );
};

export default MailToolbar;
