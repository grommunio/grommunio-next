// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Drawer, Tab, Tabs, Toolbar,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { useNavigate } from 'react-router-dom';
import { AccountBox, CalendarMonth, ContactEmergency, Mail, Note, Task } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useAppContext } from '../azure/AppContext';

const styles = theme => ({
  /* || Side Bar */
  drawer: {
    width: 90,
  },
  drawerPaper: {
    backgroundColor: theme.palette.mode === "dark" ? '#0a0a0a' : '#f0f0f0',
    width: 90,
    overflowX: 'hidden',
    overflowY: 'auto',
    border: "none",
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
});

const tabs = [
  { label: "Account", icon: AccountBox, route: "/" },
  { label: "Messages", icon: Mail, route: "/messages" },
  { label: "Calendar", icon: CalendarMonth, route: "/calendar" },
  { label: "Contacts", icon: ContactEmergency, route: "/contacts" },
  { label: "Tasks", icon: Task, route: "/tasks" },
  { label: "Notes", icon: Note, route: "/notes" },
]

function ResponsiveDrawer({ classes }) {
  const app = useAppContext();
  const [tab, setTab] = useState(tabs.find(t => t.route === window.location.pathname).route);
  const navigate = useNavigate();

  const handleTabClicked = (e, newValue) => {
    setTab(newValue);
    navigate(newValue);
  }

  return (
    <Drawer
      classes={{
        root: classes.drawer,
        paper: classes.drawerPaper,
      }}
      variant="permanent"
      open
    >
      <Toolbar />
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={tab}
        onChange={handleTabClicked}
      >
        {tabs.map(({ label, icon: Icon, route }) =>
          <Tab
            value={route}
            disabled={!app.user}
            key={label}
            icon={<Icon fontSize="large"/>}
          />
        )}
      </Tabs>
    </Drawer>
  );
}

ResponsiveDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation()(withStyles(styles)(ResponsiveDrawer));
