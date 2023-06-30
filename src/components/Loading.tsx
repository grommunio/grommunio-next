// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <div id="loadingContainer">
      <CircularProgress />
    </div>
  );
}

