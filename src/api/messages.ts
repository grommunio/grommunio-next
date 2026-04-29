// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { Attachment, FileAttachment, Message, OutlookCategory } from "microsoft-graph";
import { fileToBase64 } from "../utils";
import { MessageCategory, MessageListParams } from "../types/messages";
import { SCROLL_ITEMS } from "../constants";
import { ApiError, batch, BatchResponse, client, del, get, getNextPage, getPage, normalizeError, Page, patch, post, quoteSearch, request } from "./graph";

// List view only, the body is loaded on demand
export const MESSAGE_LIST_SELECT = [
  "id", "subject", "bodyPreview", "from", "sender", "toRecipients", "ccRecipients",
  "receivedDateTime", "sentDateTime", "isRead", "isDraft", "hasAttachments", "importance",
  "flag", "categories", "conversationId", "conversationIndex", "parentFolderId", "webLink",
  "inferenceClassification", "lastModifiedDateTime", "internetMessageId",
];

export const MESSAGE_DETAIL_SELECT = [
  ...MESSAGE_LIST_SELECT,
  "body", "uniqueBody", "bccRecipients", "replyTo", "isDeliveryReceiptRequested", "isReadReceiptRequested",
  "internetMessageHeaders",
];

const HTML_BODY_HEADER = { Prefer: 'outlook.body-content-type="html"' };

export async function getMessagesPage(folderId = "inbox", params: MessageListParams = {}): Promise<Page<Message>> {
  const { filter, search, orderby, skip, top } = params;
  if (search) {
    // $search cannot be combined with $orderby, $skip or $count
    return getPage<Message>(`/me/mailFolders/${folderId}/messages`, {
      select: MESSAGE_LIST_SELECT,
      search: quoteSearch(search),
      top: top ?? SCROLL_ITEMS,
    });
  }
  return getPage<Message>(`/me/mailFolders/${folderId}/messages`, {
    select: MESSAGE_LIST_SELECT,
    filter,
    orderby: orderby || "receivedDateTime desc",
    skip,
    top: top ?? SCROLL_ITEMS,
    count: true,
  });
}

export async function searchMessages(search: string, top = SCROLL_ITEMS): Promise<Page<Message>> {
  return getPage<Message>("/me/messages", {
    select: MESSAGE_LIST_SELECT,
    search: quoteSearch(search),
    top,
  });
}

export async function getMessagesNextPage(nextLink: string): Promise<Page<Message>> {
  return getNextPage<Message>(nextLink);
}

/** @deprecated kept for the old message list, use getMessagesPage */
export async function getUserMessages(folderid = 'inbox', params: MessageListParams = {}): Promise<PageCollection> {
  const page = await getMessagesPage(folderid, params);
  return { value: page.value, "@odata.count": page.count, "@odata.nextLink": page.nextLink };
}

export async function getMessage(id: string): Promise<Message> {
  return get<Message>(`/me/messages/${id}`, { select: MESSAGE_DETAIL_SELECT, headers: HTML_BODY_HEADER });
}

export async function getMessageSource(id: string): Promise<string> {
  try {
    const response = await client().api(`/me/messages/${id}/$value`).responseType("text" as any).get();
    return typeof response === "string" ? response : String(response);
  } catch (err) {
    throw normalizeError(err);
  }
}

export type DeltaResult = {
  value: Message[];
  removed: string[];
  deltaLink?: string;
  // Delta link expired and sync restarted, changes in between are unknown
  reset?: boolean;
};

// Graph answers an expired sync state with 410 or 400 SyncStateInvalid
const isExpiredSyncState = (err: unknown) =>
  err instanceof ApiError && (err.status === 410 || err.code === "SyncStateNotFound" || err.code === "SyncStateInvalid");

