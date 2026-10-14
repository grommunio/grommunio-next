// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

// `edited` outlives the editor, so hiding the editor doesn't wipe the message
export function externalReplyMessage(sameExternal: boolean, internal: string, edited: string | null, stored?: string | null): string {
  if (sameExternal) return internal;
  return edited ?? stored ?? "";
}
