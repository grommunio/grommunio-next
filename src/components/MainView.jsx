// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import PropTypes from 'prop-types';
import AppRoutes from '../Routes';

export default function MainView() {
  return (
    <AppRoutes childProps={{ authenticated: false }}/>
  );
}

MainView.propTypes = {
  classes: PropTypes.object.isRequired,
  routesProps: PropTypes.object.isRequired,
};
