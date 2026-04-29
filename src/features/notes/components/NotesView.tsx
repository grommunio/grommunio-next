// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, CircularProgress, IconButton, Menu, Skeleton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Add, ArrowBack, DeleteOutline, ErrorOutline, Palette, StickyNote2Outlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Editor } from "@tinymce/tinymce-react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { Message } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import EmptyState from "../../../components/common/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { createNote, deleteNote, loadNotes, NOTE_COLORS, NoteColor, setNoteColor, updateNote } from "../notesSlice";
import { TINYMCE_SCRIPT_SRC } from "../../../constants";
import { purify, tinymceLanguage } from "../../mail/utils-compose";
import { formatListDate } from "../../mail/utils";

const AUTOSAVE_DELAY = 1500;

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

const NotesView = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { notes, loaded, loading, colors, error } = useTypeSelector(state => state.notes);
  const [search, setSearch] = useState("");
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // Latest unsaved edit, bound to the note it was made in
  const pending = useRef<{ id: string; content: string } | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const dark = theme.palette.mode === "dark";

  const selectedId = noteId ? decodeURIComponent(noteId) : undefined;
  const selected = notes.find(n => n.id === selectedId);

  useEffect(() => { dispatch(loadNotes()); }, []);

  useGlobalSearch(t("Search notes"), q => setSearch(q.toLowerCase()), () => setSearch(""));

  const shown = useMemo(() => search ? notes.filter(n => (n.bodyPreview || "").toLowerCase().includes(search) || (n.subject || "").toLowerCase().includes(search)) : notes, [notes, search]);

  // Pending edit goes to its own note, not the one shown now
  const flush = async () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const edit = pending.current;
    if (!edit) return;
    pending.current = null;
    const content = purify(edit.content);
    const note = notesRef.current.find(n => n.id === edit.id);
    if (!note || content === note.body?.content) { setDirty(false); return; }
    setSaving(true);
    await dispatch(updateNote({ id: edit.id, content }));
    setSaving(false);
    if (!pending.current) setDirty(false);
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const scheduleSave = (id: string, initial: string) => (content: string) => {
    if (content === initial && !pending.current) return;
    pending.current = { id, content };
    setDirty(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_DELAY);
  };

  // Flush pending changes when switching notes or leaving
  useEffect(() => () => { flushRef.current(); }, [selected?.id]);

  const handleNew = async () => {
    const result = await dispatch(createNote({ content: "<p></p>" }));
    if (createNote.fulfilled.match(result) && result.payload.id) navigate(`/notes/${encodeURIComponent(result.payload.id)}`);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    const result = await dispatch(deleteNote(selected.id));
    if (deleteNote.fulfilled.match(result)) navigate("/notes");
  };

  useKeyboardShortcuts([
    { key: "n", handler: handleNew },
    { key: "Delete", handler: () => selected && setConfirmDelete(true) },
  ]);

  const colorOf = (note: Message): NoteColor => colors[note.id!] || "yellow";
  const bg = (color: NoteColor) => dark ? NOTE_COLORS[color].dark : NOTE_COLORS[color].light;

  const showList = !isMobile || !selectedId;
  const showEditor = !isMobile || Boolean(selectedId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box role="toolbar" aria-label={t("Note actions")} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, minHeight: 48, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleNew} sx={{ mx: 1 }}>{t("New note")}</Button>
        <Tooltip title={t("Color")}><span><IconButton size="small" disabled={!selected} onClick={e => setColorAnchor(e.currentTarget)} aria-label={t("Color")}><Palette /></IconButton></span></Tooltip>
        <Tooltip title={t("Delete")}><span><IconButton size="small" disabled={!selected} onClick={() => setConfirmDelete(true)} aria-label={t("Delete")}><DeleteOutline /></IconButton></span></Tooltip>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{saving ? t("Saving…") : dirty ? t("Unsaved changes") : selected ? t("Saved") : ""}</Typography>
        <Menu anchorEl={colorAnchor} open={Boolean(colorAnchor)} onClose={() => setColorAnchor(null)}>
          <Box sx={{ display: "flex", gap: 1, p: 1.5 }}>
            {(Object.keys(NOTE_COLORS) as NoteColor[]).map(c => (
              <Tooltip key={c} title={t(NOTE_COLORS[c].label)}>
                <Box component="button" type="button" aria-label={t(NOTE_COLORS[c].label)} onClick={() => { if (selected) dispatch(setNoteColor({ id: selected.id!, color: c })); setColorAnchor(null); }}
                  sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: bg(c), border: "2px solid", borderColor: selected && colorOf(selected) === c ? "text.primary" : "divider", cursor: "pointer", p: 0 }} />
              </Tooltip>
            ))}
          </Box>
        </Menu>
      </Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {showList && (
          <Box sx={{ width: isMobile ? "100%" : 340, flexShrink: 0, borderRight: isMobile ? 0 : 1, borderColor: "divider", bgcolor: "background.paper", overflowY: "auto", p: 1 }} role="listbox" aria-label={t("Notes")} onKeyDown={moveOptionFocus}>
            {loading && !loaded && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 1 }} />)}
            {error && !loading && <EmptyState icon={<ErrorOutline />} title={t("Could not load notes")} description={error} action={<Button variant="outlined" onClick={() => dispatch(loadNotes())}>{t("Retry")}</Button>} />}
            {loaded && !error && shown.length === 0 && <EmptyState icon={<StickyNote2Outlined />} title={search ? t("No results") : t("No notes yet")} description={search ? undefined : t("Create a note to jot something down.")} />}
            {shown.map((note, index) => {
              const color = colorOf(note);
              const active = note.id === selectedId;
              const open = () => navigate(`/notes/${encodeURIComponent(note.id!)}`);
              return (
                <Box
                  key={note.id}
                  role="option"
                  aria-selected={active}
                  tabIndex={active || (!shown.some(n => n.id === selectedId) && index === 0) ? 0 : -1}
                  onClick={open}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
                  sx={{ "&:focus-visible": { boxShadow: 3, outline: "2px solid", outlineColor: "primary.main" }, p: 1.5, mb: 1, borderRadius: 2, cursor: "pointer", bgcolor: bg(color), outline: active ? "2px solid" : "none", outlineColor: "primary.main", boxShadow: active ? 2 : 0, "&:hover": { boxShadow: 1 } }}
                >
                  <Typography variant="subtitle2" noWrap>{note.subject || t("(Empty note)")}</Typography>
                  <Typography variant="body2" sx={{ color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 20 }}>
                    {(note.bodyPreview || "").replace(/\s+/g, " ")}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>{formatListDate(note.lastModifiedDateTime)}</Typography>
                </Box>
              );
            })}
          </Box>
        )}
        {showEditor && (
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: selected ? bg(colorOf(selected)) : "background.paper", transition: "background-color .2s" }}>
            {selected ? (
              <>
                {isMobile && <Box sx={{ p: 1 }}><IconButton onClick={() => navigate("/notes")} aria-label={t("Back")}><ArrowBack /></IconButton></Box>}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, "& .tox-tinymce": { border: "none !important", background: "transparent", flex: 1 }, "& .tox .tox-edit-area__iframe": { background: "transparent !important" }, "& .tox:not(.tox-tinymce-inline) .tox-editor-header": { background: "transparent", boxShadow: "none", borderBottom: "1px solid rgba(0,0,0,0.08)" }, "& .tox .tox-toolbar__primary": { background: "transparent" } }}>
                  <Editor
                    key={selected.id}
                    tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
                    initialValue={selected.body?.content || ""}
                    onEditorChange={scheduleSave(selected.id!, selected.body?.content || "")}
                    onBlur={() => { flush(); }}
                    init={{
                      language: tinymceLanguage(i18n.language),
                      menubar: false, statusbar: false, branding: false, promotion: false,
                      skin: dark ? "oxide-dark" : "oxide",
                      content_css: dark ? "dark" : "default",
                      plugins: "lists link autolink autoresize",
                      toolbar: "bold italic underline strikethrough | bullist numlist | link | removeformat",
                      autoresize_bottom_margin: 24,
                      min_height: 300,
                      auto_focus: true,
                      placeholder: t("Take a note…"),
                      content_style: `body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; background: transparent !important; color: ${dark ? "#e7e9ec" : "#1f2328"}; }`,
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ px: 2, pb: 1, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
                  {t("Last modified")}: {selected.lastModifiedDateTime ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.lastModifiedDateTime)) : ""}
                </Typography>
              </>
            ) : loading && !loaded ? <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Box> : (
              <EmptyState icon={<StickyNote2Outlined />} title={t("Select a note")} description={t("Pick a note from the list or create a new one.")} action={<Button variant="outlined" startIcon={<Add />} onClick={handleNew}>{t("New note")}</Button>} />
            )}
          </Box>
        )}
      </Box>
      <ConfirmDialog open={confirmDelete} title={t("Delete note?")} description={t("This cannot be undone.")} confirmLabel={t("Delete")} destructive onConfirm={handleDelete} onClose={() => setConfirmDelete(false)} />
    </Box>
  );
};

export default NotesView;
