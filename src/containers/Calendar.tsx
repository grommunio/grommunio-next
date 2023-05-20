// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from "react";
import { useAppContext } from "../azure/AppContext";
import { withStyles } from "@mui/styles";
import { fetchEventsData } from "../actions/calendar";
import { useTypeDispatch } from "../store";
import ScheduleCalendar from "./calendar/Scheduler";
import AuthenticatedView from "../components/AuthenticatedView";
import { withTranslation } from "react-i18next";
import { Button } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import grey from "../colors/grey";

const styles: any = {
  boxContainer: {
    display: "flex",
    alignItems: "end",
    alignSelf: "end",
    justifyContent: "space-between",
    border: "1px solid black",
    width: "7%",
    borderRadius: 5,
    backgroundColor: grey.A100,
    padding: 10,
    marginLeft: 10,
    marginRight: 10,
    cursor: "pointer",
  },
  btnContainer: {
    display: "flex",
  },
};

type SwitcherProps = {
  currentViewNameChange: (name: string) => void;
};

type CalenderProps = {
  classes: any;
  t: any;
};

function Calendar({ classes, t }: CalenderProps) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [currentViewName, setCurrentViewName] = useState("Week");

  const viewNameChange = (name: string) => {
    setCurrentViewName(name);
  };

  const ExternalViewSwitcher = ({ currentViewNameChange }: SwitcherProps) => (
    <div className={classes.btnContainer}>
      <Button key={0} variant="contained" color="primary">
        {"New event"}
      </Button>
      <div
        key={1}
        className={classes.boxContainer}
        onClick={() => currentViewNameChange("Day")}
      >
        <TodayIcon />
        {"Day"}
      </div>
      ,
      <div
        key={2}
        className={classes.boxContainer}
        onClick={() => currentViewNameChange("Week")}
      >
        <CalendarViewWeekIcon />
        {"Week"}
      </div>
      ,
      <div
        key={3}
        className={classes.boxContainer}
        onClick={() => currentViewNameChange("Month")}
      >
        <CalendarMonthIcon />
        {"Month"}
      </div>
    </div>
  );

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);

  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <ExternalViewSwitcher currentViewNameChange={viewNameChange} />,
      ]}
    >
      <ScheduleCalendar app={app} currentViewName={currentViewName} />
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
