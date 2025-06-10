// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Chip, CircularProgress, Dialog, DialogContent, IconButton, Tooltip, Typography } from "@mui/material";
import {
  Close, Description, Download, Image as ImageIcon, InsertDriveFileOutlined, PictureAsPdf, Slideshow, TableChart,
  FolderZip, AudioFile, VideoFile, Event, ContactPage, DeleteOutline,
} from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, FileAttachment, ItemAttachment } from "microsoft-graph";
import { readableBytesFormat } from "../../../utils";
import { downloadAttachment } from "../utils";

type AttachmentListProps = {
  attachments: Attachment[];
  fetchContent: (attachment: Attachment) => Promise<FileAttachment>;
  onRemove?: (attachment: Attachment) => void;
  dense?: boolean;
};

export function attachmentIcon(attachment: Attachment) {
  const type = (attachment.contentType || "").toLowerCase();
  const name = (attachment.name || "").toLowerCase();
  if ((attachment as any)["@odata.type"] === "#microsoft.graph.itemAttachment") {
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

const AttachmentList = ({ attachments, fetchContent, onRemove, dense }: AttachmentListProps) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string; type: string } | null>(null);

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

  const handleDownload = async (attachment: Attachment) => {
    const file = await load(attachment);
    if (file) downloadAttachment(file);
  };

  const handleOpen = async (attachment: Attachment) => {
    const type = (attachment.contentType || "").toLowerCase();
    const previewable = type.startsWith("image/") || type === "application/pdf" || type.startsWith("text/");
    if (!previewable) return handleDownload(attachment);
    const file = await load(attachment);
    if (!file?.contentBytes) return;
    const bytes = atob(file.contentBytes);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([buffer], { type: file.contentType || "application/octet-stream" }));
    setPreview({ name: file.name || "", url, type });
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
        {visible.map(attachment => (
          <Chip
            key={attachment.id}
            variant="outlined"
            icon={busy === attachment.id ? <CircularProgress size={16} /> : attachmentIcon(attachment)}
            label={
              <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.2, py: 0.5 }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{attachment.name}</Typography>
                <Typography variant="caption" color="text.secondary">{readableBytesFormat(attachment.size || 0)}</Typography>
              </Box>
            }
            onClick={() => handleOpen(attachment)}
            onDelete={onRemove ? () => onRemove(attachment) : () => handleDownload(attachment)}
            deleteIcon={onRemove ?
              <Tooltip title={t("Remove")}><DeleteOutline /></Tooltip> :
              <Tooltip title={t("Download")}><Download /></Tooltip>}
            sx={{ height: "auto", borderRadius: 1.5, "& .MuiChip-label": { px: 1 } }}
          />
        ))}
      </Box>
      <Dialog open={Boolean(preview)} onClose={closePreview} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>{preview?.name}</Typography>
          <IconButton component="a" href={preview?.url} download={preview?.name} aria-label={t("Download")}><Download /></IconButton>
          <IconButton onClick={closePreview} aria-label={t("Close")}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
          {preview?.type.startsWith("image/") ?
            <img src={preview.url} alt={preview.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> :
            preview && <iframe title={preview.name} src={preview.url} style={{ width: "100%", height: "100%", border: "none" }} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AttachmentList;
