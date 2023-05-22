// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import {
  List,
} from '@mui/material';
import { withStyles } from '@mui/styles';
import { DRAWER_WIDTH } from '../constants';

const styles = {
  drawerExpanded: {
    width: DRAWER_WIDTH,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
};

function FolderList({ classes, children }) {

  return (
    <div className={classes.drawerExpanded}>
      <List className={classes.list}>
        {children}
      </List>
    </div>
  );
}

FolderList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(FolderList);
