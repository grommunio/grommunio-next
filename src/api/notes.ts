// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { MailFolder, Message } from "microsoft-graph";
import { ApiError, del, get, getAll, odataString, patch, post } from "./graph";

// Exchange has no "notes" well-known folder, only grommunio does. Fall back to a
// Notes folder by localized name, else create a hidden one.
export const NOTES_FOLDER_NAMES = [
  "Notes", "Notizen", "Notas", "Note", "Notities", "Notatki", "Poznámky", "Beležke", "Jegyzetek", "Anteckningar", "Noter",
  "Notater", "Muistiinpanot", "Notlar", "Σημειώσεις", "Заметки", "Нотатки", "メモ", "便笺", "便箋", "ملاحظات", "Minnisblöð",
];

let notesFolder: Promise<string> | null = null;

async function resolveNotesFolder(): Promise<string> {
  try {
    const folder = await get<MailFolder>("/me/mailFolders/notes", { select: ["id"] });
    if (folder?.id) return folder.id;
  } catch {
    // Not well-known on this server
  }
  const filter = NOTES_FOLDER_NAMES.map(n => `displayName eq ${odataString(n)}`).join(" or ");
  const found = await getAll<MailFolder>("/me/mailFolders?includeHiddenFolders=true", { select: ["id", "displayName"], filter });
  const match = NOTES_FOLDER_NAMES.map(name => found.find(f => f.displayName === name)).find(Boolean);
  if (match?.id) return match.id;
  const created = await post<MailFolder>("/me/mailFolders", { displayName: "Notes", isHidden: true });
  return created.id!;
}

// Failed lookups aren't cached
export function getNotesFolderId(): Promise<string> {
  if (!notesFolder) {
    notesFolder = resolveNotesFolder().catch(err => { notesFolder = null; throw err; });
  }
  return notesFolder;
}

export function resetNotesFolderCache() {
  notesFolder = null;
}

const notesPath = async () => `/me/mailFolders/${await getNotesFolderId()}/messages`;

export async function getNotes(): Promise<Message[]> {
  return getAll<Message>(await notesPath(), {
    select: ["id", "subject", "body", "bodyPreview", "lastModifiedDateTime", "createdDateTime", "categories", "isDraft"],
    orderby: "lastModifiedDateTime desc",
    top: 200,
  });
}

export async function postNote(note: Message): Promise<Message> {
  return post<Message>(await notesPath(), note);
}

export async function deleteNote(noteId: string): Promise<void> {
  return del(`${await notesPath()}/${noteId}`);
}

export async function patchNote(note: Message): Promise<Message> {
  const { id, ...props } = note;
  return patch<Message>(`${await notesPath()}/${id}`, props);
}

// Graph only updates body/subject of drafts, and Outlook notes aren't drafts
export function isNonDraftUpdateError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return /InvalidPropertyUpdateSentMessage|ErrorInvalidPropertySet/i.test(err.code || "")
    || /isDraft|sent message|only.*draft/i.test(err.message);
}

