// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Drawer, Grid, List, ListItem, ListItemButton, ListItemText,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { withRouter } from './hocs/withRouter';
import logo from '../res/grommunio_logo_light.svg';
import { NavLink } from 'react-router-dom';
import { CalendarMonth, Mail, ContactMail, TaskSharp } from '@mui/icons-material';

const drawerWidth = 260;

const styles = theme => ({
  /* || Side Bar */
  drawerExpanded: {
    [theme.breakpoints.up('lg')]: {
      width: drawerWidth,
    },
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#121315',
    // eslint-disable-next-line max-len
    boxShadow: 'rgba(0, 0, 0, 0.06) 0px 5px 5px -3px, rgba(0, 0, 0, 0.043) 0px 8px 10px 1px, rgba(0, 0, 0, 0.035) 0px 3px 14px 2px',
    color: '#e6e6e6',
    overflowX: 'hidden',
    overflowY: 'auto',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 2, 0, 2),
    ...theme.mixins.toolbar,
    justifyContent: 'center',
    height: 64,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  li: {
    width: 'auto',
    margin: '6px 12px 6px',
    borderRadius: '3px',
    position: 'relative',
    display: 'flex',
    padding: '9px 14px',
    transition: 'all 200ms linear',
    '&:hover': {
      backgroundColor: 'transparent',
      textShadow: '0px 0px 1px white',
      color: 'white',
    },
  },
  icon: {
    fontSize: '24px',
    lineHeight: '30px',
    float: 'left',
    marginTop: '2px',
    marginRight: '15px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
});

function ResponsiveDrawer(props) {
  const { classes, t } = props;
  
  const handleNavigation = path => event => {
    const { router } = props;
    event.preventDefault();
    router.navigate(`/${path}`);
  }

  return (
    <nav className={classes.drawerExpanded} aria-label="navigation">
      <Drawer
        classes={{
          paper: classes.drawerPaper,
        }}
        variant="permanent"
        open
      >
        <div className={classes.drawerHeader}>
          <NavLink to="/">
            <img
              src={logo}
              height="32"
              alt="grommunio"
              className={classes.logo}
            />
          </NavLink>
        </div>
        <List className={classes.list}>
          <ListItem disablePadding>
            <ListItemButton
              className={classes.li}
              onClick={handleNavigation('messages')}
            >
              <Grid container alignItems="center">
                <Mail className={classes.icon} />
                <ListItemText primary={t("Messages")} />
              </Grid>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              className={classes.li}
              onClick={handleNavigation('calendar')}
            >
              <Grid container alignItems="center">
                <CalendarMonth className={classes.icon} />
                <ListItemText primary={t("Calendar")} />
              </Grid>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              className={classes.li}
              onClick={handleNavigation('tasks')}
            >
              <Grid container alignItems="center">
                <TaskSharp className={classes.icon} />
                <ListItemText primary={t("Tasks")} />
              </Grid>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              className={classes.li}
              onClick={handleNavigation('contacts')}
            >
              <Grid container alignItems="center">
                <ContactMail className={classes.icon} />
                <ListItemText primary={t("Contacts")} />
              </Grid>
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </nav>
  );
}

ResponsiveDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

export default withRouter(withTranslation()(withStyles(styles)(ResponsiveDrawer)));
