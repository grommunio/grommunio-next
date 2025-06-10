// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { Add, Check, DeleteOutline, Label, LabelOutlined, Settings } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { OutlookCategory } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createCategory, deleteCategory, updateCategory } from "../mailSlice";
import { CATEGORY_PRESETS, presetColor } from "../categories";

type CategoryMenuProps = {
  anchorEl: HTMLElement | null;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  onClose: () => void;
  // Intersection when several messages are selected
  applied: string[];
  onToggle: (category: OutlookCategory) => void;
  onClear: () => void;
};

const ColorDot = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Box sx={{ width: size, height: size, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
);

const CategoryMenu = ({ anchorEl, anchorPosition, open, onClose, applied, onToggle, onClear }: CategoryMenuProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const categories = useTypeSelector(state => state.mail.categories);
  const [manage, setManage] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("preset7");
  const [filter, setFilter] = useState("");

  const visible = categories.filter(c => !filter || (c.displayName || "").toLowerCase().includes(filter.toLowerCase()));

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const result = await dispatch(createCategory({ displayName: name, color: newColor }));
    if (createCategory.fulfilled.match(result)) {
      setNewName("");
      if (!manage) onToggle(result.payload);
    }
  };

  return <>
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorPosition={anchorPosition}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 280, maxHeight: 440 } }}
      MenuListProps={{ dense: true }}
    >
      {categories.length > 8 && (
        <Box sx={{ px: 1.5, pb: 1 }} onKeyDown={e => e.stopPropagation()}>
          <InputBase autoFocus fullWidth placeholder={t("Search categories")} value={filter} onChange={e => setFilter(e.target.value)} sx={{ px: 1, py: 0.25, borderRadius: 1, border: 1, borderColor: "divider", fontSize: 14 }} />
        </Box>
      )}
      <Box sx={{ overflowY: "auto", maxHeight: 280 }}>
        {visible.map(category => {
          const active = applied.includes(category.displayName || "");
          return (
            <MenuItem key={category.id} onClick={() => onToggle(category)}>
              <ListItemIcon><ColorDot color={presetColor(category.color)} /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ noWrap: true }}>{category.displayName}</ListItemText>
              {active && <Check fontSize="small" />}
            </MenuItem>
          );
        })}
        {categories.length === 0 && <Typography variant="body2" sx={{ px: 2, py: 1, color: "text.secondary" }}>{t("No categories yet")}</Typography>}
      </Box>
      <Divider />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5 }} onKeyDown={e => e.stopPropagation()}>
        <IconButton size="small" onClick={() => setNewColor(CATEGORY_PRESETS[(CATEGORY_PRESETS.findIndex(p => p.preset === newColor) + 1) % CATEGORY_PRESETS.length].preset)} aria-label={t("Change color")}>
          <ColorDot color={presetColor(newColor)} size={14} />
        </IconButton>
        <InputBase
          placeholder={t("New category")}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
          sx={{ flex: 1, fontSize: 14 }}
          inputProps={{ "aria-label": t("New category") }}
        />
        <IconButton size="small" onClick={handleCreate} disabled={!newName.trim()} aria-label={t("Add")}><Add fontSize="small" /></IconButton>
      </Box>
      <Divider />
      {applied.length > 0 && (
        <MenuItem onClick={() => { onClear(); onClose(); }}>
          <ListItemIcon><LabelOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>{t("Clear all categories")}</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={() => { onClose(); setManage(true); }}>
        <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
        <ListItemText>{t("Manage categories")}</ListItemText>
      </MenuItem>
    </Menu>

    <Dialog open={manage} onClose={() => setManage(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t("Categories")}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
          <TextField size="small" label={t("New category")} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreate(); }} sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} disabled={!newName.trim()}>{t("Add")}</Button>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 3 }}>
          {CATEGORY_PRESETS.map(p => (
            <Tooltip key={p.preset} title={t(p.label)}>
              <Box component="button" type="button" onClick={() => setNewColor(p.preset)} aria-label={p.label} aria-pressed={newColor === p.preset}
                sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: p.color, border: "2px solid", borderColor: newColor === p.preset ? "text.primary" : "transparent", cursor: "pointer", p: 0 }} />
            </Tooltip>
          ))}
        </Box>
        {categories.map(category => (
          <Box key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, borderBottom: 1, borderColor: "divider" }}>
            <Label sx={{ color: presetColor(category.color) }} />
            <Typography sx={{ flex: 1 }} noWrap>{category.displayName}</Typography>
            <TextField
              select
              size="small"
              value={category.color || "none"}
              onChange={e => dispatch(updateCategory({ id: category.id!, color: e.target.value }))}
              SelectProps={{ renderValue: (v: unknown) => <ColorDot color={presetColor(String(v))} /> }}
              sx={{ width: 72 }}
              inputProps={{ "aria-label": t("Color") }}
            >
              {CATEGORY_PRESETS.map(p => (
                <MenuItem key={p.preset} value={p.preset}><ColorDot color={p.color} /><Box component="span" sx={{ ml: 1 }}>{t(p.label)}</Box></MenuItem>
              ))}
            </TextField>
            <Tooltip title={t("Delete")}>
              <IconButton size="small" onClick={() => dispatch(deleteCategory(category.id!))} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        ))}
        {categories.length === 0 && <Typography color="text.secondary">{t("No categories yet")}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setManage(false)}>{t("Close")}</Button>
      </DialogActions>
    </Dialog>
  </>;
};

export default CategoryMenu;
