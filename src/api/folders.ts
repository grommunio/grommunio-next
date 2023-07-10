// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { graphClient } from "./utils";
import { PageCollection } from "@microsoft/microsoft-graph-client";

export async function getMailFolders(): Promise<PageCollection> {
  
  // Get toplevel folders
  const response: PageCollection = await graphClient!
    .api("/me/mailFolders")
    .top(50)  // TODO: This should be configurable
    .count()
    .get();

  // Get recursive childFolders
  const folders = response.value;
  for(let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    if(folder.childFolderCount > 0) folder["childFolders"] = await getChildFolders(folder.id);
  }
  
  return response;
}

export async function getChildFolders(parentFolderId: string): Promise<MailFolder[]> {
  const response: PageCollection = await graphClient!
    .api(`/me/mailFolders/${parentFolderId}/childFolders`)
    .top(50)  // TODO: This should be unlimited...probably needs more than 1 request if max count is exceeded
    .get();
  // Get recursive childFolders
  const folders = response.value;
  for(let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    if(folder.childFolderCount > 0) folder["childFolders"] = await getChildFolders(folder.id);
  }
  return response.value;
}

export async function postMailFolder(folder: MailFolder, parentFolderId: MailFolder | undefined): Promise<MailFolder> {

  const response = await graphClient!
    .api("/me/mailFolders" + (parentFolderId ? `/${parentFolderId}/childFolders` : ""))
    .post(folder);

  return response;
}

