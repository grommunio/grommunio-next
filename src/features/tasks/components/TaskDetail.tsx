// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, Chip, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { Add, ArrowBack, CalendarTodayOutlined, Check, Close, DeleteOutline, LabelOutlined, NotificationsOutlined, RadioButtonUnchecked, Repeat, Star, StarBorder, CheckCircle } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { KeyboardEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChecklistItem, PatternedRecurrence, TodoTask } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { addChecklistItem, deleteChecklistItem, deleteTask, updateChecklistItem, updateTask } from "../tasksSlice";
import { dayjs } from "../../calendar/dates";
import { browserTimeZone } from "../../calendar/dates";
import { presetColor } from "../../mail/categories";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

type TaskDetailProps = {
  listId: string;
  task: TodoTask;
  onClose: () => void;
  onDeleted: () => void;
};

const REPEAT_OPTIONS: Array<{ key: string; label: string; recurrence: PatternedRecurrence | null }> = [
  { key: "none", label: "Never", recurrence: null },
  { key: "daily", label: "Daily", recurrence: { pattern: { type: "daily", interval: 1 }, range: { type: "noEnd" } } },
  { key: "weekdays", label: "Weekdays", recurrence: { pattern: { type: "weekly", interval: 1, daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"] }, range: { type: "noEnd" } } },
  { key: "weekly", label: "Weekly", recurrence: { pattern: { type: "weekly", interval: 1 }, range: { type: "noEnd" } } },
  { key: "monthly", label: "Monthly", recurrence: { pattern: { type: "absoluteMonthly", interval: 1 }, range: { type: "noEnd" } } },
  { key: "yearly", label: "Yearly", recurrence: { pattern: { type: "absoluteYearly", interval: 1 }, range: { type: "noEnd" } } },
];

function repeatKey(recurrence?: PatternedRecurrence | null): string {
  if (!recurrence?.pattern) return "none";
  const p = recurrence.pattern;
  if (p.type === "daily") return "daily";
  if (p.type === "weekly") return (p.daysOfWeek?.length || 0) >= 5 && !p.daysOfWeek?.includes("saturday") ? "weekdays" : "weekly";
  if (p.type?.includes("Monthly")) return "monthly";
  if (p.type?.includes("Yearly")) return "yearly";
  return "none";
}

const TaskDetail = ({ listId, task, onClose, onDeleted }: TaskDetailProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const categories = useTypeSelector(state => state.mail.categories);
  const [title, setTitle] = useState(task.title || "");
  const [notes, setNotes] = useState(task.body?.content || "");
  const [newStep, setNewStep] = useState("");
  const [editingStep, setEditingStep] = useState<{ id: string; value: string } | null>(null);
  const [repeatAnchor, setRepeatAnchor] = useState<HTMLElement | null>(null);
  const [catAnchor, setCatAnchor] = useState<HTMLElement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(task.title || "");
    setNotes(task.body?.content || "");
  }, [task.id, task.title, task.body?.content]);

  const patch = (props: Partial<TodoTask>) => dispatch(updateTask({ listId, task: { id: task.id, ...props } }));
  const completed = task.status === "completed";
  const steps = task.checklistItems || [];
  const doneSteps = steps.filter(s => s.isChecked).length;

  const commitTitle = () => { if (title.trim() && title !== task.title) patch({ title: title.trim() }); else setTitle(task.title || ""); };
  const commitNotes = () => { if (notes !== (task.body?.content || "")) patch({ body: { contentType: "text", content: notes } }); };

  const addStep = () => {
    if (!newStep.trim()) return;
    dispatch(addChecklistItem({ listId, taskId: task.id!, displayName: newStep.trim() }));
    setNewStep("");
  };

  const commitStep = () => {
    if (!editingStep) return;
    const item = steps.find(s => s.id === editingStep.id);
    if (item && editingStep.value.trim() && editingStep.value !== item.displayName) {
      dispatch(updateChecklistItem({ listId, taskId: task.id!, item: { id: item.id, displayName: editingStep.value.trim() } }));
    }
    setEditingStep(null);
  };

  const toggleStep = (item: ChecklistItem) => dispatch(updateChecklistItem({ listId, taskId: task.id!, item: { id: item.id, isChecked: !item.isChecked } }));

  const handleDelete = async () => {
    const result = await dispatch(deleteTask({ listId, taskId: task.id! }));
    if (deleteTask.fulfilled.match(result)) onDeleted();
  };

  const due = task.dueDateTime?.dateTime ? dayjs(task.dueDateTime.dateTime) : null;
  const reminder = task.reminderDateTime?.dateTime ? dayjs.utc(task.reminderDateTime.dateTime).local() : null;
  const created = task.createdDateTime ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(task.createdDateTime)) : "";
  const completedAt = task.completedDateTime?.dateTime ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(task.completedDateTime.dateTime)) : "";

  const onKey = (commit: () => void, cancel?: () => void) => (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); (e.target as HTMLElement).blur(); }
    if (e.key === "Escape") cancel?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }} aria-label={t("Task details")}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
        <IconButton size="small" onClick={onClose} aria-label={t("Close")} sx={{ display: { md: "none" } }}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onClose} aria-label={t("Close")} sx={{ display: { xs: "none", md: "inline-flex" } }}><Close /></IconButton>
      </Box>
      <Box sx={{ px: 2, display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Checkbox icon={<RadioButtonUnchecked />} checkedIcon={<CheckCircle />} checked={completed} onChange={() => patch({ status: completed ? "notStarted" : "completed" })} inputProps={{ "aria-label": t("Mark as completed") }} />
        <InputBase
          fullWidth
          multiline
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={onKey(commitTitle, () => setTitle(task.title || ""))}
          sx={{ fontSize: 18, fontWeight: 600, mt: 0.5, textDecoration: completed ? "line-through" : "none", color: completed ? "text.secondary" : "text.primary" }}
          inputProps={{ "aria-label": t("Title") }}
        />
        <Tooltip title={task.importance === "high" ? t("Remove importance") : t("Mark as important")}>
          <IconButton onClick={() => patch({ importance: task.importance === "high" ? "normal" : "high" })} aria-pressed={task.importance === "high"} aria-label={t("Important")}>
            {task.importance === "high" ? <Star color="primary" /> : <StarBorder />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 2, pl: 7, pb: 1 }}>
        {steps.map(item => (
          <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 0.5, "&:hover .step-delete": { opacity: 1 } }}>
            <Checkbox size="small" checked={Boolean(item.isChecked)} onChange={() => toggleStep(item)} inputProps={{ "aria-label": item.displayName || "" }} />
            {editingStep?.id === item.id ? (
              <InputBase autoFocus fullWidth value={editingStep?.value || ""} onChange={e => setEditingStep({ id: item.id!, value: e.target.value })} onBlur={commitStep} onKeyDown={onKey(commitStep, () => setEditingStep(null))} sx={{ fontSize: 14 }} />
            ) : (
              <Typography variant="body2" onClick={() => setEditingStep({ id: item.id!, value: item.displayName || "" })} sx={{ flex: 1, cursor: "text", textDecoration: item.isChecked ? "line-through" : "none", color: item.isChecked ? "text.secondary" : "text.primary" }}>
                {item.displayName}
              </Typography>
            )}
            <IconButton className="step-delete" size="small" onClick={() => dispatch(deleteChecklistItem({ listId, taskId: task.id!, itemId: item.id! }))} sx={{ opacity: 0 }} aria-label={t("Delete step")}><Close fontSize="small" /></IconButton>
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Add fontSize="small" color="primary" sx={{ mx: 1.1 }} />
          <InputBase fullWidth placeholder={steps.length ? t("Next step") : t("Add step")} value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={onKey(addStep)} onBlur={addStep} sx={{ fontSize: 14 }} inputProps={{ "aria-label": t("Add step") }} />
        </Box>
        {steps.length > 0 && <Typography variant="caption" color="text.secondary">{t("{{done}} of {{total}} steps", { done: doneSteps, total: steps.length })}</Typography>}
      </Box>

      <Divider />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
        <Box sx={{ px: 2, py: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44 }}>
            <CalendarTodayOutlined fontSize="small" color={due ? "primary" : "action"} />
            <DatePicker
              value={due}
              onChange={v => patch({ dueDateTime: v && v.isValid() ? { dateTime: v.format("YYYY-MM-DDT00:00:00"), timeZone: browserTimeZone() } : null })}
              slotProps={{ textField: { size: "small", variant: "standard", placeholder: t("Add due date"), InputProps: { disableUnderline: true }, sx: { flex: 1 } }, field: { clearable: true } }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44 }}>
            <NotificationsOutlined fontSize="small" color={reminder ? "primary" : "action"} />
            <DateTimePicker
              value={reminder}
              onChange={v => patch({ reminderDateTime: v && v.isValid() ? { dateTime: v.utc().format("YYYY-MM-DDTHH:mm:ss"), timeZone: "UTC" } : null, isReminderOn: Boolean(v) })}
              slotProps={{ textField: { size: "small", variant: "standard", placeholder: t("Remind me"), InputProps: { disableUnderline: true }, sx: { flex: 1 } }, field: { clearable: true } }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44 }}>
            <Repeat fontSize="small" color={task.recurrence ? "primary" : "action"} />
            <Button size="small" color={task.recurrence ? "primary" : "inherit"} onClick={e => setRepeatAnchor(e.currentTarget)} sx={{ justifyContent: "flex-start", flex: 1, textTransform: "none", fontWeight: 400 }}>
              {task.recurrence ? t(REPEAT_OPTIONS.find(o => o.key === repeatKey(task.recurrence))?.label || "Repeats") : t("Repeat")}
            </Button>
            <Menu anchorEl={repeatAnchor} open={Boolean(repeatAnchor)} onClose={() => setRepeatAnchor(null)}>
              {REPEAT_OPTIONS.map(o => (
                <MenuItem key={o.key} selected={repeatKey(task.recurrence) === o.key} onClick={() => { setRepeatAnchor(null); patch({ recurrence: o.recurrence, ...(o.recurrence && !due ? { dueDateTime: { dateTime: dayjs().format("YYYY-MM-DDT00:00:00"), timeZone: browserTimeZone() } } : {}) }); }}>
                  {t(o.label)}
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44, flexWrap: "wrap" }}>
            <LabelOutlined fontSize="small" color={task.categories?.length ? "primary" : "action"} />
            <Button size="small" color="inherit" onClick={e => setCatAnchor(e.currentTarget)} sx={{ textTransform: "none", fontWeight: 400 }}>{t("Pick a category")}</Button>
            {task.categories?.map(c => <Chip key={c} size="small" label={c} onDelete={() => patch({ categories: task.categories!.filter(x => x !== c) })} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 1 }} />} />)}
            <Menu anchorEl={catAnchor} open={Boolean(catAnchor)} onClose={() => setCatAnchor(null)}>
              {categories.length === 0 && <MenuItem disabled>{t("No categories yet")}</MenuItem>}
              {categories.map(c => (
                <MenuItem key={c.id} onClick={() => patch({ categories: task.categories?.includes(c.displayName!) ? task.categories.filter(x => x !== c.displayName) : [...(task.categories || []), c.displayName!] })}>
                  <ListItemIcon><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: presetColor(c.color) }} /></ListItemIcon>
                  <ListItemText>{c.displayName}</ListItemText>
                  {task.categories?.includes(c.displayName!) && <Check fontSize="small" />}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </LocalizationProvider>
      <Divider />
      <Box sx={{ px: 2, py: 1.5, flex: 1 }}>
        <TextField
          fullWidth
          multiline
          minRows={4}
          variant="standard"
          placeholder={t("Add note")}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={commitNotes}
          InputProps={{ disableUnderline: true }}
          inputProps={{ "aria-label": t("Notes") }}
        />
      </Box>
      <Divider />
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {completed && completedAt ? t("Completed {{date}}", { date: completedAt }) : t("Created {{date}}", { date: created })}
        </Typography>
        <Tooltip title={t("Delete task")}><IconButton size="small" onClick={() => setConfirmDelete(true)} aria-label={t("Delete task")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
      </Box>
      <ConfirmDialog open={confirmDelete} title={t("Delete task?")} description={t("\"{{title}}\" will be permanently deleted.", { title: task.title })} confirmLabel={t("Delete")} destructive onConfirm={handleDelete} onClose={() => setConfirmDelete(false)} />
    </Box>
  );
};

export default TaskDetail;
