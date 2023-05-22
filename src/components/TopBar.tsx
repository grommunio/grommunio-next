// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useState, MouseEvent } from 'react';
import { withStyles } from '@mui/styles';
import { AppBar, Box, IconButton, Menu, MenuItem, Toolbar, Tooltip, Typography} from '@mui/material';
import { AccountCircle, Settings, Translate } from '@mui/icons-material';
import { getLangs } from '../utils';
import { useTranslation } from 'react-i18next';
import { useTypeDispatch, useTypeSelector } from '../store';
import { changeSettings } from '../actions/settings';
import logo from '../res/grommunio_logo_default.svg';
import SettingsDrawer from './SettingsDrawer';

const styles = {
  appbar: {
    height: 64,
    border: "none",
  },
  toolbar: {
    color: '#000',
  },
  flexEndContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trans: {
    color: '#fff',
  },
  username: {
    color: 'white',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 25,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  profileIcon: {
    fontSize: 40,
    color: '#aaa',
    marginLeft: 8,
  },
  logo: {
    marginRight: 16,
  },
};

function TopBar(props: any) {
  const { classes } = props;
  const { t, i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { me, settings } = useTypeSelector(state => state);
  const { language } = settings;
  const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
  const [ settingsOpen, setSettingsOpen ] = useState<boolean>(false);

  const handleMenu = (open: boolean) => (e: MouseEvent<HTMLElement>) => setMenuAnchor(open ? e.currentTarget : null);

  const handleLangChange = (lang: string) => () => {
    i18n.changeLanguage(lang);
    dispatch(changeSettings('language', lang));
    window.localStorage.setItem('lang', lang);
    setMenuAnchor(null)
  }

  const handleSettings = () => setSettingsOpen(!settingsOpen);

  return (
    <AppBar
      color='primary'
      position='fixed'
      className={classes.appbar}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
<<<<<<< HEAD
=======

>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
    >
      <Toolbar className={classes.toolbar}>
        <img
          src={logo}
          height="42"
          alt="grommunio"
          className={classes.logo}
        />
        <div className={classes.flexEndContainer}>
          <Tooltip title={t("Language")}>
            <IconButton onClick={handleMenu(true)}>
              <Translate color="inherit" className={classes.trans}/>
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Settings")}>
            <IconButton onClick={handleSettings}>
              <Settings color="inherit" className={classes.trans}/>
            </IconButton>
          </Tooltip>
          <Box className={classes.profileButton}>
            <Typography className={classes.username}>{me.displayName}</Typography>
            <AccountCircle className={classes.profileIcon}/>
          </Box>
          <Menu
            id="lang-menu"
            anchorEl={menuAnchor}
            keepMounted
            open={Boolean(menuAnchor)}
            onClose={handleMenu(false)}
          >
            {getLangs().map(({key, value}) =>
              <MenuItem
                selected={language === key}
                value={key}
                key={key}
                onClick={handleLangChange(key)}
              >
                {value}
              </MenuItem>  
            )}
          </Menu>
        </div>
      </Toolbar>
      <SettingsDrawer open={settingsOpen} onClose={handleSettings}/>
    </AppBar>
  );
}

export default withStyles(styles)(TopBar);
