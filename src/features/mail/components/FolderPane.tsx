// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import {
  Add, ArchiveOutlined, ChevronRight, CreateNewFolderOutlined, DeleteOutline, DeleteSweepOutlined, DraftsOutlined,
  DriveFileRenameOutline, ExpandMore, FolderOutlined, InboxOutlined, MarkEmailReadOutlined, OutboxOutlined,
  ReportGmailerrorredOutlined, SendOutlined, StarBorder, Star,
} from "@mui/icons-material";
import { KeyboardEvent, MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../../types/messages";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import {
  createFolder, deleteFolder, emptyFolder, loadChildFolders, markFolderRead, renameFolder, toggleFavoriteFolder,
  toggleFolderExpanded, moveMessages,
} from "../mailSlice";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const FOLDER_ICONS: Record<WellKnownFolderName, typeof InboxOutlined> = {
  inbox: InboxOutlined,
  drafts: DraftsOutlined,
  sentitems: SendOutlined,
  deleteditems: DeleteOutline,
  junkemail: ReportGmailerrorredOutlined,
  archive: ArchiveOutlined,
  outbox: OutboxOutlined,
  custom: FolderOutlined,
};

export const FOLDER_LABELS: Record<WellKnownFolderName, string> = {
  inbox: "Inbox",
  drafts: "Drafts",
  sentitems: "Sent Items",
  deleteditems: "Deleted Items",
  junkemail: "Junk Email",
  archive: "Archive",
  outbox: "Outbox",
  custom: "",
};

export function folderLabel(folder: ExtendedMailFolder, t: (s: string) => string): string {
  return folder.wellKnownName !== "custom" ? t(FOLDER_LABELS[folder.wellKnownName]) : (folder.displayName || "");
}

type FolderPaneProps = {
  selectedId?: string;
  onSelect: (folder: ExtendedMailFolder) => void;
};

type MenuState = { anchor: { top: number; left: number }; folder: ExtendedMailFolder } | null;

