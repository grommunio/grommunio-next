// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { Attachment, CategoryColor, MailFolder, Message } from "microsoft-graph";
import { buildQuery, fileToBase64 } from "../utils";
import { graphClient } from "./utils";
import { MessageCategory } from "../types/messages";
import { SCROLL_ITEMS } from "../constants";

export async function getUserMessages(folderid = 'inbox', params={}): Promise<PageCollection> {
  const url = buildQuery(`/me/mailFolders/${folderid}/messages`, params);

  const response: PageCollection = await graphClient!.api(url)
    .top(SCROLL_ITEMS) // TODO: This limit will probably increased in the future, but is currently set for testing purposes
    .count()
    .get();

  return response;
}

export async function postMessage(message: Message, send: boolean, filelist?: FileList | []): Promise<Message> {
  const files = Array.from(filelist || []);
  const attachments: Attachment[] = [];

  for(let i = 0; i < files.length; i++) {
    const attachmentData = {
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: files[i].name,
      contentBytes: (await fileToBase64(files[i])).split("base64,")[1],
    }
    attachments.push(attachmentData);
  }

  const finalMessage: Message = {
    ...message,
    hasAttachments: attachments.length > 0,
    attachments: attachments.length > 0 ? attachments : undefined,
  }

  return await graphClient!.api('/me/' + (send ? 'sendMail' : 'messages'))
    .post(send ? { message: finalMessage } : finalMessage);
}

export async function patchMessage(message: Message, specificProps: any, mailFolder?: MailFolder): Promise<Message | undefined> {
  
  const response = await graphClient!.api('/me/messages/'+ message.id)
    .patch(specificProps || message);

  return { ...response, mailFolder };
}

export async function deleteMessage(id: string, force=false): Promise<string | undefined> {
  
  const response = force ? await graphClient!.api('/me/messages/'+ id) // Full delete
    .delete() :
    await graphClient!.api('/me/messages/'+ id + "/move") // Move to deleted items
      .post({ destinationId: "deleteditems" });

  return response?.message;
}

export async function moveMessage(id: string, destinationId: string): Promise<string | undefined> {
  
  const response = await graphClient!.api('/me/messages/'+ id + "/move")
    .post({ destinationId });

  return response?.message;
}

export async function copyMessage(id: string, destinationId: string): Promise<string | undefined> {
  
  const response = await graphClient!.api('/me/messages/'+ id + "/copy")
    .post({ destinationId });

  return response?.message;
}

export async function mailCategories(): Promise<CategoryColor[]> {
  
  const response = await graphClient!.api("/me/outlook/masterCategories")
    .get();

  return response.value;
}

export async function postMailCategory(category: MessageCategory): Promise<MessageCategory> {

  const response = await graphClient!.api("/me/outlook/masterCategories")
    .post(category);

  return response;
}

export async function newMessages(folderid = 'inbox', count=1): Promise<PageCollection> {
  const url = buildQuery(`/me/mailFolders/${folderid}/messages`);

  const response: PageCollection = await graphClient!.api(url)
    .top(count) // Only item count is relevant in this query, if 0, count won't be part of the response
    .count()
    .get();

  return response;
}

export async function messageAttachments(message: Message): Promise<Attachment[]> {
  const response: PageCollection = await graphClient!.api(`/me/messages/${message.id}/attachments`)
    .top(100)
    .get();
  return response.value;
}
