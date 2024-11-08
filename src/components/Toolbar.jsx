// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Paper } from "@mui/material";
import { withStyles } from "@mui/styles";

const styles = {
  root: {
    padding: 8,
    marginTop: 16,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
  },
}

const Toolbar = ({ classes, children }) => {
  return (
    <Paper className={classes.root}>
      {children}
    </Paper>
  );
}

export default withStyles(styles)(Toolbar);
