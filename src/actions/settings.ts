// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import {
  CHANGE_SETTINGS,
} from './types';

export function changeSettings(field: string, value: any) {
  return { type: CHANGE_SETTINGS, field, value };
}