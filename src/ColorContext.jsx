// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import React from 'react';

// Context to set MUI theme and darkmode
const ColorModeContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleColorMode: () => {},
  setColorTheme: (colorTheme) => colorTheme,
  mode: "light",
});

export default ColorModeContext;