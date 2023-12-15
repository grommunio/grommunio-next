// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailboxSettings } from 'microsoft-graph';
import { getMailboxSettings, patchMailboxSettings } from '../api/settings';
import { defaultFetchHandler, defaultPatchHandler } from './defaults';
import {
  CHANGE_SETTINGS,
  FETCH_MAILBOX_SETTINGS
} from './types';

export function changeSettings(field: string, value: any) {
  return { type: CHANGE_SETTINGS, field, value };
}

export function fetchMailboxSettingsData() {
  return defaultFetchHandler(getMailboxSettings, FETCH_MAILBOX_SETTINGS)
}

export function patchMailboxSettingsData(mailboxSettings: MailboxSettings) {
  return defaultPatchHandler(patchMailboxSettings, FETCH_MAILBOX_SETTINGS, false, mailboxSettings)
}
