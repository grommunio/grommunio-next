// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, CircularProgress, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import {
  AttachFile, Close, DeleteOutline, Fullscreen, FullscreenExit, KeyboardArrowDown, PriorityHigh, Send,
  ArrowDownward, SaveOutlined, MarkEmailReadOutlined, Check,
} from "@mui/icons-material";
import { Editor } from "@tinymce/tinymce-react";
import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import type { Attachment, FileAttachment, Recipient } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { addDraftAttachments, composeClosed, discardCompose, removeDraftAttachment, saveDraft, sendCompose } from "../mailSlice";
import RecipientField from "./RecipientField";
import AttachmentList from "./AttachmentList";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { TINYMCE_SCRIPT_SRC } from "../../../constants";
import { pushAlertStack } from "../../../actions/alerts";
import { isValidEmail, purify } from "../utils-compose";
import { getAttachment } from "../../../api/messages";

type ComposeProps = {
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

const AUTOSAVE_DELAY = 5000;

const Compose = ({ fullscreen, onToggleFullscreen }: ComposeProps) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const compose = useTypeSelector(state => state.mail.compose);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [to, setTo] = useState<Recipient[]>([]);
  const [cc, setCc] = useState<Recipient[]>([]);
  const [bcc, setBcc] = useState<Recipient[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [importance, setImportance] = useState<"normal" | "high" | "low">("normal");
  const [readReceipt, setReadReceipt] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [optionsAnchor, setOptionsAnchor] = useState<HTMLElement | null>(null);
  const [sendAnchor, setSendAnchor] = useState<HTMLElement | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [dragging, setDragging] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const dirtyRef = useRef(false);

  const key = compose?.key;

  useEffect(() => {
    if (!compose || compose.status === "creating") return;
    const init = compose.initial;
    setTo(init.toRecipients);
    setCc(init.ccRecipients);
    setBcc(init.bccRecipients);
    setShowCc(init.ccRecipients.length > 0);
    setShowBcc(init.bccRecipients.length > 0);
    setSubject(init.subject);
    setImportance((init.importance as "normal" | "high" | "low") || "normal");
    setReadReceipt(init.isReadReceiptRequested);
    setDirty(false);
    dirtyRef.current = false;
  }, [key, compose?.status === "creating"]);

  const currentPatch = useCallback(() => ({
    toRecipients: to,
    ccRecipients: cc,
    bccRecipients: bcc,
    subject,
    body: editorRef.current ? purify(editorRef.current.getContent()) : compose?.initial.body || "",
    importance,
    isReadReceiptRequested: readReceipt,
  }), [to, cc, bcc, subject, importance, readReceipt, compose?.initial.body]);

  const markDirty = () => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setDirty(true);
    }
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (dirtyRef.current) {
        dispatch(saveDraft({ patch: currentPatchRef.current(), silent: true }));
        dirtyRef.current = false;
        setDirty(false);
      }
    }, AUTOSAVE_DELAY);
  };

  const currentPatchRef = useRef(currentPatch);
  currentPatchRef.current = currentPatch;

  useEffect(() => () => clearTimeout(autosaveTimer.current), []);

  useEffect(() => { if (compose && compose.status !== "creating") markDirtyIfChanged(); }, [to, cc, bcc, subject, importance, readReceipt]);
  const initialised = useRef(false);
  const markDirtyIfChanged = () => {
    if (!initialised.current) { initialised.current = true; return; }
    markDirty();
  };
  useEffect(() => { initialised.current = false; }, [key]);

  const recipients = useMemo(() => [...to, ...cc, ...bcc], [to, cc, bcc]);
  const invalid = recipients.filter(r => !isValidEmail(r.emailAddress?.address || ""));

  const handleSend = async () => {
    setSendAnchor(null);
    if (recipients.length === 0) {
      dispatch(pushAlertStack({ message: t("Add at least one recipient"), severity: "warning" }));
      return;
    }
    if (invalid.length) {
      dispatch(pushAlertStack({ message: t("Some addresses are invalid"), severity: "warning" }));
      return;
    }
    clearTimeout(autosaveTimer.current);
    dispatch(sendCompose({ patch: currentPatch() }));
  };

  const handleSave = () => {
    clearTimeout(autosaveTimer.current);
    dirtyRef.current = false;
    setDirty(false);
    dispatch(saveDraft({ patch: currentPatch() }));
  };

  const handleClose = () => {
    clearTimeout(autosaveTimer.current);
    if (dirtyRef.current || (!compose?.draftId && (subject || recipients.length || editorRef.current?.getContent({ format: "text" })?.trim()))) {
      // Keep the draft like Outlook does
      dispatch(saveDraft({ patch: currentPatch(), silent: false })).finally(() => dispatch(composeClosed()));
    } else {
      dispatch(composeClosed());
    }
  };

  const handleDiscard = () => {
    clearTimeout(autosaveTimer.current);
    dispatch(discardCompose());
  };

  const addFiles = (files: FileList | File[] | null) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    dispatch(addDraftAttachments({ files: list, patch: currentPatch() }));
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const fetchContent = async (attachment: Attachment) => {
    if (!compose?.draftId) return attachment as FileAttachment;
    return getAttachment(compose.draftId, attachment.id!);
  };

  if (!compose) return null;

  const busy = compose.status === "creating" || compose.status === "sending";
  const hasContent = to.length > 0 || subject.length > 0;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.paper", position: "relative" }}
      onDragOver={e => { e.preventDefault(); if (!dragging) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      aria-label={t("Compose")}
    >
      {dragging && (
        <Box sx={{ position: "absolute", inset: 8, zIndex: 5, border: "2px dashed", borderColor: "primary.main", borderRadius: 2, bgcolor: "rgba(29,75,153,0.06)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Typography color="primary">{t("Drop files to attach them")}</Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        <Button variant="contained" startIcon={<Send />} onClick={handleSend} disabled={busy || !hasContent} sx={{ pr: 1.5 }}>
          {t("Send")}
        </Button>
        <IconButton size="small" onClick={e => setSendAnchor(e.currentTarget)} disabled={busy} aria-label={t("Send options")} sx={{ ml: -1 }}>
          <KeyboardArrowDown />
        </IconButton>
        <Menu anchorEl={sendAnchor} open={Boolean(sendAnchor)} onClose={() => setSendAnchor(null)}>
          <MenuItem onClick={handleSend}><ListItemIcon><Send fontSize="small" /></ListItemIcon><ListItemText>{t("Send")}</ListItemText></MenuItem>
          <MenuItem onClick={() => { setSendAnchor(null); handleSave(); }}><ListItemIcon><SaveOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Save draft")}</ListItemText></MenuItem>
        </Menu>
        <Tooltip title={t("Attach file")}>
          <IconButton onClick={() => fileInputRef.current?.click()} disabled={busy} aria-label={t("Attach file")}><AttachFile /></IconButton>
        </Tooltip>
        <Tooltip title={importance === "high" ? t("Normal importance") : t("High importance")}>
          <IconButton color={importance === "high" ? "error" : "default"} onClick={() => setImportance(importance === "high" ? "normal" : "high")} aria-pressed={importance === "high"} aria-label={t("High importance")}>
            <PriorityHigh />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("Low importance")}>
          <IconButton color={importance === "low" ? "primary" : "default"} onClick={() => setImportance(importance === "low" ? "normal" : "low")} aria-pressed={importance === "low"} aria-label={t("Low importance")}>
            <ArrowDownward />
          </IconButton>
        </Tooltip>
        <Button size="small" color="inherit" endIcon={<KeyboardArrowDown />} onClick={e => setOptionsAnchor(e.currentTarget)}>{t("Options")}</Button>
        <Menu anchorEl={optionsAnchor} open={Boolean(optionsAnchor)} onClose={() => setOptionsAnchor(null)}>
          <MenuItem onClick={() => { setReadReceipt(!readReceipt); setOptionsAnchor(null); }}>
            <ListItemIcon>{readReceipt ? <Check fontSize="small" /> : <MarkEmailReadOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText>{t("Request a read receipt")}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setShowBcc(true); setOptionsAnchor(null); }}>
            <ListItemText inset>{t("Show Bcc")}</ListItemText>
          </MenuItem>
        </Menu>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1, display: { xs: "none", sm: "block" } }}>
          {compose.status === "saving" ? t("Saving…") : compose.status === "sending" ? t("Sending…") : dirty ? t("Unsaved changes") : compose.lastSaved ? t("Draft saved") : ""}
        </Typography>
        <Tooltip title={t("Discard")}>
          <IconButton onClick={() => (hasContent || compose.draftId ? setConfirmDiscard(true) : handleDiscard())} disabled={busy} aria-label={t("Discard")}><DeleteOutline /></IconButton>
        </Tooltip>
        {onToggleFullscreen && (
          <Tooltip title={fullscreen ? t("Exit full screen") : t("Full screen")}>
            <IconButton onClick={onToggleFullscreen} aria-label={fullscreen ? t("Exit full screen") : t("Full screen")}>{fullscreen ? <FullscreenExit /> : <Fullscreen />}</IconButton>
          </Tooltip>
        )}
        <Tooltip title={t("Close")}>
          <IconButton onClick={handleClose} disabled={compose.status === "sending"} aria-label={t("Close")}><Close /></IconButton>
        </Tooltip>
      </Box>

      {compose.status === "creating" ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
          <Box sx={{ px: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", py: 0.25 }}>
              <RecipientField
                label={t("To")}
                value={to}
                onChange={setTo}
                autoFocus={compose.mode === "new" && to.length === 0}
                endAdornment={<>
                  {!showCc && <Button size="small" onClick={() => setShowCc(true)} sx={{ minWidth: 0 }}>{t("Cc")}</Button>}
                  {!showBcc && <Button size="small" onClick={() => setShowBcc(true)} sx={{ minWidth: 0 }}>{t("Bcc")}</Button>}
                </>}
              />
            </Box>
            {showCc && (
              <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", py: 0.25 }}>
                <RecipientField label={t("Cc")} value={cc} onChange={setCc} />
              </Box>
            )}
            {showBcc && (
              <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", py: 0.25 }}>
                <RecipientField label={t("Bcc")} value={bcc} onChange={setBcc} />
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", py: 0.75 }}>
              <InputBase
                fullWidth
                placeholder={t("Add a subject")}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                autoFocus={compose.mode !== "new" || to.length > 0}
                inputProps={{ "aria-label": t("Subject") }}
                sx={{ fontSize: 15, fontWeight: 500 }}
              />
            </Box>
            {compose.initial.attachments.length > 0 && (
              <Box sx={{ py: 1 }}>
                <AttachmentList
                  dense
                  attachments={compose.initial.attachments}
                  fetchContent={fetchContent}
                  onRemove={attachment => dispatch(removeDraftAttachment(attachment.id!))}
                />
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 320, p: 2, pt: 1, "& .tox-tinymce": { border: "none !important", flex: 1 }, "& .tox .tox-edit-area::before": { border: "none !important" } }}>
            {!editorReady && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>}
            <Editor
              key={key}
              tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
              onInit={(_evt, editor) => { editorRef.current = editor; setEditorReady(true); }}
              initialValue={compose.initial.body}
              onDirty={markDirty}
              onKeyDown={(e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleSend(); } }}
              init={{
                language: i18n.language.replace("-", "_") === "en_US" ? undefined : i18n.language.replace("-", "_"),
                menubar: false,
                statusbar: false,
                branding: false,
                promotion: false,
                skin: theme.palette.mode === "dark" ? "oxide-dark" : "oxide",
                content_css: theme.palette.mode === "dark" ? "dark" : "default",
                plugins: "lists link image table autolink autoresize emoticons charmap searchreplace",
                toolbar: "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright | bullist numlist outdent indent | link image table emoticons | removeformat",
                toolbar_mode: "sliding",
                autoresize_bottom_margin: 16,
                min_height: 280,
                paste_data_images: true,
                automatic_uploads: false,
                convert_urls: false,
                browser_spellcheck: true,
                content_style: 'body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; }',
              }}
            />
          </Box>
        </Box>
      )}
      <input ref={fileInputRef} type="file" hidden multiple onChange={handleFiles} />
      <ConfirmDialog
        open={confirmDiscard}
        title={t("Discard draft?")}
        description={t("The message and its attachments will be deleted.")}
        confirmLabel={t("Discard")}
        destructive
        onConfirm={handleDiscard}
        onClose={() => setConfirmDiscard(false)}
      />
    </Box>
  );
};

export default Compose;
