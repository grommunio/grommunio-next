// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { client, normalizeError } from "../../api/graph";

// Item attachments come back as MIME, iCalendar or vCard
export async function getAttachmentRaw(messageId: string, attachmentId: string): Promise<Blob> {
  try {
    return await client().api(`/me/messages/${messageId}/attachments/${attachmentId}/$value`).responseType("blob" as any).get();
  } catch (err) {
    throw normalizeError(err);
  }
}
