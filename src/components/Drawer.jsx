// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import {
  Drawer, List, Toolbar,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { DRAWER_WIDTH } from '../constants';

const styles = theme => ({
  /* || Side Bar */
  drawerExpanded: {
    [theme.breakpoints.up('lg')]: {
      width: DRAWER_WIDTH,
    },
  },
  drawerPaper: {
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    // eslint-disable-next-line max-len
    boxShadow: 'rgba(0, 0, 0, 0.06) 0px 5px 5px -3px, rgba(0, 0, 0, 0.043) 0px 8px 10px 1px, rgba(0, 0, 0, 0.035) 0px 3px 14px 2px',
    overflowX: 'hidden',
    overflowY: 'auto',
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
});

function ResponsiveDrawer({ classes, listElements }) {

  return (
    <nav className={classes.drawerExpanded} aria-label="navigation">
      <Drawer
        classes={{
          paper: classes.drawerPaper,
        }}
        variant="permanent"
        open
      >
        <Toolbar />
        <List className={classes.list}>
          {listElements}
        </List>
      </Drawer>
    </nav>
  );
}

ResponsiveDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation()(withStyles(styles)(ResponsiveDrawer));
