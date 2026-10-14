// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, DeleteOutline, Edit, RuleOutlined } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Importance, MessageRule } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createRule, deleteRule, loadRules, updateRule } from "../settingsSlice";
import { loadFolders } from "../../mail/mailSlice";
import { selectFlatFolders } from "../../mail/selectors";
import { folderLabel } from "../../mail/components/FolderPane";
import RecipientField from "../../mail/components/RecipientField";
import { Section } from "./GeneralSettings";
import EmptyState from "../../../components/common/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { describeRule, draftHasAction, draftHasCondition, hasUnsupported, type RuleDraft, splitList as split, toDraft, toRule, unsupportedParts } from "../rules";

const RuleEditor = ({ rule, sequence, onClose }: { rule?: MessageRule; sequence: number; onClose: () => void }) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const folders = useTypeSelector(selectFlatFolders);
  const categories = useTypeSelector(state => state.mail.categories);
  const [draft, setDraft] = useState<RuleDraft>(() => toDraft(rule));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof RuleDraft>(key: K, value: RuleDraft[K]) => setDraft({ ...draft, [key]: value });

  const hasCondition = draftHasCondition(draft, rule);
  const hasAction = draftHasAction(draft, rule);
  const unsupported = useMemo(() => unsupportedParts(rule), [rule]);

  const save = async () => {
    setBusy(true);
    const payload = toRule(draft, rule?.sequence || sequence, rule);
    const result = rule?.id ? await dispatch(updateRule({ id: rule.id, rule: payload })) : await dispatch(createRule(payload));
    setBusy(false);
    if (createRule.fulfilled.match(result) || updateRule.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{rule ? t("Edit rule") : t("New rule")}</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {hasUnsupported(unsupported) && (
          <Alert severity="info">
            {t("This rule has parts that can't be edited here. They are kept when you save.")}
            {unsupported.conditions.length > 0 && <Box>{t("Conditions: {{list}}", { list: unsupported.conditions.join(", ") })}</Box>}
            {unsupported.actions.length > 0 && <Box>{t("Actions: {{list}}", { list: unsupported.actions.join(", ") })}</Box>}
            {unsupported.exceptions && <Box>{t("Exceptions")}</Box>}
          </Alert>
        )}
        <TextField label={t("Rule name")} value={draft.displayName} onChange={e => set("displayName", e.target.value)} autoFocus required />
        <Typography variant="subtitle2">{t("Apply to messages that match all of these conditions")}</Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, px: 1.5, py: 0.5 }}>
          <RecipientField label={t("From")} value={draft.fromAddresses} onChange={v => set("fromAddresses", v)} />
        </Box>
        <TextField label={t("Sender name or address contains")} value={draft.senderContains} onChange={e => set("senderContains", e.target.value)} helperText={t("Separate several words with commas")} />
        <TextField label={t("Subject contains")} value={draft.subjectContains} onChange={e => set("subjectContains", e.target.value)} />
        <TextField label={t("Body contains")} value={draft.bodyContains} onChange={e => set("bodyContains", e.target.value)} />
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField select label={t("Importance")} value={draft.importance} onChange={e => set("importance", e.target.value as Importance | "")} sx={{ minWidth: 160 }}>
            <MenuItem value="">{t("Any")}</MenuItem><MenuItem value="high">{t("High")}</MenuItem><MenuItem value="normal">{t("Normal")}</MenuItem><MenuItem value="low">{t("Low")}</MenuItem>
          </TextField>
          <FormControlLabel control={<Checkbox checked={draft.hasAttachments} onChange={e => set("hasAttachments", e.target.checked)} />} label={t("Has attachments")} />
          <FormControlLabel control={<Checkbox checked={draft.sentToMe} onChange={e => set("sentToMe", e.target.checked)} />} label={t("Sent directly to me")} />
        </Box>
        <Divider />
        <Typography variant="subtitle2">{t("Do the following")}</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField select label={t("Move to")} value={draft.moveToFolder} onChange={e => set("moveToFolder", e.target.value)} sx={{ flex: 1, minWidth: 200 }}>
            <MenuItem value="">—</MenuItem>
            {folders.map(f => <MenuItem key={f.id} value={f.id!} sx={{ pl: 2 + f.depth * 1.5 }}>{folderLabel(f, t)}</MenuItem>)}
          </TextField>
          <TextField select label={t("Copy to")} value={draft.copyToFolder} onChange={e => set("copyToFolder", e.target.value)} sx={{ flex: 1, minWidth: 200 }}>
            <MenuItem value="">—</MenuItem>
            {folders.map(f => <MenuItem key={f.id} value={f.id!} sx={{ pl: 2 + f.depth * 1.5 }}>{folderLabel(f, t)}</MenuItem>)}
          </TextField>
        </Box>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, px: 1.5, py: 0.5 }}>
          <RecipientField label={t("Forward to")} value={draft.forwardTo} onChange={v => set("forwardTo", v)} />
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField select label={t("Categorize")} value={draft.assignCategories} onChange={e => set("assignCategories", typeof e.target.value === "string" ? split(e.target.value) : (e.target.value as unknown as string[]))} SelectProps={{ multiple: true, renderValue: v => (v as string[]).join(", ") }} sx={{ flex: 1, minWidth: 200 }}>
            {categories.map(c => <MenuItem key={c.id} value={c.displayName!}>{c.displayName}</MenuItem>)}
          </TextField>
          <TextField select label={t("Mark importance")} value={draft.markImportance} onChange={e => set("markImportance", e.target.value as Importance | "")} sx={{ minWidth: 160 }}>
            <MenuItem value="">—</MenuItem><MenuItem value="high">{t("High")}</MenuItem><MenuItem value="normal">{t("Normal")}</MenuItem><MenuItem value="low">{t("Low")}</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControlLabel control={<Checkbox checked={draft.markAsRead} onChange={e => set("markAsRead", e.target.checked)} />} label={t("Mark as read")} />
          <FormControlLabel control={<Checkbox checked={draft.deleteMessage} onChange={e => set("deleteMessage", e.target.checked)} />} label={t("Delete")} />
          <FormControlLabel control={<Checkbox checked={draft.stopProcessingRules} onChange={e => set("stopProcessingRules", e.target.checked)} />} label={t("Stop processing more rules")} />
        </Box>
        <FormControlLabel control={<Switch checked={draft.isEnabled} onChange={e => set("isEnabled", e.target.checked)} />} label={t("Rule is enabled")} />
        {!hasCondition && <Alert severity="info">{t("Without conditions the rule applies to all incoming messages.")}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={save} disabled={busy || !draft.displayName.trim() || !hasAction}>{t("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export const RulesSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { rules, rulesLoaded } = useTypeSelector(state => state.settings);
  const folders = useTypeSelector(selectFlatFolders);
  const [editor, setEditor] = useState<{ rule?: MessageRule } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MessageRule | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    dispatch(loadRules());
    if (folders.length === 0) dispatch(loadFolders());
  }, []);

  const folderName = useMemo(() => (id: string) => { const f = folders.find(x => x.id === id); return f ? folderLabel(f, t) : t("a folder"); }, [folders, t]);
  const sorted = useMemo(() => [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)), [rules]);

  // Renumber from the new order one request at a time, then reload the server's numbering
  const move = async (rule: MessageRule, direction: -1 | 1) => {
    const idx = sorted.findIndex(r => r.id === rule.id);
    if (!sorted[idx + direction]) return;
    const order = [...sorted];
    [order[idx], order[idx + direction]] = [order[idx + direction], order[idx]];
    setMoving(true);
    for (const [i, r] of order.entries()) {
      if (r.sequence === i + 1) continue;
      const result = await dispatch(updateRule({ id: r.id!, rule: { sequence: i + 1 } }));
      if (!updateRule.fulfilled.match(result)) break;
    }
    await dispatch(loadRules());
    setMoving(false);
  };

  return (
    <Section title={t("Inbox rules")} description={t("Rules are applied by the server to messages arriving in your inbox, in the order shown.")}>
      <Button variant="contained" startIcon={<Add />} onClick={() => setEditor({})} sx={{ mb: 2 }}>{t("Add new rule")}</Button>
      {rulesLoaded && sorted.length === 0 && <EmptyState icon={<RuleOutlined />} title={t("No rules yet")} description={t("Create a rule to move, categorize or forward incoming mail automatically.")} />}
      {sorted.map((rule, idx) => (
        <Box key={rule.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Switch size="small" checked={rule.isEnabled !== false} onChange={e => dispatch(updateRule({ id: rule.id!, rule: { isEnabled: e.target.checked } }))} inputProps={{ "aria-label": t("Enable rule {{name}}", { name: rule.displayName }) }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{rule.displayName}{rule.hasError && <Chip size="small" color="error" label={t("Error")} sx={{ ml: 1 }} />}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{describeRule(rule, folderName, t)}</Typography>
          </Box>
          <Tooltip title={t("Move up")}><span><IconButton size="small" disabled={moving || idx === 0} onClick={() => move(rule, -1)} aria-label={t("Move rule {{name}} up", { name: rule.displayName })}><ArrowUpward fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title={t("Move down")}><span><IconButton size="small" disabled={moving || idx === sorted.length - 1} onClick={() => move(rule, 1)} aria-label={t("Move rule {{name}} down", { name: rule.displayName })}><ArrowDownward fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title={t("Edit")}><IconButton size="small" onClick={() => setEditor({ rule })} aria-label={t("Edit rule {{name}}", { name: rule.displayName })}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t("Delete")}><IconButton size="small" onClick={() => setConfirmDelete(rule)} aria-label={t("Delete rule {{name}}", { name: rule.displayName })}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
        </Box>
      ))}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={t("Delete rule {{name}}?", { name: confirmDelete?.displayName || "" })}
        description={t("The rule is removed from the server and cannot be restored.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={() => confirmDelete?.id && dispatch(deleteRule(confirmDelete.id))}
        onClose={() => setConfirmDelete(null)}
      />
      {editor && <RuleEditor rule={editor.rule} sequence={(sorted[sorted.length - 1]?.sequence || 0) + 1} onClose={() => setEditor(null)} />}
    </Section>
  );
};
