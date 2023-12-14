// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Map, IntMap } from "./types/misc";

export const DRAWER_WIDTH = 260;
export const SCROLL_ITEMS = 25;

export const FOLDER_COMMONNAME_DICT_MAPPING: Map = {
  "Posteingang": "inbox",
  "Archiv": "archive",
  "Gelöschte Elemente": "deleteditems",
  "Entwürfe": "drafts",
  "Junk-E-Mail": "junkemail",
  "Postausgang": "outbox",
  "Gesendete Elemente": "sentitems",
  "Verlauf der Unterhaltung": "conversationhistory",
  "Inbox": "inbox",
}

export const COMMON_FOLDER_ORDER: IntMap = {
  "inbox": 0,
  "junkemail": 1,
  "drafts": 2,
  "outbox": 3,
  "sentitems": 4,
  "deleteditems": 5,
  "archive": 6,
  "notes": 7,
  "custom": 8, // Own folders
  "conversationhistory": 9,
}