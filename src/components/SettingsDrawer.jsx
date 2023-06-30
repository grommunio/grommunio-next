// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Drawer, FormControlLabel, Grid, IconButton, Radio, RadioGroup, Typography,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { Close } from '@mui/icons-material';
import blue from '../colors/blue';
import magenta from '../colors/magenta';
import { blueGrey, brown, green, orange, purple, teal } from '@mui/material/colors';
import ColorModeContext from '../ColorContext';
import { useContext } from 'react';

const styles = {
  root: {
    width: 260,
  },
  drawer: {
    width: 260,
    marginTop: 64,
    padding: 8,
    border: "none",
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  color: {
    width: 57,
    height: 57,
    margin: 2,
    padding: 2,
    cursor: 'pointer',
    borderRadius: 4,
  },
};

const colors = [
  { name: "grommunio", color: blue },
  { name: "green", color: green },
  { name: "purple", color: purple },
  { name: "magenta", color: magenta },
  { name: "teal", color: teal },
  { name: "orange", color: orange },
  { name: "brown", color: brown },
  { name: "bluegrey", color: blueGrey },
];

function SettingsDrawer({ classes, t, open, onClose }) {
  const colorContext = useContext(ColorModeContext);
  const colorTheme = window.localStorage.getItem("colorTheme");
  const darkMode = window.localStorage.getItem("darkMode");

  const handleTheme = colorTheme => () => {
    window.localStorage.setItem('colorTheme', colorTheme);
    colorContext.setColorTheme(colorTheme);
  }

  const handleColorMode = event => {
    window.localStorage.setItem('darkMode', event.target.value);
    colorContext.toggleColorMode();
  }

  return (
    <Drawer
      classes={{
        root: classes.root,
        paper: classes.drawer,
      }}
      anchor='right'
      open={open || false}
      onClose={onClose}
    >
      <div className={classes.title}>
        <Typography variant='h6'>{t("Settings")}</Typography>
        <IconButton onClick={onClose}>
          <Close  />
        </IconButton>
      </div>
      <div className={classes.design}>
        <Typography>{t("Design")}</Typography>
        <Grid container>
          {colors.map(({ name, color }, key) =>
            <div
              key={key}
              className={classes.color}
              onClick={handleTheme(name)}
              style={{
                backgroundColor: color['500'],
                border: colorTheme === name ? "2px solid " + (darkMode === "true" ? "#fff" : "#000") : ""
              }}
            />
          )}
        </Grid>
      </div>
      <div className={classes.colorMode}>
        <Typography>{t("Dark mode")}</Typography>
        <RadioGroup
          value={darkMode === "true" ? "true" : "false"}
          onChange={handleColorMode}
        >
          <FormControlLabel value="true" control={<Radio />} label={t("Dark")} />
          <FormControlLabel value="false" control={<Radio />} label={t("Light")} />
        </RadioGroup>
      </div>
    </Drawer>
  );
}

SettingsDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default withTranslation()(withStyles(styles)(SettingsDrawer));
