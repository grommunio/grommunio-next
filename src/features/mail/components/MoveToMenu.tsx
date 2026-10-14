// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Divider, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { CreateNewFolderOutlined, FolderOutlined, Search } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeSelector } from "../../../store";
import { selectFlatFolders } from "../selectors";
import { folderLabel } from "./FolderPane";
import type { ExtendedMailFolder } from "../../../types/messages";

type MoveToMenuProps = {
  anchorEl: HTMLElement | null;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  onClose: () => void;
  onSelect: (folder: ExtendedMailFolder) => void;
  onNewFolder?: (displayName: string) => void;
  excludeId?: string;
  title?: string;
};

export function focusFirstItem(from: HTMLElement) {
  from.closest<HTMLElement>("[role='menu']")?.querySelector<HTMLElement>("[role^='menuitem']:not([aria-disabled='true'])")?.focus();
}

const MoveToMenu = ({ anchorEl, anchorPosition, open, onClose, onSelect, onNewFolder, excludeId, title }: MoveToMenuProps) => {
  const { t } = useTranslation();
  const folders = useTypeSelector(selectFlatFolders);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders.filter(f => f.id !== excludeId && (!q || folderLabel(f, t).toLowerCase().includes(q)));
  }, [folders, query, excludeId, t]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorPosition={anchorPosition}
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: 300, maxHeight: 440 } }}
      MenuListProps={{ dense: true }}
    >
      {title && <Typography variant="overline" sx={{ px: 2, color: "text.secondary" }}>{title}</Typography>}
      <Box sx={{ px: 1.5, pb: 1 }} onKeyDown={e => e.stopPropagation()}>
        <InputBase
          autoFocus
          fullWidth
          placeholder={t("Search folders")}
          value={query}
          onChange={e => setQuery(e.target.value)}
          startAdornment={<Search fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />}
          onKeyDown={e => {
            if (e.key === "Enter" && filtered[0]) { onSelect(filtered[0]); handleClose(); }
            if (e.key === "Escape") handleClose();
            if (e.key === "ArrowDown") { e.preventDefault(); focusFirstItem(e.currentTarget); }
          }}
          sx={{ px: 1, py: 0.25, borderRadius: 1, border: 1, borderColor: "divider", fontSize: 14 }}
          inputProps={{ "aria-label": t("Search folders") }}
        />
      </Box>
      {/* Items must be direct children of the menu list for arrow-key navigation */}
      {filtered.map(folder => (
        <MenuItem key={folder.id} onClick={() => { onSelect(folder); handleClose(); }} sx={{ pl: 2 + folder.depth * 1.5 }}>
          <ListItemIcon><FolderOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ noWrap: true }}>{folderLabel(folder, t)}</ListItemText>
        </MenuItem>
      ))}
      {filtered.length === 0 && <Typography variant="body2" sx={{ px: 2, py: 1, color: "text.secondary" }}>{t("No folders found")}</Typography>}
      {onNewFolder && query.trim() && filtered.length === 0 ? [
        <Divider key="divider" />,
        <MenuItem key="create" onClick={() => { onNewFolder(query.trim()); handleClose(); }}>
          <ListItemIcon><CreateNewFolderOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Create folder \"{{name}}\"", { name: query.trim() })}</ListItemText>
        </MenuItem>,
      ] : null}
    </Menu>
  );
};

export default MoveToMenu;