// Without a delta link the first call returns the whole folder
export async function getMessagesDelta(folderId: string, deltaLink?: string, top = 50): Promise<DeltaResult> {
  const value: Message[] = [];
  const removed: string[] = [];
  let page: Page<Message>;
  if (deltaLink) {
    try {
      page = await getNextPage<Message>(deltaLink);
    } catch (err) {
      if (!isExpiredSyncState(err)) throw err;
      // Start over, the full folder content is not a change set
      const fresh = await getMessagesDelta(folderId, undefined, top);
      return { value: [], removed: [], deltaLink: fresh.deltaLink, reset: true };
    }
  } else {
    // Only recent mail, else the first round enumerates the whole folder
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
    page = await getPage<Message>(`/me/mailFolders/${folderId}/messages/delta`, {
      select: MESSAGE_LIST_SELECT,
      filter: `receivedDateTime ge ${since}`,
      top,
      headers: { Prefer: `odata.maxpagesize=${top}` },
    });
  }
  for (;;) {
    page.value.forEach((message: any) => {
      if (message["@removed"]) {
        removed.push(message.id);
      } else {
        value.push(message);
      }
    });
    if (page.nextLink) {
      page = await getNextPage<Message>(page.nextLink);
      continue;
    }
    return { value, removed, deltaLink: page.deltaLink };
  }
}

export async function createDraft(message: Message): Promise<Message> {
  return post<Message>("/me/messages", message);
}

export async function updateDraft(id: string, message: Partial<Message>): Promise<Message> {
  return patch<Message>(`/me/messages/${id}`, message);
}

export async function sendDraft(id: string): Promise<void> {
  await post(`/me/messages/${id}/send`);
}

export async function sendMail(message: Message, saveToSentItems = true): Promise<void> {
  await post("/me/sendMail", { message, saveToSentItems });
}

export async function createReply(id: string, replyAll: boolean, comment?: string): Promise<Message> {
  const draft = await post<Message>(`/me/messages/${id}/${replyAll ? "createReplyAll" : "createReply"}`, comment ? { comment } : undefined);
  return getMessage(draft.id!);
}

export async function createForward(id: string, comment?: string): Promise<Message> {
  const draft = await post<Message>(`/me/messages/${id}/createForward`, comment ? { comment } : undefined);
  return getMessage(draft.id!);
}

/** @deprecated use createDraft/sendMail; kept for the old compose view */
export async function postMessage(message: Message, send: boolean, filelist?: FileList | File[] | []): Promise<Message> {
  const files = Array.from(filelist || []);
  const attachments: Attachment[] = [];

  for(let i = 0; i < files.length; i++) {
    const attachmentData = {
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: files[i].name,
      contentType: files[i].type || undefined,
      contentBytes: (await fileToBase64(files[i])).split("base64,")[1],
    }
    attachments.push(attachmentData);
  }

  const finalMessage: Message = {
    ...message,
    hasAttachments: attachments.length > 0,
    attachments: attachments.length > 0 ? attachments : undefined,
  }

  return post('/me/' + (send ? 'sendMail' : 'messages'), send ? { message: finalMessage } : finalMessage);
}

export async function patchMessage(message: Message, specificProps?: Partial<Message>): Promise<Message> {
  return patch<Message>('/me/messages/' + message.id, specificProps || message);
}

export async function patchMessages(ids: string[], props: Partial<Message>): Promise<BatchResponse<Message>[]> {
  return batch<Message>(ids.map((id, i) => ({ id: String(i), method: "PATCH", url: `/me/messages/${id}`, body: props })));
}

export async function deleteMessage(id: string, force = false): Promise<void> {
  if (force) {
    await del('/me/messages/' + id);
  } else {
    await post('/me/messages/' + id + "/move", { destinationId: "deleteditems" });
  }
}

export async function deleteMessages(ids: string[], permanent: boolean): Promise<BatchResponse[]> {
  return batch(ids.map((id, i) => permanent ?
    ({ id: String(i), method: "DELETE" as const, url: `/me/messages/${id}` }) :
    ({ id: String(i), method: "POST" as const, url: `/me/messages/${id}/move`, body: { destinationId: "deleteditems" } })));
}

export async function moveMessage(id: string, destinationId: string): Promise<Message> {
  return post<Message>('/me/messages/' + id + "/move", { destinationId });
}

export async function moveMessages(ids: string[], destinationId: string): Promise<BatchResponse<Message>[]> {
  return batch<Message>(ids.map((id, i) => ({ id: String(i), method: "POST", url: `/me/messages/${id}/move`, body: { destinationId } })));
}

