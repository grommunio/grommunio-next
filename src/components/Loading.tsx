// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent:'center', flex: 1}}>
      <CircularProgress />
    </div>
  );
}

Loading.propTypes = {
  classes: PropTypes.object.isRequired,
};
