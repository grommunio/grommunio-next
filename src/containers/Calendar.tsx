// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { fetchEventsData } from '../actions/calendar';
import { useTypeDispatch } from '../store';
import ScheduleCalendar from './calendar/Scheduler';
import AuthenticatedView from '../components/AuthenticatedView';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TextField from '@mui/material/TextField';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { withTranslation } from 'react-i18next';
import { Button } from '@mui/material';

const styles: any = {
  calendarContainer: {
    display: 'flex',
    flexDirection: 'row'
  }
};

function Calendar({ classes, t }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [value, setValue] = useState<any>(new Date('2023-04-07'));

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);

  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <Button key={0} variant='contained' color="primary">
          {"New event"}
        </Button>
      ]}
    >
      <div className={classes.calendarContainer}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticDatePicker
            orientation="landscape"
            openTo="day"
            value={value}
            onChange={(newValue) => {
              setValue(newValue);
            }}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        <ScheduleCalendar app={app}/>
      </div>
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
