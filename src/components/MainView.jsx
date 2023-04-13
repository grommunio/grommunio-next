// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import { useState } from 'react';
import AppRoutes from '../Routes';
import Drawer from './Drawer';
import { Toolbar } from '@mui/material';

export default function MainView({ classes }) {
  const [drawerElements, setDrawerElements] = useState([]);

  return (
    <div className={classes.mainView}>
      <Drawer
        listElements={drawerElements}
      />
      <div className={classes.routes}>
        <Toolbar />
        <AppRoutes childProps={{
          authenticated: false,
          setDrawerElements,
          drawerListElementClass: classes.drawerListElementClass,
        }}/>
      </div>
    </div>
  );
}

MainView.propTypes = {
  classes: PropTypes.object.isRequired,
  routesProps: PropTypes.object.isRequired,
};
