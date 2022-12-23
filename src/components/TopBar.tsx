// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useState, MouseEvent } from 'react';
import { withStyles } from '@mui/styles';
import { AppBar, IconButton, Menu, MenuItem, Tab, Tabs, Toolbar, Tooltip} from '@mui/material';
import { DRAWER_WIDTH } from '../constants';
import { Translate } from '@mui/icons-material';
import { getLangs } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTypeDispatch, useTypeSelector } from '../store';
import { changeSettings } from '../actions/settings';

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
};

function TopBar(props: any) {
  const { classes } = props;
  const { t, i18n } = useTranslation();
  const dispatch = useTypeDispatch();
  const { language } = useTypeSelector(state => state.settings);
  const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
  const [ tab, setTab ] = useState<string>(''); // TODO: In the future, the default will be part of the user settings
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
          value={tab}
          onChange={handleTab}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab className={classes.tab} value={''} label={t("Account")} />
          <Tab className={classes.tab} value={'messages'} label={t("Messages")} />
          <Tab className={classes.tab} value={'calendar'} label={t("Calendar")} />
          <Tab className={classes.tab} value={'contacts'} label={t("Contacts")} />
          <Tab className={classes.tab} value={'tasks'} label={t("Tasks")} />
          <Tab className={classes.tab} value={'notes'} label={t("Notes")} />
        </Tabs>
        <div className={classes.flexEndContainer}>
          <Tooltip title={t("Language")}>
            <IconButton onClick={handleMenu(true)}>
              <Translate color="inherit" className={classes.trans}/>
            </IconButton>
          </Tooltip>
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
