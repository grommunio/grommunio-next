// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, DeleteOutline, Edit, RuleOutlined } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Importance, MessageRule, Recipient } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createRule, deleteRule, loadRules, updateRule } from "../settingsSlice";
import { loadFolders } from "../../mail/mailSlice";
import { selectFlatFolders } from "../../mail/selectors";
import { folderLabel } from "../../mail/components/FolderPane";
import RecipientField from "../../mail/components/RecipientField";
import { Section } from "./GeneralSettings";
import EmptyState from "../../../components/common/EmptyState";

type RuleDraft = {
  displayName: string;
  isEnabled: boolean;
  fromAddresses: Recipient[];
  senderContains: string;
  subjectContains: string;
  bodyContains: string;
  importance: Importance | "";
  hasAttachments: boolean;
  sentToMe: boolean;
  moveToFolder: string;
  copyToFolder: string;
  markAsRead: boolean;
  deleteMessage: boolean;
  forwardTo: Recipient[];
  assignCategories: string[];
  markImportance: Importance | "";
  stopProcessingRules: boolean;
};

const split = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

function toDraft(rule?: MessageRule): RuleDraft {
  const c = rule?.conditions || {};
  const a = rule?.actions || {};
  return {
    displayName: rule?.displayName || "",
    isEnabled: rule?.isEnabled !== false,
    fromAddresses: c.fromAddresses || [],
    senderContains: (c.senderContains || []).join(", "),
    subjectContains: (c.subjectContains || []).join(", "),
    bodyContains: (c.bodyContains || []).join(", "),
    importance: c.importance || "",
    hasAttachments: Boolean(c.hasAttachments),
    sentToMe: Boolean(c.sentToMe),
    moveToFolder: a.moveToFolder || "",
    copyToFolder: a.copyToFolder || "",
    markAsRead: Boolean(a.markAsRead),
    deleteMessage: Boolean(a.delete),
    forwardTo: a.forwardTo || [],
    assignCategories: a.assignCategories || [],
    markImportance: a.markImportance || "",
    stopProcessingRules: a.stopProcessingRules !== false,
  };
}

function toRule(draft: RuleDraft, sequence: number): MessageRule {
  const conditions: MessageRule["conditions"] = {};
  if (draft.fromAddresses.length) conditions.fromAddresses = draft.fromAddresses.map(r => ({ emailAddress: { address: r.emailAddress?.address, name: r.emailAddress?.name || r.emailAddress?.address } }));
  if (split(draft.senderContains).length) conditions.senderContains = split(draft.senderContains);
  if (split(draft.subjectContains).length) conditions.subjectContains = split(draft.subjectContains);
  if (split(draft.bodyContains).length) conditions.bodyContains = split(draft.bodyContains);
  if (draft.importance) conditions.importance = draft.importance as Importance;
  if (draft.hasAttachments) conditions.hasAttachments = true;
  if (draft.sentToMe) conditions.sentToMe = true;
  const actions: MessageRule["actions"] = { stopProcessingRules: draft.stopProcessingRules };
  if (draft.moveToFolder) actions.moveToFolder = draft.moveToFolder;
  if (draft.copyToFolder) actions.copyToFolder = draft.copyToFolder;
  if (draft.markAsRead) actions.markAsRead = true;
  if (draft.deleteMessage) actions.delete = true;
  if (draft.forwardTo.length) actions.forwardTo = draft.forwardTo.map(r => ({ emailAddress: { address: r.emailAddress?.address, name: r.emailAddress?.name || r.emailAddress?.address } }));
  if (draft.assignCategories.length) actions.assignCategories = draft.assignCategories;
  if (draft.markImportance) actions.markImportance = draft.markImportance as Importance;
  return { displayName: draft.displayName.trim(), sequence, isEnabled: draft.isEnabled, conditions, actions };
}

