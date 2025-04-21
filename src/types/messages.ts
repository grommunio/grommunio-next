// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH
import { MailFolder, Message } from 'microsoft-graph';

export type MessageCategory = {
  id?: string;
  displayName: string;
  color: string;
}

export type WellKnownFolderName =
  | "inbox"
  | "drafts"
  | "sentitems"
  | "deleteditems"
  | "junkemail"
  | "archive"
  | "outbox"
  | "custom";

export type ExtendedMailFolder = Omit<MailFolder, "childFolders"> & {
  wellKnownName: WellKnownFolderName;
  childFolders?: ExtendedMailFolder[] | null;
};

export type FolderMessage = Message & {
  folderId?: string;
};

export type MessageListParams = {
  filter?: string;
  search?: string;
  orderby?: string;
  skip?: number;
  top?: number;
};
