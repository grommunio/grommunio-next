// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, ButtonBase, CircularProgress, Dialog, DialogContent, IconButton, Tooltip, Typography } from "@mui/material";
import {
  Close, Description, Download, Image as ImageIcon, InsertDriveFileOutlined, PictureAsPdf, Slideshow, TableChart,
  FolderZip, AudioFile, VideoFile, Event, ContactPage, DeleteOutline,
} from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, FileAttachment, ItemAttachment } from "microsoft-graph";
import { readableBytesFormat } from "../../../utils";
import { base64ToBytes, downloadAttachment, downloadBlob } from "../utils";
import { useTypeDispatch } from "../../../store";
import { pushAlertStack } from "../../alerts/alertsSlice";

type AttachmentListProps = {
  attachments: Attachment[];
  fetchContent: (attachment: Attachment) => Promise<FileAttachment>;
  // MIME for attached messages, needed for item attachments
  fetchRaw?: (attachment: Attachment) => Promise<Blob>;
  onRemove?: (attachment: Attachment) => void;
  dense?: boolean;
};

const odataType = (attachment: Attachment) => (attachment as any)["@odata.type"] as string | undefined;

function itemExtension(attachment: Attachment): string {
  const type = ((attachment as ItemAttachment).item as any)?.["@odata.type"] || "";
  if (type.includes("event")) return ".ics";
  if (type.includes("contact")) return ".vcf";
  return ".eml";
}

export function attachmentIcon(attachment: Attachment) {
  const type = (attachment.contentType || "").toLowerCase();
  const name = (attachment.name || "").toLowerCase();
  if (odataType(attachment) === "#microsoft.graph.itemAttachment") {
    const item = (attachment as ItemAttachment).item as any;
    if (item?.["@odata.type"]?.includes("event")) return <Event color="action" />;
    if (item?.["@odata.type"]?.includes("contact")) return <ContactPage color="action" />;
    return <Description color="action" />;
  }
  if (type.startsWith("image/")) return <ImageIcon color="action" />;
  if (type === "application/pdf" || name.endsWith(".pdf")) return <PictureAsPdf color="error" />;
  if (/spreadsheet|excel|csv/.test(type) || /\.(xlsx?|csv|ods)$/.test(name)) return <TableChart sx={{ color: "#1d6f42" }} />;
  if (/presentation|powerpoint/.test(type) || /\.(pptx?|odp)$/.test(name)) return <Slideshow sx={{ color: "#c43e1c" }} />;
  if (/msword|wordprocessing|opendocument\.text/.test(type) || /\.(docx?|odt|rtf)$/.test(name)) return <Description sx={{ color: "#2b579a" }} />;
  if (/zip|compressed|tar|7z|rar/.test(type) || /\.(zip|7z|rar|gz|tgz)$/.test(name)) return <FolderZip color="action" />;
  if (type.startsWith("audio/")) return <AudioFile color="action" />;
  if (type.startsWith("video/")) return <VideoFile color="action" />;
  return <InsertDriveFileOutlined color="action" />;
}

