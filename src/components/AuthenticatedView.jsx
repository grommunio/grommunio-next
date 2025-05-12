// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { withStyles } from '@mui/styles';
import Toolbar from "./Toolbar";

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: "0px 16px 16px 16px",
    overflow: 'auto',
  },
}

// Container for modules still on the old toolbar layout
function AuthenticatedView({ classes, children, actions=null }) {
  return (
    <div className={classes.root}>
      <Toolbar>{actions}</Toolbar>
      {children}
    </div>
  );
}

export default withStyles(styles)(AuthenticatedView);
