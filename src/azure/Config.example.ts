// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

const config = {
  appId: 'de5267b8-6fcd-48b3-8071-79364613549a',
  redirectUri: 'http://localhost:3000',
  scopes: [
    'user.read',
    'mailboxsettings.read',
    'calendars.readwrite',
    'mail.readwrite',
    'tasks.readwrite',
    'contacts.readwrite',
    'mail.send'
  ],
  baseUrl: "https://graph.microsoft.com/",
};

export default config;
