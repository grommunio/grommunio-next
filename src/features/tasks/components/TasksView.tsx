// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, Chip, Collapse, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Skeleton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Add, ErrorOutline, CalendarTodayOutlined, Check, CheckCircle, ChevronRight, DeleteOutline, DriveFileRenameOutline, ExpandMore, FlagOutlined, FormatListBulleted, HomeOutlined, MenuOpen, NotificationsOutlined, RadioButtonUnchecked, Repeat, Star, StarBorder, SwapVert, TaskAltOutlined, VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { TodoTask, TodoTaskList } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import EmptyState from "../../../components/common/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import TaskDetail from "./TaskDetail";
import { createTask, createTaskList, deleteTaskList, loadTaskLists, loadTasks, renameTaskList, setShowCompleted, setTaskSort, TaskSort, updateTask } from "../tasksSlice";
import { loadCategories } from "../../mail/mailSlice";
import { dayjs } from "../../calendar/dates";
import { taskDueDate } from "../taskDates";
import { presetColor } from "../../mail/categories";

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Creation date")
// t("Importance")
// t("Due date")
// t("Alphabetically")
const SORTS: Array<{ value: TaskSort; label: string }> = [
  { value: "default", label: "Creation date" },
  { value: "importance", label: "Importance" },
  { value: "dueDate", label: "Due date" },
  { value: "alphabetical", label: "Alphabetically" },
];

function sortTasks(tasks: TodoTask[], sort: TaskSort): TodoTask[] {
  const copy = [...tasks];
  switch (sort) {
  case "importance": return copy.sort((a, b) => Number(b.importance === "high") - Number(a.importance === "high"));
  case "dueDate": return copy.sort((a, b) => (taskDueDate(a.dueDateTime) || "9999").localeCompare(taskDueDate(b.dueDateTime) || "9999"));
  case "alphabetical": return copy.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
  default: return copy.sort((a, b) => (b.createdDateTime || "").localeCompare(a.createdDateTime || ""));
  }
}

function moveOptionFocus(e: KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const options = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
  if (!options.length) return;
  e.preventDefault();
  const current = options.findIndex(o => o.contains(document.activeElement));
  const next = e.key === "Home" ? 0 : e.key === "End" ? options.length - 1
    : Math.max(0, Math.min(options.length - 1, current + (e.key === "ArrowDown" ? 1 : -1)));
  options[next]?.focus();
}

function dueLabel(task: TodoTask, t: (k: string, o?: any) => string): { text: string; overdue: boolean } | null {
  const date = taskDueDate(task.dueDateTime);
  if (!date) return null;
  const due = dayjs(date).startOf("day");
  const today = dayjs().startOf("day");
  const overdue = due.isBefore(today) && task.status !== "completed";
  if (due.isSame(today)) return { text: t("Today"), overdue: false };
  if (due.isSame(today.add(1, "day"))) return { text: t("Tomorrow"), overdue: false };
  if (due.isSame(today.subtract(1, "day"))) return { text: t("Yesterday"), overdue };
  return { text: due.format(due.isSame(today, "year") ? "ddd, D MMM" : "LL"), overdue };
}

