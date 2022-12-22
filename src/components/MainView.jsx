// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import Drawer from './Drawer';
import AppRoutes from '../Routes';

export default function MainView(props) {
  const { classes, routesProps } = props;
  return (
    <div className={classes.mainView}>
      {routesProps?.authenticated &&
        <Drawer />}
      <AppRoutes childProps={{ authenticated: false }}/>
    </div>
  );
}

MainView.propTypes = {
  classes: PropTypes.object.isRequired,
  routesProps: PropTypes.object.isRequired,
};
