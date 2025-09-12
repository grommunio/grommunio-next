// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, CircularProgress, IconButton, Menu, Skeleton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Add, ArrowBack, DeleteOutline, Palette, StickyNote2Outlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Editor } from "@tinymce/tinymce-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { purify } from "../../mail/utils-compose";
import { formatListDate } from "../../mail/utils";

const AUTOSAVE_DELAY = 1500;

const NotesView = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { notes, loaded, loading, colors } = useTypeSelector(state => state.notes);
  const [search, setSearch] = useState("");
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<any>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const dark = theme.palette.mode === "dark";

  const selectedId = noteId ? decodeURIComponent(noteId) : undefined;
  const selected = notes.find(n => n.id === selectedId);

  useEffect(() => { dispatch(loadNotes()); }, []);

  useGlobalSearch(t("Search notes"), q => setSearch(q.toLowerCase()), () => setSearch(""));

  const shown = useMemo(() => search ? notes.filter(n => (n.bodyPreview || "").toLowerCase().includes(search) || (n.subject || "").toLowerCase().includes(search)) : notes, [notes, search]);

  const save = useCallback(async () => {
    if (!selected?.id || !editorRef.current) return;
    const content = purify(editorRef.current.getContent());
    if (content === selected.body?.content) { setDirty(false); return; }
    setSaving(true);
    await dispatch(updateNote({ id: selected.id, content }));
    setSaving(false);
    setDirty(false);
  }, [selected?.id, selected?.body?.content, dispatch]);

  const scheduleSave = () => {
    setDirty(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY);
  };

  // Flush pending changes when switching notes or leaving
  useEffect(() => () => { clearTimeout(timer.current); }, []);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); saveRef.current(); } }, [selected?.id]);

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
                <Box component="button" type="button" aria-label={NOTE_COLORS[c].label} onClick={() => { if (selected) dispatch(setNoteColor({ id: selected.id!, color: c })); setColorAnchor(null); }}
                  sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: bg(c), border: "2px solid", borderColor: selected && colorOf(selected) === c ? "text.primary" : "divider", cursor: "pointer", p: 0 }} />
              </Tooltip>
            ))}
          </Box>
        </Menu>
      </Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {showList && (
          <Box sx={{ width: isMobile ? "100%" : 340, flexShrink: 0, borderRight: isMobile ? 0 : 1, borderColor: "divider", bgcolor: "background.paper", overflowY: "auto", p: 1 }} role="listbox" aria-label={t("Notes")}>
            {loading && !loaded && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 1 }} />)}
            {loaded && shown.length === 0 && <EmptyState icon={<StickyNote2Outlined />} title={search ? t("No results") : t("No notes yet")} description={search ? undefined : t("Create a note to jot something down.")} />}
            {shown.map(note => {
              const color = colorOf(note);
              const active = note.id === selectedId;
              return (
                <Box
                  key={note.id}
                  role="option"
                  aria-selected={active}
                  onClick={() => navigate(`/notes/${encodeURIComponent(note.id!)}`)}
                  sx={{ p: 1.5, mb: 1, borderRadius: 2, cursor: "pointer", bgcolor: bg(color), outline: active ? "2px solid" : "none", outlineColor: "primary.main", boxShadow: active ? 2 : 0, "&:hover": { boxShadow: 1 } }}
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
                    onInit={(_e, editor) => { editorRef.current = editor; }}
                    initialValue={selected.body?.content || ""}
                    onEditorChange={scheduleSave}
                    onBlur={() => { clearTimeout(timer.current); save(); }}
                    init={{
                      language: i18n.language.replace("-", "_") === "en_US" ? undefined : i18n.language.replace("-", "_"),
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
                  {t("Last modified")}: {selected.lastModifiedDateTime ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.lastModifiedDateTime)) : ""}
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
