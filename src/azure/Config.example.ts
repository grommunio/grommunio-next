// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

const config = {
  appId: 'YOUR_APP_ID',
  redirectUri: 'http://localhost:3000',
  scopes: [
    'user.read',
    'mailboxsettings.read',
    'calendars.readwrite',
    'mail.readwrite',
    'tasks.read',
    'contacts.readwrite',
    'mail.send'
  ],
  baseUrl: "https://graph.microsoft.com/",
};

export default config;
