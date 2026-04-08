// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { Add, DeleteOutline, Label } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OutlookCategory } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createCategory, deleteCategory, loadCategories, updateCategory } from "../../mail/mailSlice";
import { CATEGORY_PRESETS, presetColor } from "../../mail/categories";
import { Section } from "./GeneralSettings";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const ColorDot = ({ color }: { color: string }) => <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />;

export const CategoriesSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const categories = useTypeSelector(state => state.mail.categories);
  const [name, setName] = useState("");
  const [color, setColor] = useState("preset7");
  const [confirmDelete, setConfirmDelete] = useState<OutlookCategory | null>(null);

  useEffect(() => { dispatch(loadCategories()); }, []);

  const add = async () => {
    if (!name.trim()) return;
    const result = await dispatch(createCategory({ displayName: name.trim(), color }));
    if (createCategory.fulfilled.match(result)) setName("");
  };

  return (
    <Section title={t("Categories")} description={t("Categories are shared between mail, calendar, contacts and tasks.")}>
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", maxWidth: 560 }}>
        <TextField label={t("New category")} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} sx={{ flex: 1 }} />
        <TextField select value={color} onChange={e => setColor(e.target.value)} sx={{ width: 150 }} SelectProps={{ renderValue: v => <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><ColorDot color={presetColor(String(v))} />{t(CATEGORY_PRESETS.find(p => p.preset === v)?.label || "")}</Box> }} inputProps={{ "aria-label": t("Color") }}>
          {CATEGORY_PRESETS.map(p => <MenuItem key={p.preset} value={p.preset}><ColorDot color={p.color} /><Box component="span" sx={{ ml: 1 }}>{t(p.label)}</Box></MenuItem>)}
        </TextField>
        <Button variant="contained" startIcon={<Add />} onClick={add} disabled={!name.trim()}>{t("Add")}</Button>
      </Box>
      {categories.map(category => (
        <Box key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider", maxWidth: 560 }}>
          <Label sx={{ color: presetColor(category.color) }} />
          <Typography sx={{ flex: 1 }} noWrap>{category.displayName}</Typography>
          <TextField select size="small" value={category.color || "preset7"} onChange={e => dispatch(updateCategory({ id: category.id!, color: e.target.value }))} sx={{ width: 150 }} SelectProps={{ renderValue: v => <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><ColorDot color={presetColor(String(v))} />{t(CATEGORY_PRESETS.find(p => p.preset === v)?.label || "")}</Box> }} inputProps={{ "aria-label": t("Color of {{name}}", { name: category.displayName }) }}>
            {CATEGORY_PRESETS.map(p => <MenuItem key={p.preset} value={p.preset}><ColorDot color={p.color} /><Box component="span" sx={{ ml: 1 }}>{t(p.label)}</Box></MenuItem>)}
          </TextField>
          <Tooltip title={t("Delete")}><IconButton size="small" onClick={() => setConfirmDelete(category)} aria-label={t("Delete category {{name}}", { name: category.displayName })}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
        </Box>
      ))}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={t("Delete category {{name}}?", { name: confirmDelete?.displayName || "" })}
        description={t("The category is removed from your mailbox. Items keep their category name but lose its color.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={() => confirmDelete?.id && dispatch(deleteCategory(confirmDelete.id))}
        onClose={() => setConfirmDelete(null)}
      />
      {categories.length === 0 && <Typography color="text.secondary">{t("No categories yet")}</Typography>}
    </Section>
  );
};
