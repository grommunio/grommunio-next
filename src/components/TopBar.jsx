// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { AppBar, Button, Toolbar} from '@mui/material';
import { withRouter } from './hocs/withRouter';


const styles = {
  appbar: {
    height: 64,
  },
};

class TopBar extends PureComponent {

  state = {
  }

  handleNavigation = path => event => {
    const { router } = this.props;
    event.preventDefault();
    router.navigate(`/${path}`);
  }

  render() {
    const { classes } = this.props;
  
    return (
      <AppBar color='primary' position="fixed" className={classes.appbar}>
        <Toolbar>
          <Button color="inherit" onClick={this.handleNavigation('calendar')}>Calendar</Button>
        </Toolbar>
      </AppBar>
    );
  }
}

TopBar.propTypes = {
  router: PropTypes.object.isRequired,
};


export default withRouter(withStyles(styles)(TopBar));
