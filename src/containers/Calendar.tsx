// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { useEffect, useState, useRef  } from "react";
import { useAppContext } from "../azure/AppContext";
import { withStyles } from "@mui/styles";
import { fetchEventsData } from "../actions/calendar";
import { useTypeDispatch } from "../store";
import ScheduleCalendar from "../components/calendar/Scheduler";
import AuthenticatedView from "../components/AuthenticatedView";
import { withTranslation } from "react-i18next";
import {
  Button,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import PrintIcon from "@mui/icons-material/Print";
import IosShareIcon from "@mui/icons-material/IosShare";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ReactToPrint from 'react-to-print';


const styles: any = {
  nav: {
    display: "flex",
    gap: "10px",
  },
  iconButtondiv: {
    display: "flex",
    gap: "15px",
    borderRight: "2px solid #cdc9c98a",
    paddingRight: "10px",
  },
  dropdown: {
    border: 'none',
    fontSize: '16px',
    color: 'rgba(0, 0, 0, 0.54)',
    outline: 'none',
    background: 'none',
    cursor: 'pointer',
  },
  dropdownOption: {
    width: '200px'
  },
  dropdownParent: {
    display: "flex",
    gap: "4px",
    justifyContent: 'center',
    alignItems: 'center',
    color: 'rgba(0, 0, 0, 0.54)',
    "&:hover": {
      background: "rgba(0, 0, 0, 0.04)",
    },
    cursor: 'pointer',
    padding: '0px 10px',
    borderRadius: '5px'
  }
};

const ActionButton = ({ classes, children, color, ...childProps }: any) => {
  return (
    <Button
      color={color || "inherit"}
      style={color ? undefined : { color: "#0000008a" }}
      {...childProps}
    >
      {children}
    </Button>
  );
};


function Calendar({ t, classes }: any) {
  
  const app = useAppContext();
  const dispatch: any = useTypeDispatch();
  const [calenderView, setCalenderView] = useState("Month");
  const [showCalenderSidebar, SetShowCalenderSidebar] = useState(true);
  const [selectDays, SetselectDays] = useState();

  useEffect(() => {
    dispatch(fetchEventsData({ app }));
  }, [app.authProvider]);


  const handleOptionChange = (event: any) => {
    SetselectDays(event.target.value);
    setCalenderView("Week")
  };

  const componentRef = useRef(null);

  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <nav className={classes.nav}>
          <div className={classes.iconButtondiv}>
            <IconButton
              onClick={() => SetShowCalenderSidebar(!showCalenderSidebar)}
            >
              <MenuIcon />
            </IconButton>
            <div className={classes.dropdownParent}>
              <VerticalSplitIcon />
              <select
                id="dropdown"
                className={classes.dropdown}
                style={{ border: 'none' }}
                onChange={handleOptionChange}>
                {[1, 2, 3, 4, 5, 6, 7].map((x, index) => <option className={classes.dropdownOption} value={x} key={index}>Day {x}</option>)}
              </select>
            </div>
            <ActionButton
              key={1}
              startIcon={<DateRangeIcon color={"secondary"} />}
              value="workWeek"
              onClick={handleOptionChange}
            >
              Work Week
            </ActionButton>
            <ActionButton
              key={2}
              startIcon={<CalendarViewWeekIcon color={"secondary"} />}
              value='week'
              onClick={handleOptionChange}
            >
              Week
            </ActionButton>
            <ActionButton
              key={3}
              startIcon={<CalendarMonthIcon color={"secondary"} />}
              onClick={() => setCalenderView("Month")}
            >
              Month
            </ActionButton>
          </div>
          <div className="left-items">
            <ActionButton
              key={5}
              startIcon={<IosShareIcon color={"secondary"} />}
            >
              Share
            </ActionButton>
            <ReactToPrint
              trigger={() => <ActionButton key={6} startIcon={<PrintIcon color={"secondary"} />}>
                Print
              </ActionButton>}
              content={() => componentRef.current}
              documentTitle='new Calendar'
            />

          </div>
        </nav>,
      ]}
    >
      <ScheduleCalendar
        app={app}
        calenderView={calenderView}
        showSideBar={showCalenderSidebar}
        selectDays={selectDays}
        componentRef={componentRef}
      />
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
