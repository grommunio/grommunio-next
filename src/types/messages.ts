// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { MailFolder } from 'microsoft-graph';

export type MessageCategory = {
  displayName: string;
  color: string; /* TODO: Create enum */
}

export type ExtendedMailFolder = MailFolder & {wellKnownName: string};