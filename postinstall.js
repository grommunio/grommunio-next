// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

// Copies TinyMCE into public/ and adds the language packs,
// which the npm package no longer ships since TinyMCE 7
const fse = require('fs-extra');
const path = require('path');

const topDir = __dirname;
const target = path.join(topDir, 'public', 'tinymce');

fse.emptyDirSync(target);
fse.copySync(path.join(topDir, 'node_modules', 'tinymce'), target, { overwrite: true });
fse.copySync(path.join(topDir, 'vendor', 'tinymce-langs'), path.join(target, 'langs'), { overwrite: true });