export async function copyMessage(id: string, destinationId: string): Promise<Message> {
  return post<Message>('/me/messages/' + id + "/copy", { destinationId });
}

export async function copyMessages(ids: string[], destinationId: string): Promise<BatchResponse<Message>[]> {
  return batch<Message>(ids.map((id, i) => ({ id: String(i), method: "POST", url: `/me/messages/${id}/copy`, body: { destinationId } })));
}

export async function mailCategories(): Promise<OutlookCategory[]> {
  const response: PageCollection = await get("/me/outlook/masterCategories");
  return response.value;
}

export async function postMailCategory(category: MessageCategory): Promise<OutlookCategory> {
  return post<OutlookCategory>("/me/outlook/masterCategories", category);
}

export async function patchMailCategory(id: string, color: string): Promise<OutlookCategory> {
  return patch<OutlookCategory>(`/me/outlook/masterCategories/${id}`, { color });
}

export async function deleteMailCategory(id: string): Promise<void> {
  return del(`/me/outlook/masterCategories/${id}`);
}

/** @deprecated polling by count, superseded by getMessagesDelta */
export async function newMessages(folderid = 'inbox', count=1): Promise<PageCollection> {
  return request(`/me/mailFolders/${folderid}/messages`, { select: MESSAGE_LIST_SELECT, top: count, count: true }).get();
}

const ATTACHMENT_SELECT = ["id", "name", "contentType", "size", "isInline", "lastModifiedDateTime"];

export async function messageAttachments(message: Message): Promise<Attachment[]> {
  const response: PageCollection = await get(`/me/messages/${message.id}/attachments`, { select: ATTACHMENT_SELECT, top: 100 });
  return response.value;
}

export async function getAttachments(messageId: string, withContent = false): Promise<Attachment[]> {
  const response: PageCollection = await get(`/me/messages/${messageId}/attachments`, {
    select: withContent ? [...ATTACHMENT_SELECT, "contentId", "contentBytes"] : [...ATTACHMENT_SELECT, "contentId"],
    top: 100,
  });
  return response.value;
}

export async function getAttachment(messageId: string, attachmentId: string): Promise<FileAttachment> {
  return get<FileAttachment>(`/me/messages/${messageId}/attachments/${attachmentId}`);
}

export async function deleteAttachment(messageId: string, attachmentId: string): Promise<void> {
  return del(`/me/messages/${messageId}/attachments/${attachmentId}`);
}

// Graph takes up to 3 MB inline, bigger files need an upload session
const SMALL_ATTACHMENT_LIMIT = 3 * 1024 * 1024;
const UPLOAD_CHUNK = 4 * 1024 * 1024;

export async function addFileAttachment(messageId: string, file: File, isInline = false, contentId?: string): Promise<Attachment> {
  if (file.size <= SMALL_ATTACHMENT_LIMIT) {
    return post<Attachment>(`/me/messages/${messageId}/attachments`, {
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: file.name,
      contentType: file.type || "application/octet-stream",
      isInline,
      contentId,
      contentBytes: (await fileToBase64(file)).split("base64,")[1],
    });
  }

  const session = await post<{ uploadUrl: string }>(`/me/messages/${messageId}/attachments/createUploadSession`, {
    AttachmentItem: {
      attachmentType: "file",
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      isInline,
      contentId,
    },
  });

  let offset = 0;
  let result: Attachment = { name: file.name, size: file.size };
  try {
    while (offset < file.size) {
      const end = Math.min(offset + UPLOAD_CHUNK, file.size);
      // uploadUrl is pre-authenticated, don't send Authorization
      const response = await fetch(session.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`,
        },
        body: file.slice(offset, end),
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      if (response.status === 201) {
        const location = response.headers.get("Location");
        result = { ...result, id: location?.match(/Attachments\('([^']+)'\)/)?.[1] || location?.split("/").pop() };
      }
      offset = end;
    }
  } catch (err) {
    // don't leave a dangling upload session on the draft
    await fetch(session.uploadUrl, { method: "DELETE" }).catch(() => undefined);
    throw err;
  }
  return result;
}
