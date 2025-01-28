// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import PropTypes from 'prop-types';
import AppRoutes from '../Routes';
import Drawer from './Drawer';
import AppLoader from './AppLoader';
import { useAppContext } from '../azure/AppContext';

export default function MainView({ classes, routesProps }) {
  const { loading } = useAppContext();

  // Don't flash the login page while the session is being restored
  if (loading) {
    return <AppLoader />;
  }

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