const RuleEditor = ({ rule, sequence, onClose }: { rule?: MessageRule; sequence: number; onClose: () => void }) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const folders = useTypeSelector(selectFlatFolders);
  const categories = useTypeSelector(state => state.mail.categories);
  const [draft, setDraft] = useState<RuleDraft>(() => toDraft(rule));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof RuleDraft>(key: K, value: RuleDraft[K]) => setDraft({ ...draft, [key]: value });

  const hasCondition = draft.fromAddresses.length || split(draft.senderContains).length || split(draft.subjectContains).length || split(draft.bodyContains).length || draft.importance || draft.hasAttachments || draft.sentToMe;
  const hasAction = draft.moveToFolder || draft.copyToFolder || draft.markAsRead || draft.deleteMessage || draft.forwardTo.length || draft.assignCategories.length || draft.markImportance;

  const save = async () => {
    setBusy(true);
    const payload = toRule(draft, rule?.sequence || sequence);
    const result = rule?.id ? await dispatch(updateRule({ id: rule.id, rule: payload })) : await dispatch(createRule(payload));
    setBusy(false);
    if (createRule.fulfilled.match(result) || updateRule.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{rule ? t("Edit rule") : t("New rule")}</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={save} disabled={busy || !draft.displayName.trim() || !hasCondition || !hasAction}>{t("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

function describeRule(rule: MessageRule, folderName: (id: string) => string, t: (k: string, o?: any) => string): string {
  const c = rule.conditions || {};
  const a = rule.actions || {};
  const conds: string[] = [];
  if (c.fromAddresses?.length) conds.push(t("from {{list}}", { list: c.fromAddresses.map(r => r.emailAddress?.name || r.emailAddress?.address).join(", ") }));
  if (c.senderContains?.length) conds.push(t("sender contains {{list}}", { list: c.senderContains.join(", ") }));
  if (c.subjectContains?.length) conds.push(t("subject contains {{list}}", { list: c.subjectContains.join(", ") }));
  if (c.bodyContains?.length) conds.push(t("body contains {{list}}", { list: c.bodyContains.join(", ") }));
  if (c.importance) conds.push(t("importance is {{value}}", { value: c.importance }));
  if (c.hasAttachments) conds.push(t("has attachments"));
  if (c.sentToMe) conds.push(t("sent to me"));
  const acts: string[] = [];
  if (a.moveToFolder) acts.push(t("move to {{folder}}", { folder: folderName(a.moveToFolder) }));
  if (a.copyToFolder) acts.push(t("copy to {{folder}}", { folder: folderName(a.copyToFolder) }));
  if (a.forwardTo?.length) acts.push(t("forward to {{list}}", { list: a.forwardTo.map(r => r.emailAddress?.address).join(", ") }));
  if (a.assignCategories?.length) acts.push(t("categorize as {{list}}", { list: a.assignCategories.join(", ") }));
  if (a.markAsRead) acts.push(t("mark as read"));
  if (a.markImportance) acts.push(t("mark importance {{value}}", { value: a.markImportance }));
  if (a.delete) acts.push(t("delete"));
  return `${conds.join(" · ") || t("all messages")} → ${acts.join(", ")}`;
}

export const RulesSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { rules, rulesLoaded } = useTypeSelector(state => state.settings);
  const folders = useTypeSelector(selectFlatFolders);
  const [editor, setEditor] = useState<{ rule?: MessageRule } | null>(null);

  useEffect(() => {
    dispatch(loadRules());
    if (folders.length === 0) dispatch(loadFolders());
  }, []);

  const folderName = useMemo(() => (id: string) => { const f = folders.find(x => x.id === id); return f ? folderLabel(f, t) : t("a folder"); }, [folders, t]);
  const sorted = useMemo(() => [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)), [rules]);

  const move = (rule: MessageRule, direction: -1 | 1) => {
    const idx = sorted.findIndex(r => r.id === rule.id);
    const other = sorted[idx + direction];
    if (!other) return;
    dispatch(updateRule({ id: rule.id!, rule: { sequence: other.sequence } }));
    dispatch(updateRule({ id: other.id!, rule: { sequence: rule.sequence } }));
  };

  return (
    <Section title={t("Inbox rules")} description={t("Rules are applied by the server to messages arriving in your inbox, in the order shown.")}>
      <Button variant="contained" startIcon={<Add />} onClick={() => setEditor({})} sx={{ mb: 2 }}>{t("Add new rule")}</Button>
      {rulesLoaded && sorted.length === 0 && <EmptyState icon={<RuleOutlined />} title={t("No rules yet")} description={t("Create a rule to move, categorize or forward incoming mail automatically.")} />}
      {sorted.map((rule, idx) => (
        <Box key={rule.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Switch size="small" checked={rule.isEnabled !== false} onChange={e => dispatch(updateRule({ id: rule.id!, rule: { isEnabled: e.target.checked } }))} inputProps={{ "aria-label": t("Rule is enabled") }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{rule.displayName}{rule.hasError && <Chip size="small" color="error" label={t("Error")} sx={{ ml: 1 }} />}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{describeRule(rule, folderName, t)}</Typography>
          </Box>
          <Tooltip title={t("Move up")}><span><IconButton size="small" disabled={idx === 0} onClick={() => move(rule, -1)} aria-label={t("Move up")}><ArrowUpward fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title={t("Move down")}><span><IconButton size="small" disabled={idx === sorted.length - 1} onClick={() => move(rule, 1)} aria-label={t("Move down")}><ArrowDownward fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title={t("Edit")}><IconButton size="small" onClick={() => setEditor({ rule })} aria-label={t("Edit")}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t("Delete")}><IconButton size="small" onClick={() => dispatch(deleteRule(rule.id!))} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
        </Box>
      ))}
      {editor && <RuleEditor rule={editor.rule} sequence={(sorted[sorted.length - 1]?.sequence || 0) + 1} onClose={() => setEditor(null)} />}
    </Section>
  );
};
