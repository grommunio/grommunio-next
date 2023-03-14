// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useState, MouseEvent } from 'react';
import { withStyles } from '@mui/styles';
import { AppBar, Box, IconButton, Menu, MenuItem, Tab, Tabs, Toolbar, Tooltip, Typography} from '@mui/material';
import { DRAWER_WIDTH } from '../constants';
import { AccountCircle, Translate } from '@mui/icons-material';
import { getLangs } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypeDispatch, useTypeSelector } from '../store';
import { changeSettings } from '../actions/settings';
import { useAppContext } from '../azure/AppContext';

const styles = {
  appbar: {
    height: 64,
  },
  toolbar: {
    marginLeft: DRAWER_WIDTH,
    background: 'linear-gradient(150deg, rgb(0, 159, 253), rgb(42, 42, 114))',
    color: '#000',
  },
  flexEndContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tabs: {
    '& .MuiTabs-indicator': {
      backgroundColor: '#000',
    },
  },
  tab: {
    color: '#fff',
    fontWeight: 'bold',
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
};

const routeTabMapping: any = {
  'messages': 'messages',
  'newMessage': 'messages',
  'calendar': 'calendar',
  'contacts': 'contacts',
  'tasks': 'tasks',
  'notes': 'notes',
}

function TopBar(props: any) {
  const app = useAppContext();
  const { classes } = props;
  const { t, i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { me, settings } = useTypeSelector(state => state);
  const { language } = settings;
  const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
  const [ tab, setTab ] = useState<string>(window.location.pathname.slice(1)); // TODO: In the future, the default will be part of the user settings
  const navigate = useNavigate();

  const handleMenu = (open: boolean) => (e: MouseEvent<HTMLElement>) => setMenuAnchor(open ? e.currentTarget : null);

  const handleLangChange = (lang: string) => () => {
    i18n.changeLanguage(lang);
    dispatch(changeSettings('language', lang));
    window.localStorage.setItem('lang', lang);
    setMenuAnchor(null)
  }

  const handleTab = (_: any, newVal: string) => {
    setTab(newVal);
    navigate(`/${newVal}`);
  }

  return (
    <AppBar color='primary' position='relative' className={classes.appbar}>
      <Toolbar className={classes.toolbar}>
        <Tabs
          className={classes.tabs}
          value={app.user ? routeTabMapping[tab] : ''}
          onChange={handleTab}
          textColor="inherit"
          indicatorColor="secondary"
          disabled={!app.user}
        >
          <Tab className={classes.tab} value={''} label={t("Account")} />
          <Tab className={classes.tab} value={'messages'} label={t("Messages")} disabled={!app.user}/>
          <Tab className={classes.tab} value={'calendar'} label={t("Calendar")} disabled={!app.user}/>
          <Tab className={classes.tab} value={'contacts'} label={t("Contacts")} disabled={!app.user}/>
          <Tab className={classes.tab} value={'tasks'} label={t("Tasks")} disabled={!app.user}/>
          <Tab className={classes.tab} value={'notes'} label={t("Notes")} disabled={!app.user}/>
        </Tabs>
        <div className={classes.flexEndContainer}>
          <Tooltip title={t("Language")}>
            <IconButton onClick={handleMenu(true)}>
              <Translate color="inherit" className={classes.trans}/>
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
    </AppBar>
  );
}

export default withStyles(styles)(TopBar);
