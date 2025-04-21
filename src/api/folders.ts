// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { batch, del, get, getAll, patch, post } from "./graph";
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

export async function markFolderAsRead(folderId: string): Promise<number> {
  const ids = await collectMessageIds(folderId, "isRead eq false");
  if (ids.length === 0) return 0;
  await batch(ids.map((id, i) => ({
    id: String(i),
    method: "PATCH",
    url: `/me/messages/${id}`,
    body: { isRead: true },
  })));
  return ids.length;
}

// Deleted Items gets purged, anything else is moved there first
export async function emptyFolder(folderId: string, permanent: boolean): Promise<number> {
  const ids = await collectMessageIds(folderId);
  if (ids.length === 0) return 0;
  await batch(ids.map((id, i) => permanent ? ({
    id: String(i),
    method: "DELETE" as const,
    url: `/me/messages/${id}`,
  }) : ({
    id: String(i),
    method: "POST" as const,
    url: `/me/messages/${id}/move`,
    body: { destinationId: "deleteditems" },
  })));
  return ids.length;
}
