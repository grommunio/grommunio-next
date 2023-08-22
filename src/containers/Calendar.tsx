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
  Select,
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
    height: "40px",
  },
};

const ActionButton = ({ classes, children, color, ...childProps }: any) => {
  return (
    <Button  
      color={color || "inherit"}
      style={color ? undefined : { color: "#0000008a" }} // Can't be part of the class, because it would affect primary buttons too
      {...childProps}
    >
      {children}
    </Button>
  );
};

function Calendar({ t, classes }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [calenderView, setCalenderView] = useState("Month");
  const [showCalenderSidebar, SetShowCalenderSidebar] = useState(true);

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);

  const [selectedOption, setSelectedOption] = useState("1");

  const handleOptionChange = (event: any) => {
    setSelectedOption(event.target.value);
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
            <Select
              labelId="dropdown-label"
              id="dropdown"
              className={classes.dropdown}
              value={selectedOption}
              onChange={handleOptionChange}
            >
              <MenuItem value="1">Day 1</MenuItem>
              <MenuItem value="2">Day 2</MenuItem>
              <MenuItem value="3">Day 3</MenuItem>
              <MenuItem value="4">Day 4</MenuItem>
              <MenuItem value="5">Day 5</MenuItem>
              <MenuItem value="6">Day 6</MenuItem>
              <MenuItem value="7">Day 7</MenuItem>
            </Select>
            {/* <ActionButton
              key={1}
              startIcon={<TodayIcon color={"secondary"} />}
              onClick={() => setCalenderView("Day")}
            >
              Day
              <ExpandMoreIcon />
            </ActionButton> */}
            <ActionButton
              key={2}
              startIcon={<DateRangeIcon color={"secondary"} />}
              // onClick={() => setCalenderView("Day")}
            >
              Work Week
            </ActionButton>
            <ActionButton
              key={3}
              startIcon={<CalendarViewWeekIcon color={"secondary"} />}
              onClick={() => setCalenderView("Week")}
            >
              Week
            </ActionButton>
            <ActionButton
              key={4}
              startIcon={<CalendarMonthIcon color={"secondary"} />}
              onClick={() => setCalenderView("Month")}
            >
              Month
            </ActionButton>
            <ActionButton
              key={5}
              startIcon={<VerticalSplitIcon color={"secondary"} />}
            >
              Split view
            </ActionButton>
          </div>
          <div className="left-items">
            <ActionButton
              key={6}
              startIcon={<IosShareIcon color={"secondary"} />}
            >
              Share
            </ActionButton>
            <ActionButton key={7} startIcon={<PrintIcon color={"secondary"} />}>
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
      />
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
