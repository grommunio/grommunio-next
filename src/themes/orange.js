// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import grey from "../colors/grey";
import orange from "../colors/orange";
import defaultStyles from "./defaultStyles";

const orangeTheme = mode => ({
  components: {
    ...defaultStyles(mode),
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(150deg, ${orange['topbar']}, ${orange['topbar']})`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: mode === 'light' ? '#fff' : orange[600],
          color: mode === 'light' ? '#333' : '#fff',
          boxShadow: '0px 5px 5px -3px rgba(0, 0, 0, 0.06),0px 8px 10px 1px rgba(0, 0, 0, 0.042),0px 3px 14px 2px rgba(0, 0, 0, 0.036)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorError: {
          color: '#000',
        },
        colorPrimary: {
          backgroundColor: orange['300'],
          color: '#000',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&.Mui-selected': {
            background: `linear-gradient(150deg, ${orange['500']}, ${orange['800']})`,
            color: '#fff',
            '&:hover': {
              color: 'black',
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: `linear-gradient(150deg, ${orange['500']}, ${orange['800']})`,
            color: '#fff',
          },
        },
      },
    },
  },
  palette: {
    mode: mode,
    primary: orange,
    secondary: grey,
    ...(mode === 'light' ?
      {
        text: {
          primary: mode === 'light' ? '#000' : '#fff',
        },
      } :
      {
        background: {
          paper: "#121315",
        }
      }),
  },
});

export default orangeTheme;