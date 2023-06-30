// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { graphClient } from "./utils";
import { PageCollection } from "@microsoft/microsoft-graph-client";

export async function getMailFolders(): Promise<MailFolder[]> {
  
  const response: PageCollection = await graphClient!
    .api('/me/mailFolders')
    .get();

  return response.value;
}

export async function postMailFolder(folder: MailFolder): Promise<MailFolder> {

  const response = await graphClient!
    .api("/me/mailFolders")
    .post(folder);

  return response;
}

