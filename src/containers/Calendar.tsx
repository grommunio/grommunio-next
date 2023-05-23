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
import TodayIcon from "@mui/icons-material/Today";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MenuIcon from "@mui/icons-material/Menu";

const styles: any = {
  boxContainer: {
    marginLeft: 10,
    marginRight: 10,
    cursor: "pointer",
  },
  btnContainer: {
    display: "flex",
  }
};

type CalenderProps = {
  classes: any;
  t: any;
};

function Calendar({classes, t}: CalenderProps) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();

  const [currentViewName, setCurrentViewName] = useState("Week");
  const [leftCalenderToggle, setLeftCalenderToggle] = useState(false);

  const viewNameChange = (name: string) => {
    setCurrentViewName(name);
  };
  const handleLeftCalenderToggle = () => {
    setLeftCalenderToggle(!leftCalenderToggle);
  };

  const ExternalViewSwitcher = () => (
    <div className={classes.btnContainer}>
      <IconButton
        onClick={() => handleLeftCalenderToggle()}
        style={{ marginRight: 8 }}
      >
        <MenuIcon />
      </IconButton>
      <Button key={0} variant="contained" color="primary">
        {"New event"}
      </Button>
      <Button color="secondary" className={classes.boxContainer} variant="outlined"  startIcon={<TodayIcon />} onClick={() => viewNameChange("Day")}>
        Day
      </Button>
      <Button color="secondary" className={classes.boxContainer} variant="outlined"  startIcon={<CalendarViewWeekIcon />} onClick={() => viewNameChange("Week")}>
        Week
      </Button>
      <Button color="secondary" className={classes.boxContainer} variant="outlined"  startIcon={<CalendarMonthIcon />} onClick={() => viewNameChange("Month")}>
        Month
      </Button>
    </div>
  );

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);


  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[<ExternalViewSwitcher />]}
    >
       <ScheduleCalendar app={app} currentViewName={currentViewName}
        leftCalenderToggle={leftCalenderToggle}/>
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
