// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Drawer, Tab, Tabs, Toolbar,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { useNavigate } from 'react-router-dom';
import { CalendarMonth, ContactEmergency, Mail, Note, Task } from '@mui/icons-material';
import { useEffect, useState } from 'react';

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
});

const tabs = [
  { id: 1, label: "Messages", icon: Mail, route: "/" },
  { id: 2, label: "Calendar", icon: CalendarMonth, route: "/calendar" },
  { id: 3, label: "Contacts", icon: ContactEmergency, route: "/contacts" },
  { id: 4, label: "Tasks", icon: Task, route: "/tasks" },
  { id: 5, label: "Notes", icon: Note, route: "/notes" },
]

function ResponsiveDrawer({ classes }) {
  const [tab, setTab] = useState(tabs.find(t => window.location.pathname.endsWith(t.route)) || tabs[0]);
  const navigate = useNavigate();

  const handleTabClicked = (_e, newValue) => {
    navigate(newValue.route);
  }

  useEffect(() => {
    setTab(tabs.find(t => window.location.pathname.endsWith(t.route)) || tabs[0]);
  }, [window.location.pathname])

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
        {tabs.map((tab) =>
          <Tab
            value={tab}
            key={tab.id}
            icon={<tab.icon fontSize="large"/>}
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
