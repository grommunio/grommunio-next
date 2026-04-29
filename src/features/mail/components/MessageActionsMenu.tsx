// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import {
  ArchiveOutlined, ContentCopy, DeleteForeverOutlined, DeleteOutline, DraftsOutlined, DriveFileMoveOutlined,
  Flag, FlagOutlined, Forward, LabelOutlined, MailOutline, PriorityHigh, Print, PushPin, PushPinOutlined,
  ReportGmailerrorredOutlined, Reply, ReplyAll, Code, Inbox,
} from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useMailActions from "../useMailActions";
import MoveToMenu from "./MoveToMenu";
import CategoryMenu from "./CategoryMenu";
import { useTypeSelector } from "../../../store";

type MessageActionsMenuProps = {
  ids: string[];
  anchorEl?: HTMLElement | null;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  onClose: () => void;
  // for printing
  bodyHtml?: string;
  compact?: boolean;
};

const MessageActionsMenu = ({ ids, anchorEl, anchorPosition, open, onClose, bodyHtml, compact }: MessageActionsMenuProps) => {
  const { t } = useTranslation();
  const actions = useMailActions(ids);
  // The main menu closes (and its ids may be cleared) before a sub menu opens
  const [subIds, setSubIds] = useState<string[]>([]);
  const subActions = useMailActions(subIds);
  const pinned = useTypeSelector(state => state.mail.pinned);
  const [sub, setSub] = useState<"move" | "copy" | "categories" | null>(null);
  const [subAnchor, setSubAnchor] = useState<{ top: number; left: number } | undefined>(undefined);

  const single = ids.length === 1;
  const isPinned = single && pinned.includes(ids[0]);

  const run = (fn: () => void) => () => { fn(); onClose(); };

  const openSub = (type: "move" | "copy" | "categories") => (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSubAnchor({ top: rect.top, left: rect.right });
    setSubIds(ids);
    setSub(type);
    onClose();
  };

  return <>
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorPosition={anchorPosition}
      open={open && ids.length > 0}
      onClose={onClose}
      MenuListProps={{ dense: true }}
    >
      {/* Arrays instead of fragments: MenuList needs direct children for keyboard focus */}
      {single && !compact ? [
        <MenuItem key="reply" onClick={run(actions.reply)}><ListItemIcon><Reply fontSize="small" /></ListItemIcon><ListItemText>{t("Reply")}</ListItemText></MenuItem>,
        <MenuItem key="replyAll" onClick={run(actions.replyAll)}><ListItemIcon><ReplyAll fontSize="small" /></ListItemIcon><ListItemText>{t("Reply all")}</ListItemText></MenuItem>,
        <MenuItem key="forward" onClick={run(actions.forward)}><ListItemIcon><Forward fontSize="small" /></ListItemIcon><ListItemText>{t("Forward")}</ListItemText></MenuItem>,
        <Divider key="d0" />,
      ] : null}
      <MenuItem onClick={run(() => actions.remove())}>
        <ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon>
        <ListItemText>{actions.isDeletedFolder ? t("Delete permanently") : t("Delete")}</ListItemText>
      </MenuItem>
      {!actions.isDeletedFolder && (
        <MenuItem onClick={run(() => actions.remove(true))}>
          <ListItemIcon><DeleteForeverOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Delete permanently")}</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={run(actions.archive)}><ListItemIcon><ArchiveOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Archive")}</ListItemText></MenuItem>
      <MenuItem onClick={run(actions.junk)}>
        <ListItemIcon>{actions.isJunkFolder ? <Inbox fontSize="small" /> : <ReportGmailerrorredOutlined fontSize="small" />}</ListItemIcon>
        <ListItemText>{actions.isJunkFolder ? t("Not junk") : t("Mark as junk")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={openSub("move")}><ListItemIcon><DriveFileMoveOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Move to…")}</ListItemText></MenuItem>
      <MenuItem onClick={openSub("copy")}><ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon><ListItemText>{t("Copy to…")}</ListItemText></MenuItem>
      <Divider />
      <MenuItem onClick={run(actions.toggleRead)}>
        <ListItemIcon>{actions.allRead ? <MailOutline fontSize="small" /> : <DraftsOutlined fontSize="small" />}</ListItemIcon>
        <ListItemText>{actions.allRead ? t("Mark as unread") : t("Mark as read")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={run(actions.toggleFlag)}>
        <ListItemIcon>{actions.allFlagged ? <Flag fontSize="small" color="error" /> : <FlagOutlined fontSize="small" />}</ListItemIcon>
        <ListItemText>{actions.allFlagged ? t("Clear flag") : t("Flag")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={openSub("categories")}><ListItemIcon><LabelOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Categorize")}</ListItemText></MenuItem>
      {single && (
        <MenuItem onClick={run(actions.togglePin)}>
          <ListItemIcon>{isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}</ListItemIcon>
          <ListItemText>{isPinned ? t("Unpin") : t("Pin")}</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={run(() => actions.setImportance(actions.first?.importance === "high" ? "normal" : "high"))}>
        <ListItemIcon><PriorityHigh fontSize="small" /></ListItemIcon>
        <ListItemText>{actions.first?.importance === "high" ? t("Normal importance") : t("High importance")}</ListItemText>
      </MenuItem>
      {single ? [
        <Divider key="d2" />,
        bodyHtml !== undefined ? <MenuItem key="print" onClick={run(() => actions.print(bodyHtml))}><ListItemIcon><Print fontSize="small" /></ListItemIcon><ListItemText>{t("Print")}</ListItemText></MenuItem> : null,
        <MenuItem key="source" onClick={run(actions.viewSource)}><ListItemIcon><Code fontSize="small" /></ListItemIcon><ListItemText>{t("View message source")}</ListItemText></MenuItem>,
      ] : null}
    </Menu>
    <MoveToMenu
      anchorEl={null}
      anchorPosition={subAnchor}
      open={sub === "move" || sub === "copy"}
      onClose={() => setSub(null)}
      title={sub === "copy" ? t("Copy to") : t("Move to")}
      excludeId={subActions.first?.parentFolderId || undefined}
      onSelect={folder => sub === "copy" ? subActions.copy(folder.id!) : subActions.move(folder.id!)}
      onNewFolder={sub === "move" ? subActions.moveToNewFolder : undefined}
    />
    <CategoryMenu
      anchorEl={null}
      anchorPosition={subAnchor}
      open={sub === "categories"}
      onClose={() => setSub(null)}
      applied={subActions.appliedCategories}
      onToggle={subActions.toggleCategory}
      onClear={subActions.clearCategories}
    />
  </>;
};

export default MessageActionsMenu;
