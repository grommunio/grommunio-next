// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { fetchEventsData } from '../actions/calendar';
import { useTypeDispatch } from '../store';
import ScheduleCalendar from './calendar/Scheduler';
import AuthenticatedView from '../components/AuthenticatedView';

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
  },
  centerRow: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  }
};

function Calendar({ classes }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);


  return (
    <AuthenticatedView rootClass={classes.root}>
      <ScheduleCalendar />
    </AuthenticatedView>
  );
}


export default withStyles(styles)(Calendar);
