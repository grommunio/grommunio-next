// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import AppRoutes from '../Routes';
import Drawer from './Drawer';

export default function MainView({ classes, routesProps }) {
  return (
    <div className={classes.mainView}>
      {routesProps.authenticated && <Drawer />}
      <div className={classes.routes}>
        <AppRoutes childProps={{
          ...routesProps,
        }}/>
      </div>
    </div>
  );
}

MainView.propTypes = {
  classes: PropTypes.object.isRequired,
  routesProps: PropTypes.object.isRequired,
};
