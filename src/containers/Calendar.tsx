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
import { withTranslation } from 'react-i18next';
import { Button, IconButton } from '@mui/material';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';

const styles: any = {
};

function Calendar({ t }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [calenderView, setCalenderView] = useState("Month");
  const [showCalenderSidebar, SetShowCalenderSidebar] = useState(true);

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);


  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <IconButton onClick={() => SetShowCalenderSidebar(!showCalenderSidebar)}>
          <HorizontalSplitIcon />
        </IconButton>,
        <Button key={0} variant='contained' color="primary">
          {"New event"}
        </Button>,
        <IconButton onClick={() => setCalenderView("Day")}>
          <ViewDayIcon /> Day
        </IconButton>,
        <IconButton onClick={() => setCalenderView("Week")}>
          <DateRangeIcon /> Week
        </IconButton>,
        <IconButton onClick={() => setCalenderView("Month")}>
          <CalendarMonthIcon /> Month
        </IconButton>,
      ]}
    >
      <ScheduleCalendar app={app} calenderView={calenderView} showSideBar={showCalenderSidebar} />
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
