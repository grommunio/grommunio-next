// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

const defaultStyles = mode => ({
  MuiFormControlLabel: {
    styleOverrides: {
      root: {
        color: mode === 'light' ? '#333' : '#fff',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        boxShadow: "none",
        borderRadius: 4,
        border: "1px solid " + (mode === 'light' ? '#d1d1d1' : '#d6d6d6'),
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      containedSecondary: {
        background: 'linear-gradient(150deg, #FF512F, #DD2476)',
        color: '#fff',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        height: '30px',
        padding: '10px 16px',
      },
      body: {
        height: '40px',
        border: 'none',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      hover: {
        '&:hover': {
          backgroundColor: '#ddd',
          cursor: 'pointer',
        },
      },
      root: {
        '&:nth-of-type(even)': {
          backgroundColor: mode === 'light' ? '#eee' : '#202329',
        },
      },
    },
  },
  MuiGridListTile: {
    styleOverrides: {
      tile: {
        display: 'flex',
        flex: 1,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: 14,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        color: mode === 'light' ? '#333' : '#ddd',
      },
    },
  },
});

export default defaultStyles;