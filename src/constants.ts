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

export const REMINDER_OPTIONS = [
  { label: "Don't remind me", value: -1 },
  { label: "At time of event", value: 0 },
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "12 hours", value: 720 },
  { label: "1 day", value: 1440 },
  { label: "1 week", value: 10080 },
];

export const FREEBUSY_TYPES = [
  { label: "Free", value: "free" },
  { label: "Working elsewhere", value: "workingElsewhere" },
  { label: "Tentatively", value: "tentative" },
  { label: "Busy", value: "busy" },
  { label: "Away", value: "oof" },
];