// Plural forms of the attachment count:
// t("{{count}} attachments_one")
// t("{{count}} attachments_other")
const AttachmentList = ({ attachments, fetchContent, fetchRaw, onRemove, dense }: AttachmentListProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string; type: "image" | "pdf" | "text" } | null>(null);

  const visible = attachments.filter(a => !a.isInline);
  if (visible.length === 0) return null;

  const load = async (attachment: Attachment): Promise<FileAttachment | null> => {
    setBusy(attachment.id || null);
    try {
      return await fetchContent(attachment);
    } catch {
      return null;
    } finally {
      setBusy(null);
    }
  };

  const unsupported = () => {
    // t("This attachment cannot be opened here")
    dispatch(pushAlertStack({ message: "This attachment cannot be opened here", severity: "warning" }));
  };

  const handleDownload = async (attachment: Attachment) => {
    const type = odataType(attachment);
    if (type === "#microsoft.graph.itemAttachment") {
      // Attached messages, events and contacts are saved in their raw format
      if (!fetchRaw) return unsupported();
      setBusy(attachment.id || null);
      try {
        const blob = await fetchRaw(attachment);
        const name = (attachment.name || "item").replace(/[\\/:*?"<>|]+/g, "_");
        downloadBlob(blob, name + itemExtension(attachment));
      } catch (err: any) {
        dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
      } finally {
        setBusy(null);
      }
      return;
    }
    if (type === "#microsoft.graph.referenceAttachment") return unsupported();
    const file = await load(attachment);
    if (file?.contentBytes) downloadAttachment(file);
    else unsupported();
  };

  const handleOpen = async (attachment: Attachment) => {
    const type = (attachment.contentType || "").toLowerCase();
    // SVG can carry scripts, download only
    let kind: "image" | "pdf" | "text" | null = null;
    if (type.startsWith("image/") && type !== "image/svg+xml") kind = "image";
    else if (type === "application/pdf") kind = "pdf";
    else if (type.startsWith("text/")) kind = "text";
    if (!kind || odataType(attachment) === "#microsoft.graph.itemAttachment") return handleDownload(attachment);
    const file = await load(attachment);
    if (!file?.contentBytes) return unsupported();
    // Text (including HTML) is shown as plain text so it never runs in the app origin
    const blobType = kind === "text" ? "text/plain;charset=utf-8" : kind === "pdf" ? "application/pdf" : type;
    const url = URL.createObjectURL(new Blob([base64ToBytes(file.contentBytes)], { type: blobType }));
    setPreview({ name: file.name || "", url, type: kind });
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const downloadAll = () => visible.forEach(a => handleDownload(a));

  return (
    <Box sx={{ mt: dense ? 0 : 1.5 }}>
      {!dense && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {t("{{count}} attachments", { count: visible.length })}
            {" · "}{readableBytesFormat(visible.reduce((sum, a) => sum + (a.size || 0), 0))}
          </Typography>
          {visible.length > 1 && <Button size="small" onClick={downloadAll} sx={{ py: 0 }}>{t("Download all")}</Button>}
        </Box>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {visible.map(attachment => {
          const actionLabel = onRemove ? t("Remove {{name}}", { name: attachment.name }) : t("Download {{name}}", { name: attachment.name });
          return (
            <Box key={attachment.id} sx={{ display: "inline-flex", alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
              <ButtonBase
                onClick={() => handleOpen(attachment)}
                aria-label={t("Open {{name}}", { name: attachment.name })}
                sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1, pr: 0.5, py: 0.5, textAlign: "left", "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" } }}
              >
                {busy === attachment.id ? <CircularProgress size={16} /> : attachmentIcon(attachment)}
                <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{attachment.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{readableBytesFormat(attachment.size || 0)}</Typography>
                </Box>
              </ButtonBase>
              <Tooltip title={onRemove ? t("Remove") : t("Download")}>
                <IconButton size="small" aria-label={actionLabel} onClick={() => onRemove ? onRemove(attachment) : handleDownload(attachment)}>
                  {onRemove ? <DeleteOutline fontSize="small" /> : <Download fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
      <Dialog open={Boolean(preview)} onClose={closePreview} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>{preview?.name}</Typography>
          <IconButton component="a" href={preview?.url} download={preview?.name} aria-label={t("Download")}><Download /></IconButton>
          <IconButton onClick={closePreview} aria-label={t("Close")}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
          {preview?.type === "image" ?
            <img src={preview.url} alt={preview.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> :
            preview && <iframe
              title={preview.name}
              src={preview.url}
              // Text runs in an opaque origin; the PDF viewer needs an unsandboxed frame
              sandbox={preview.type === "text" ? "" : undefined}
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
            />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AttachmentList;
