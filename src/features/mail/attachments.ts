// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { client, normalizeError } from "../../api/graph";
import { getAttachment, getAttachments } from "../../api/messages";
import { base64ToBytes, inlineCandidates, normalizeCid } from "./utils";

// Item attachments come back as MIME, iCalendar or vCard
export async function getAttachmentRaw(messageId: string, attachmentId: string): Promise<Blob> {
  try {
    return await client().api(`/me/messages/${messageId}/attachments/${attachmentId}/$value`).responseType("blob" as any).get();
  } catch (err) {
    throw normalizeError(err);
  }
}

// Keyed by normalised Content-ID, caller revokes the URLs
export async function loadInlineImageUrls(messageId: string): Promise<Map<string, string>> {
  const list = await getAttachments(messageId);
  const files = await Promise.all(inlineCandidates(list).map(a => getAttachment(messageId, a.id!).catch(() => null)));
  const urls = new Map<string, string>();
  files.forEach(file => {
    if (!file?.contentId || !file.contentBytes) return;
    const blob = new Blob([base64ToBytes(file.contentBytes)], { type: file.contentType || "image/png" });
    urls.set(normalizeCid(file.contentId), URL.createObjectURL(blob));
  });
  return urls;
}
