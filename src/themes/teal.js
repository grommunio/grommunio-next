import { teal } from "@mui/material/colors";
import grey from "../colors/grey";
import defaultStyles from "./defaultStyles";

const tealTheme = mode => ({
  components: {
    ...defaultStyles(mode),
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(150deg, ${teal['500']}, ${teal['800']})`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: mode === 'light' ? '#fff' : teal[600],
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
          backgroundColor: teal['300'],
          color: '#000',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: `linear-gradient(150deg, ${teal['500']}, ${teal['800']})`,
            color: '#fff',
          },
        },
      },
    },
  },
  palette: {
    mode: mode,
    primary: teal,
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

export default tealTheme;