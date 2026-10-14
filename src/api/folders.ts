// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { ApiError, batch, BatchRequest, del, get, getAll, patch, post } from "./graph";
import { ExtendedMailFolder, WellKnownFolderName } from "../types/messages";

// Order doubles as the folder pane order
export const WELL_KNOWN_FOLDERS: WellKnownFolderName[] = [
  "inbox",
  "drafts",
  "sentitems",
  "deleteditems",
  "junkemail",
  "archive",
  "outbox",
];

const FOLDER_SELECT = ["id", "displayName", "parentFolderId", "childFolderCount", "unreadItemCount", "totalItemCount", "isHidden"];

// Folders missing in the mailbox, like archive, are left out
export async function getWellKnownFolderIds(): Promise<Record<string, WellKnownFolderName>> {
  const responses = await batch<MailFolder>(WELL_KNOWN_FOLDERS.map(name => ({
    id: name,
    method: "GET",
    url: `/me/mailFolders/${name}?$select=id`,
  })));
  const result: Record<string, WellKnownFolderName> = {};
  responses.forEach(response => {
    if (response.status === 200 && response.body?.id) {
      result[response.body.id] = response.id as WellKnownFolderName;
    }
  });
  return result;
}

function decorate(folders: MailFolder[], wellKnown: Record<string, WellKnownFolderName>): ExtendedMailFolder[] {
  return folders.map(folder => ({
    ...folder,
    wellKnownName: (folder.id && wellKnown[folder.id]) || "custom",
    childFolders: folder.childFolders ? decorate(folder.childFolders, wellKnown) : folder.childFolders,
  }));
}

// Graph expands the first level, deeper ones load via getChildFolders()
export async function getMailFolders(): Promise<{ value: ExtendedMailFolder[]; count: number }> {
  const [folders, wellKnown] = await Promise.all([
    getAll<MailFolder>("/me/mailFolders", {
      select: FOLDER_SELECT,
      expand: `childFolders($select=${FOLDER_SELECT.join(",")})`,
      top: 100,
    }),
    getWellKnownFolderIds(),
  ]);
  const decorated = decorate(folders, wellKnown);
  const count = decorated.reduce((sum, folder) => sum + (folder.totalItemCount || 0), 0);
  return { value: decorated, count };
}

export async function getChildFolders(parentFolderId: string): Promise<ExtendedMailFolder[]> {
  const folders = await getAll<MailFolder>(`/me/mailFolders/${parentFolderId}/childFolders`, {
    select: FOLDER_SELECT,
    expand: `childFolders($select=${FOLDER_SELECT.join(",")})`,
    top: 100,
  });
  return decorate(folders, {});
}

export async function getMailFolder(folderId: string): Promise<MailFolder> {
  return get<MailFolder>(`/me/mailFolders/${folderId}`, { select: FOLDER_SELECT });
}

export async function postMailFolder(folder: MailFolder, parentFolderId?: string): Promise<ExtendedMailFolder> {
  const created = await post<MailFolder>(
    "/me/mailFolders" + (parentFolderId ? `/${parentFolderId}/childFolders` : ""),
    { displayName: folder.displayName, isHidden: false },
  );
  return { ...created, wellKnownName: "custom", childFolders: [] };
}

export async function renameMailFolder(folderId: string, displayName: string): Promise<MailFolder> {
  return patch<MailFolder>(`/me/mailFolders/${folderId}`, { displayName });
}

export async function deleteMailFolder(folderId: string): Promise<void> {
  return del(`/me/mailFolders/${folderId}`);
}

export async function moveMailFolder(folderId: string, destinationId: string): Promise<MailFolder> {
  return post<MailFolder>(`/me/mailFolders/${folderId}/move`, { destinationId });
}

async function collectMessageIds(folderId: string, filter?: string, limit = 2000): Promise<string[]> {
  const messages = await getAll<{ id: string }>(`/me/mailFolders/${folderId}/messages`, {
    select: "id",
    filter,
    top: 500,
  }, limit);
  return messages.map(m => m.id);
}

const RETRYABLE = new Set([429, 503, 504]);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retries throttled items once after Retry-After, returns the failure count
async function runBatch(requests: BatchRequest[]): Promise<number> {
  const responses = await batch(requests);
  const retry = responses.filter(r => RETRYABLE.has(r.status));
  // 404 means already gone
  const isFailure = (status: number) => status >= 400 && status !== 404;
  let failed = responses.filter(r => isFailure(r.status) && !RETRYABLE.has(r.status)).length;
  if (retry.length) {
    const after = Math.max(...retry.map(r => Number(r.headers?.["Retry-After"] ?? r.headers?.["retry-after"]) || 1));
    await sleep(Math.min(after, 10) * 1000);
    const ids = new Set(retry.map(r => r.id));
    const second = await batch(requests.filter(r => ids.has(r.id)));
    failed += second.filter(r => isFailure(r.status)).length;
  }
  return failed;
}

// t("Some messages could not be processed")
// Rounds of 2000 ids. Each round has to shrink the match set or we give up.
async function forAllMessages(folderId: string, filter: string | undefined, toRequest: (id: string, i: number) => BatchRequest): Promise<number> {
  let done = 0;
  let previous = new Set<string>();
  for (let round = 0; round < 100; round++) {
    const ids = await collectMessageIds(folderId, filter);
    // Stop when nothing matches any more, or the same items keep coming back
    if (ids.length === 0 || ids.every(id => previous.has(id))) return done;
    previous = new Set(ids);
    const failed = await runBatch(ids.map((id, i) => toRequest(id, i)));
    done += ids.length - failed;
    if (failed > 0) {
      throw new ApiError("Some messages could not be processed", 0, "PartialFailure");
    }
  }
  return done;
}

export async function markFolderAsRead(folderId: string): Promise<number> {
  return forAllMessages(folderId, "isRead eq false", (id, i) => ({
    id: String(i),
    method: "PATCH",
    url: `/me/messages/${id}`,
    body: { isRead: true },
  }));
}

// Deleted Items gets purged, anything else is moved there first
export async function emptyFolder(folderId: string, permanent: boolean): Promise<number> {
  const done = await deleteAllMessages(folderId, permanent);
  const children = await getAll<{ id: string }>(`/me/mailFolders/${folderId}/childFolders`, { select: "id", top: 100 });
  if (children.length) {
    const failed = await runBatch(children.map((child, i) => ({ id: String(i), method: "DELETE" as const, url: `/me/mailFolders/${child.id}` })));
    if (failed > 0) throw new ApiError("Some messages could not be processed", 0, "PartialFailure");
  }
  return done;
}

function deleteAllMessages(folderId: string, permanent: boolean): Promise<number> {
  return forAllMessages(folderId, undefined, (id, i) => permanent ? ({
    id: String(i),
    method: "DELETE" as const,
    url: `/me/messages/${id}`,
  }) : ({
    id: String(i),
    method: "POST" as const,
    url: `/me/messages/${id}/move`,
    body: { destinationId: "deleteditems" },
  }));
}