const FolderPane = ({ selectedId, onSelect }: FolderPaneProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { folders, expandedFolders, favoriteFolders, foldersLoaded } = useTypeSelector(state => state.mail);
  const [menu, setMenu] = useState<MenuState>(null);
  const [editing, setEditing] = useState<{ type: "rename" | "create"; folderId?: string; parentId?: string; value: string } | null>(null);
  const [confirm, setConfirm] = useState<{ type: "delete" | "empty"; folder: ExtendedMailFolder } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleContextMenu = (folder: ExtendedMailFolder) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ anchor: { top: e.clientY, left: e.clientX }, folder });
  };

  const closeMenu = () => setMenu(null);

  const handleToggle = (folder: ExtendedMailFolder) => (e: MouseEvent) => {
    e.stopPropagation();
    if (!expandedFolders.includes(folder.id!) && folder.childFolderCount && !folder.childFolders?.length) {
      dispatch(loadChildFolders(folder.id!));
    }
    dispatch(toggleFolderExpanded(folder.id!));
  };

  const commitEdit = () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (value) {
      if (editing.type === "rename" && editing.folderId) {
        dispatch(renameFolder({ id: editing.folderId, displayName: value }));
      } else if (editing.type === "create") {
        dispatch(createFolder({ displayName: value, parentId: editing.parentId }));
      }
    }
    setEditing(null);
  };

  const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(null);
    e.stopPropagation();
  };

  const menuFolder = menu?.folder;
  const isWellKnown = menuFolder && menuFolder.wellKnownName !== "custom";

  const handleDrop = (folder: ExtendedMailFolder) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const data = e.dataTransfer.getData("application/x-message-ids");
    if (!data) return;
    try {
      const ids: string[] = JSON.parse(data);
      if (ids.length) dispatch(moveMessages({ ids, destinationId: folder.id! }));
    } catch { /* ignore */ }
  };

  const renderFolder = (folder: ExtendedMailFolder, depth: number) => {
    const Icon = FOLDER_ICONS[folder.wellKnownName] || FolderOutlined;
    const expanded = expandedFolders.includes(folder.id!);
    const hasChildren = Boolean(folder.childFolderCount) || Boolean(folder.childFolders?.length);
    const selected = folder.id === selectedId;
    const count = folder.wellKnownName === "drafts" || folder.wellKnownName === "junkemail" || folder.wellKnownName === "outbox" ?
      folder.totalItemCount : folder.unreadItemCount;
    const isEditing = editing?.type === "rename" && editing.folderId === folder.id;

    return (
      <Box key={folder.id}>
        <Box
          role="treeitem"
          aria-selected={selected}
          aria-expanded={hasChildren ? expanded : undefined}
          onClick={() => onSelect(folder)}
          onContextMenu={handleContextMenu(folder)}
          onDragOver={e => { e.preventDefault(); if (dragOver !== folder.id) setDragOver(folder.id!); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={handleDrop(folder)}
          sx={{
            display: "flex",
            alignItems: "center",
            height: 32,
            pl: 0.5 + depth * 2,
            pr: 1,
            mx: 1,
            borderRadius: 1.5,
            cursor: "pointer",
            userSelect: "none",
            color: selected ? "primary.main" : "text.primary",
            bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "primary.main" + "1a") : dragOver === folder.id ? "action.selected" : "transparent",
            outline: dragOver === folder.id ? "1px dashed" : "none",
            outlineColor: "primary.main",
            "&:hover": { bgcolor: selected ? undefined : "action.hover" },
          }}
        >
          <IconButton
            size="small"
            onClick={handleToggle(folder)}
            sx={{ p: 0, width: 20, height: 20, mr: 0.25, visibility: hasChildren ? "visible" : "hidden" }}
            aria-label={expanded ? t("Collapse") : t("Expand")}
            tabIndex={-1}
          >
            {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
          <Icon fontSize="small" sx={{ mr: 1, color: selected ? "primary.main" : "text.secondary" }} />
          {isEditing ? (
            <InputBase
              autoFocus
              value={editing.value}
              onChange={e => setEditing({ ...editing, value: e.target.value })}
              onKeyDown={handleEditKey}
              onBlur={commitEdit}
              onClick={e => e.stopPropagation()}
              sx={{ flex: 1, fontSize: 14, px: 0.5, bgcolor: "background.paper", borderRadius: 1, border: 1, borderColor: "primary.main" }}
            />
          ) : (
            <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: count ? 600 : 400 }}>
              {folderLabel(folder, t)}
            </Typography>
          )}
          {!isEditing && Boolean(count) && (
            <Typography variant="caption" sx={{ ml: 1, fontWeight: 600, color: selected ? "primary.main" : "text.secondary" }}>
              {count}
            </Typography>
          )}
        </Box>
        {editing?.type === "create" && editing.parentId === folder.id && (
          <Box sx={{ display: "flex", alignItems: "center", height: 32, pl: 0.5 + (depth + 1) * 2, pr: 1, mx: 1 }}>
            <Box sx={{ width: 20, mr: 0.25 }} />
            <FolderOutlined fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <InputBase
              autoFocus
              placeholder={t("New folder")}
              value={editing.value}
              onChange={e => setEditing({ ...editing, value: e.target.value })}
              onKeyDown={handleEditKey}
              onBlur={commitEdit}
              sx={{ flex: 1, fontSize: 14, px: 0.5, bgcolor: "background.paper", borderRadius: 1, border: 1, borderColor: "primary.main" }}
            />
          </Box>
        )}
        {expanded && folder.childFolders?.map(child => renderFolder(child, depth + 1))}
      </Box>
    );
  };

  const favorites = favoriteFolders
    .map(id => findInTree(folders, id))
    .filter((f): f is ExtendedMailFolder => Boolean(f));

  return (
    <Box role="tree" aria-label={t("Folders")} sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {favorites.length > 0 && <>
          <Typography variant="overline" sx={{ px: 2, color: "text.secondary", display: "block", lineHeight: 2 }}>{t("Favorites")}</Typography>
          {favorites.map(folder => renderFolder(folder, 0))}
          <Divider sx={{ my: 1, mx: 2 }} />
        </>}
        <Typography variant="overline" sx={{ px: 2, color: "text.secondary", display: "block", lineHeight: 2 }}>{t("Folders")}</Typography>
        {folders.map(folder => renderFolder(folder, 0))}
        {editing?.type === "create" && !editing.parentId && (
          <Box sx={{ display: "flex", alignItems: "center", height: 32, pl: 0.5, pr: 1, mx: 1 }}>
            <Box sx={{ width: 20, mr: 0.25 }} />
            <FolderOutlined fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <InputBase
              autoFocus
              placeholder={t("New folder")}
              value={editing.value}
              onChange={e => setEditing({ ...editing, value: e.target.value })}
              onKeyDown={handleEditKey}
              onBlur={commitEdit}
              sx={{ flex: 1, fontSize: 14, px: 0.5, bgcolor: "background.paper", borderRadius: 1, border: 1, borderColor: "primary.main" }}
            />
          </Box>
        )}
        {foldersLoaded && folders.length === 0 && (
          <Typography variant="body2" sx={{ px: 2, py: 1, color: "text.secondary" }}>{t("No folders")}</Typography>
        )}
      </Box>
      <Divider />
      <Button
        startIcon={<Add />}
        onClick={() => setEditing({ type: "create", value: "" })}
        sx={{ m: 1, justifyContent: "flex-start", color: "text.secondary" }}
      >
        {t("New folder")}
      </Button>

      <Menu open={Boolean(menu)} onClose={closeMenu} anchorReference="anchorPosition" anchorPosition={menu?.anchor}>
        <MenuItem onClick={() => { closeMenu(); setEditing({ type: "create", parentId: menuFolder?.id, value: "" }); if (menuFolder && !expandedFolders.includes(menuFolder.id!)) dispatch(toggleFolderExpanded(menuFolder.id!)); }}>
          <ListItemIcon><CreateNewFolderOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Create new subfolder")}</ListItemText>
        </MenuItem>
        <MenuItem disabled={isWellKnown} onClick={() => { closeMenu(); if (menuFolder) setEditing({ type: "rename", folderId: menuFolder.id!, value: menuFolder.displayName || "" }); }}>
          <ListItemIcon><DriveFileRenameOutline fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Rename")}</ListItemText>
        </MenuItem>
        <MenuItem disabled={isWellKnown} onClick={() => { closeMenu(); if (menuFolder) setConfirm({ type: "delete", folder: menuFolder }); }}>
          <ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Delete folder")}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { closeMenu(); if (menuFolder) dispatch(markFolderRead(menuFolder.id!)); }}>
          <ListItemIcon><MarkEmailReadOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Mark all as read")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); if (menuFolder) setConfirm({ type: "empty", folder: menuFolder }); }}>
          <ListItemIcon><DeleteSweepOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Empty folder")}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { closeMenu(); if (menuFolder) dispatch(toggleFavoriteFolder(menuFolder.id!)); }}>
          <ListItemIcon>{menuFolder && favoriteFolders.includes(menuFolder.id!) ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}</ListItemIcon>
          <ListItemText>{menuFolder && favoriteFolders.includes(menuFolder.id!) ? t("Remove from favorites") : t("Add to favorites")}</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === "delete" ? t("Delete folder") : t("Empty folder")}
        description={confirm?.type === "delete" ?
          t("The folder \"{{name}}\" and all its messages will be moved to Deleted Items.", { name: confirm?.folder.displayName }) :
          t("All messages in \"{{name}}\" will be deleted.", { name: confirm ? folderLabel(confirm.folder, t) : "" })}
        confirmLabel={confirm?.type === "delete" ? t("Delete") : t("Empty")}
        destructive
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "delete") dispatch(deleteFolder(confirm.folder.id!));
          else dispatch(emptyFolder(confirm.folder.id!));
        }}
        onClose={() => setConfirm(null)}
      />
    </Box>
  );
};

function findInTree(folders: ExtendedMailFolder[], id: string): ExtendedMailFolder | undefined {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const child = findInTree(folder.childFolders || [], id);
    if (child) return child;
  }
  return undefined;
}

export default FolderPane;