const TasksView = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const params = useParams<{ listId?: string; taskId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { lists, listsLoaded, listsError, tasks, loading, loaded, errors, sort, showCompleted } = useTypeSelector(state => state.tasks);
  const categories = useTypeSelector(state => state.mail.categories);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [listMenu, setListMenu] = useState<{ anchor: { top: number; left: number }; list: TodoTaskList } | null>(null);
  const [editingList, setEditingList] = useState<{ id?: string; value: string } | null>(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState<TodoTaskList | null>(null);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [listsVisible, setListsVisible] = useState(true);

  const listId = params.listId ? decodeURIComponent(params.listId) : undefined;
  const taskId = params.taskId ? decodeURIComponent(params.taskId) : undefined;
  const list = lists.find(l => l.id === listId);
  const listTasks = (listId && tasks[listId]) || [];
  const selectedTask = listTasks.find(t => t.id === taskId);

  useEffect(() => {
    dispatch(loadTaskLists());
    dispatch(loadCategories());
  }, []);

  useEffect(() => {
    if (listsLoaded && !listId) {
      const def = lists.find(l => l.wellknownListName === "defaultList") || lists[0];
      if (def?.id) navigate(`/tasks/${encodeURIComponent(def.id)}`, { replace: true });
    }
  }, [listsLoaded, listId, lists.length]);

  useEffect(() => { if (listId) dispatch(loadTasks({ listId })); }, [listId]);

  useGlobalSearch(t("Search tasks"), q => setSearch(q.toLowerCase()), () => setSearch(""));

  const filtered = useMemo(() => {
    const items = search ? listTasks.filter(x => (x.title || "").toLowerCase().includes(search) || (x.body?.content || "").toLowerCase().includes(search)) : listTasks;
    return { open: sortTasks(items.filter(x => x.status !== "completed"), sort), done: sortTasks(items.filter(x => x.status === "completed"), "default") };
  }, [listTasks, search, sort]);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title || !listId) return;
    setNewTitle("");
    await dispatch(createTask({ listId, task: { title } }));
  };

  const toggleComplete = (task: TodoTask) => (e: MouseEvent) => {
    e.stopPropagation();
    if (listId) dispatch(updateTask({ listId, task: { id: task.id, status: task.status === "completed" ? "notStarted" : "completed" } }));
  };

  const toggleImportant = (task: TodoTask) => (e: MouseEvent) => {
    e.stopPropagation();
    if (listId) dispatch(updateTask({ listId, task: { id: task.id, importance: task.importance === "high" ? "normal" : "high" } }));
  };

  const commitList = () => {
    if (!editingList) return;
    const value = editingList.value.trim();
    if (value) {
      if (editingList.id) dispatch(renameTaskList({ id: editingList.id, displayName: value }));
      else dispatch(createTaskList(value)).then(r => { if (createTaskList.fulfilled.match(r) && r.payload.id) navigate(`/tasks/${encodeURIComponent(r.payload.id)}`); });
    }
    setEditingList(null);
  };

  const onListKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitList();
    if (e.key === "Escape") setEditingList(null);
  };

  useKeyboardShortcuts([
    { key: "n", handler: () => document.getElementById("new-task-input")?.focus() },
    { key: "Escape", handler: () => { if (taskId && listId) navigate(`/tasks/${encodeURIComponent(listId)}`); } },
  ]);

  const listIcon = (l: TodoTaskList) => l.wellknownListName === "defaultList" ? <HomeOutlined fontSize="small" /> : l.wellknownListName === "flaggedEmails" ? <FlagOutlined fontSize="small" /> : <FormatListBulleted fontSize="small" />;
  const listName = (l: TodoTaskList) => l.wellknownListName === "defaultList" ? t("Tasks") : l.wellknownListName === "flaggedEmails" ? t("Flagged email") : l.displayName || "";

  const openTask = (task: TodoTask) => listId && navigate(`/tasks/${encodeURIComponent(listId)}/${encodeURIComponent(task.id!)}`);
  const visibleTasks = [...filtered.open, ...(showCompleted && completedOpen ? filtered.done : [])];
  const focusId = visibleTasks.find(x => x.id === taskId)?.id || visibleTasks[0]?.id;

  const renderTask = (task: TodoTask) => {
    const completed = task.status === "completed";
    const due = dueLabel(task, t);
    const steps = task.checklistItems || [];
    const active = task.id === taskId;
    return (
      <Box
        key={task.id}
        role="option"
        aria-selected={active}
        tabIndex={task.id === focusId ? 0 : -1}
        onClick={() => openTask(task)}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openTask(task); } }}
        sx={{ "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 }, display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, mb: 0.5, borderRadius: 1.5, cursor: "pointer", bgcolor: active ? (theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "primary.main" + "14") : "background.paper", border: 1, borderColor: active ? "primary.main" : "divider", "&:hover": { bgcolor: active ? undefined : "action.hover" } }}
      >
        <Checkbox icon={<RadioButtonUnchecked />} checkedIcon={<CheckCircle />} checked={completed} onClick={toggleComplete(task)} inputProps={{ "aria-label": t("Mark as completed") }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ textDecoration: completed ? "line-through" : "none", color: completed ? "text.secondary" : "text.primary" }}>{task.title}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: 12, flexWrap: "wrap" }}>
            {steps.length > 0 && <span>{t("{{done}} of {{total}}", { done: steps.filter(s => s.isChecked).length, total: steps.length })}</span>}
            {due && <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: due.overdue ? "error.main" : "inherit" }}><CalendarTodayOutlined sx={{ fontSize: 13 }} />{due.text}</Box>}
            {task.isReminderOn && <NotificationsOutlined sx={{ fontSize: 14 }} />}
            {task.recurrence && <Repeat sx={{ fontSize: 14 }} />}
            {task.categories?.map(c => <Chip key={c} size="small" label={c} sx={{ height: 18, fontSize: 11 }} icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 0.75 }} />} />)}
          </Box>
        </Box>
        <IconButton size="small" onClick={toggleImportant(task)} aria-label={t("Important")} aria-pressed={task.importance === "high"}>
          {task.importance === "high" ? <Star color="primary" fontSize="small" /> : <StarBorder fontSize="small" />}
        </IconButton>
      </Box>
    );
  };

  const showMain = !isMobile || !taskId;
  const showDetail = Boolean(selectedTask) && (!isMobile || Boolean(taskId));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box role="toolbar" aria-label={t("Task actions")} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, minHeight: 48, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        {!isMobile && <Tooltip title={t("Toggle lists")}><IconButton size="small" onClick={() => setListsVisible(!listsVisible)} aria-label={t("Toggle lists")}><MenuOpen /></IconButton></Tooltip>}
        <Button variant="contained" startIcon={<Add />} onClick={() => setEditingList({ value: "" })} sx={{ mx: 1 }}>{t("New list")}</Button>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={showCompleted ? t("Hide completed tasks") : t("Show completed tasks")}>
          <IconButton size="small" onClick={() => dispatch(setShowCompleted(!showCompleted))} aria-label={showCompleted ? t("Hide completed tasks") : t("Show completed tasks")}>{showCompleted ? <VisibilityOutlined /> : <VisibilityOffOutlined />}</IconButton>
        </Tooltip>
        <Button size="small" color="inherit" startIcon={<SwapVert />} onClick={e => setSortAnchor(e.currentTarget)}>{t(SORTS.find(s => s.value === sort)?.label || "Sort")}</Button>
        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
          {SORTS.map(s => <MenuItem key={s.value} selected={s.value === sort} onClick={() => { dispatch(setTaskSort(s.value)); setSortAnchor(null); }}><ListItemIcon>{s.value === sort && <Check fontSize="small" />}</ListItemIcon><ListItemText>{t(s.label)}</ListItemText></MenuItem>)}
        </Menu>
      </Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {listsVisible && !isMobile && (
          <Box sx={{ width: 240, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", py: 1, display: "flex", flexDirection: "column" }} role="navigation" aria-label={t("Task lists")}>
            {lists.map(l => {
              const active = l.id === listId;
              const isEditing = editingList?.id === l.id;
              const count = (tasks[l.id!] || []).filter(x => x.status !== "completed").length;
              return (
                <Box key={l.id} role="link" tabIndex={isEditing ? -1 : 0} aria-current={active ? "page" : undefined}
                  onClick={() => navigate(`/tasks/${encodeURIComponent(l.id!)}`)}
                  onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); navigate(`/tasks/${encodeURIComponent(l.id!)}`); } }}
                  onContextMenu={e => { if (l.wellknownListName && l.wellknownListName !== "none") return; e.preventDefault(); setListMenu({ anchor: { top: e.clientY, left: e.clientX }, list: l }); }}
                  sx={{ display: "flex", alignItems: "center", gap: 1, height: 34, mx: 1, px: 1.5, borderRadius: 1.5, cursor: "pointer", color: active ? "primary.main" : "text.primary", bgcolor: active ? (theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "primary.main" + "1a") : "transparent", "&:hover": { bgcolor: active ? undefined : "action.hover" } }}>
                  <Box sx={{ color: active ? "primary.main" : "text.secondary", display: "flex" }}>{listIcon(l)}</Box>
                  {isEditing ? <InputBase autoFocus value={editingList!.value} onChange={e => setEditingList({ id: l.id!, value: e.target.value })} onKeyDown={onListKey} onBlur={commitList} onClick={e => e.stopPropagation()} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} /> :
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>{listName(l)}</Typography>}
                  {!isEditing && loaded[l.id!] && count > 0 && <Typography variant="caption" color="text.secondary">{count}</Typography>}
                </Box>
              );
            })}
            {editingList && !editingList.id && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 34, mx: 1, px: 1.5 }}>
                <FormatListBulleted fontSize="small" sx={{ color: "text.secondary" }} />
                <InputBase autoFocus placeholder={t("List name")} value={editingList.value} onChange={e => setEditingList({ value: e.target.value })} onKeyDown={onListKey} onBlur={commitList} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} />
              </Box>
            )}
            <Box sx={{ flex: 1 }} />
            <Divider />
            <Button startIcon={<Add />} onClick={() => setEditingList({ value: "" })} sx={{ m: 1, justifyContent: "flex-start", color: "text.secondary" }}>{t("New list")}</Button>
          </Box>
        )}
        {showMain && (
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
            {list && (
              <Box sx={{ px: 2, pt: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>{listName(list)}</Typography>
                {list.wellknownListName !== "flaggedEmails" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.5, mb: 2, borderRadius: 1.5, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
                    <Add color="primary" />
                    <InputBase id="new-task-input" fullWidth placeholder={t("Add a task")} value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} inputProps={{ "aria-label": t("Add a task") }} />
                    <Button size="small" onClick={handleAdd} disabled={!newTitle.trim()}>{t("Add")}</Button>
                  </Box>
                )}
              </Box>
            )}
            <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }} role="listbox" aria-label={t("Tasks")} onKeyDown={moveOptionFocus}>
              {listId && loading[listId] && !loaded[listId] && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 0.5 }} />)}
              {listId && errors[listId] && !loading[listId] && (
                <EmptyState icon={<ErrorOutline />} title={t("Could not load tasks")} description={errors[listId]} action={<Button variant="outlined" onClick={() => dispatch(loadTasks({ listId, force: true }))}>{t("Retry")}</Button>} />
              )}
              {!listId && listsError && (
                <EmptyState icon={<ErrorOutline />} title={t("Could not load task lists")} description={listsError} action={<Button variant="outlined" onClick={() => dispatch(loadTaskLists())}>{t("Retry")}</Button>} />
              )}
              {listId && loaded[listId] && !errors[listId] && filtered.open.length === 0 && filtered.done.length === 0 && (
                <EmptyState icon={<TaskAltOutlined />} title={search ? t("No results") : t("No tasks")} description={search ? undefined : t("Add a task above to get started.")} />
              )}
              {filtered.open.map(renderTask)}
              {showCompleted && filtered.done.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button size="small" color="inherit" onClick={() => setCompletedOpen(!completedOpen)} startIcon={completedOpen ? <ExpandMore /> : <ChevronRight />} sx={{ mb: 0.5 }}>{t("Completed")} ({filtered.done.length})</Button>
                  <Collapse in={completedOpen}>{filtered.done.map(renderTask)}</Collapse>
                </Box>
              )}
              {!listId && listsLoaded && lists.length === 0 && <EmptyState icon={<TaskAltOutlined />} title={t("No task lists")} />}
            </Box>
          </Box>
        )}
        {showDetail && selectedTask && listId && (
          <Box sx={{ width: isMobile ? "100%" : 360, flexShrink: 0, borderLeft: isMobile ? 0 : 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <TaskDetail listId={listId} task={selectedTask} onClose={() => navigate(`/tasks/${encodeURIComponent(listId)}`)} onDeleted={() => navigate(`/tasks/${encodeURIComponent(listId)}`)} />
          </Box>
        )}
      </Box>
      <Menu open={Boolean(listMenu)} onClose={() => setListMenu(null)} anchorReference="anchorPosition" anchorPosition={listMenu?.anchor} MenuListProps={{ dense: true }}>
        <MenuItem onClick={() => { setEditingList({ id: listMenu!.list.id!, value: listMenu!.list.displayName || "" }); setListMenu(null); }}><ListItemIcon><DriveFileRenameOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Rename")}</ListItemText></MenuItem>
        <MenuItem onClick={() => { setConfirmDeleteList(listMenu!.list); setListMenu(null); }}><ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Delete list")}</ListItemText></MenuItem>
      </Menu>
      <ConfirmDialog
        open={Boolean(confirmDeleteList)}
        title={t("Delete list")}
        description={t("The list \"{{name}}\" and all its tasks will be deleted.", { name: confirmDeleteList?.displayName })}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={async () => { if (!confirmDeleteList) return; const r = await dispatch(deleteTaskList(confirmDeleteList.id!)); if (deleteTaskList.fulfilled.match(r) && listId === confirmDeleteList.id) navigate("/tasks"); }}
        onClose={() => setConfirmDeleteList(null)}
      />
    </Box>
  );
};

export default TasksView;
