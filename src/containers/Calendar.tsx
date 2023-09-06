// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from "react";
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
  MenuItem,
} from "@mui/material";
// import TodayIcon from "@mui/icons-material/Today";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import VerticalSplitIcon from "@mui/icons-material/VerticalSplit";
import PrintIcon from "@mui/icons-material/Print";
import EventIcon from "@mui/icons-material/Event";
import IosShareIcon from "@mui/icons-material/IosShare";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DateRangeIcon from "@mui/icons-material/DateRange";

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
    background:'none',
    cursor:'pointer',
  },
  dropdownOption:{
    width:'200px'
  },
  dropdownParent:{
    display: "flex", 
    gap: "4px", 
    justifyContent:'center', 
    alignItems:'center', 
    color:'rgba(0, 0, 0, 0.54)', 
    "&:hover": {
      background: "rgba(0, 0, 0, 0.04)",
    },
    cursor:'pointer',
    padding:'0px 10px',
    borderRadius:'5px'
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
            {/* <ActionButton
              key={0}
              variant="contained"
              color="primary"
              startIcon={<EventIcon />}
            >
              New event
            </ActionButton> */}
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
            <ActionButton key={6} startIcon={<PrintIcon color={"secondary"} />}>
              Print
            </ActionButton>
          </div>
        </nav>,
      ]}
    >
      <ScheduleCalendar
        app={app}
        calenderView={calenderView}
        showSideBar={showCalenderSidebar}
        selectDays={selectDays}
      />
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
