// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { useEffect, useRef, useState  } from "react";
import { useAppContext } from "../azure/AppContext";
import { withStyles } from "@mui/styles";
import { fetchEventsData } from "../actions/calendar";
import { useTypeDispatch } from "../store";
import AuthenticatedView from "../components/AuthenticatedView";
import { withTranslation } from "react-i18next";
import {
  Button,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";
import IosShareIcon from "@mui/icons-material/IosShare";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ShareCalendar from "../components/calendar/ShareCalendar"
import SchedularView from "../components/calendar/SchedularView";
import { fetchContactsData } from "../actions/contacts";
import { List } from "@mui/icons-material";

const styles = () => ({
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
    outline: 'none',
    background: 'none',
    cursor: 'pointer',
  },
  dropdownOption: {
    width: '200px',
    background: 'black',
    color:'white'
  },
  dropdownParent: {
    display: "flex",
    gap: "4px",
    justifyContent: 'center',
    alignItems: 'center',
    "&:hover": {
      background: "rgba(0, 0, 0, 0.04)",
    },
    cursor: 'pointer',
    padding: '0px 10px',
    borderRadius: '5px'
  },
  outlinedButton: {
    paddingRight: 7,
    paddingLeft: 7,
  }
});

const ActionButton = ({children, color, classes, ...childProps }: any) => {
  return (
    <Button
      color={color || "inherit"}
      style={color ? undefined : { color: "secondary" }}
      classes={{
        outlined: classes.outlinedButton,
      }}
      {...childProps}
    >
      {children}
    </Button>
  );
};


function Calendar({ t, classes }: any) {
  const app = useAppContext();
  const dispatch: any = useTypeDispatch();
  const [showCalenderSidebar, setShowCalenderSidebar] = useState(localStorage.getItem("calendarSidebar") === "true");
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState(localStorage.getItem("calendarView") || "month");
  const schedulerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchEventsData());
    dispatch(fetchContactsData());
  }, [app.authProvider]);

  const handleViewChange = (view: string) => () => {
    (schedulerRef.current?.["scheduler"] as any).handleState(view, "view");
    setView(view);
    localStorage.setItem("calendarView", view);
  };

  const handleListView = () => {
    setView("list");
  }

  const handleClickOpen = () => {
    setVisible(true);
  };

  const onHide = () => {
    setVisible(false);
  };

  const handleSidebar = () => {
    const newVal = !showCalenderSidebar;
    setShowCalenderSidebar(newVal);
    localStorage.setItem("calendarSidebar", newVal.toString());
  }

  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <nav className={classes.nav} key={1}>
          <div className={classes.iconButtondiv}>
            <IconButton
              onClick={handleSidebar}
            >
              <MenuIcon />
            </IconButton>
            <ActionButton
              key={1}
              startIcon={<DateRangeIcon />}
              value="Day"
              onClick={handleViewChange("day")}
              variant={view === "day" ? "outlined" : "text"}
              classes={classes}
            >
              Day
            </ActionButton>
            <ActionButton
              key={2}
              startIcon={<CalendarViewWeekIcon />}
              value='week'
              onClick={handleViewChange("week")}
              variant={view === "week" ? "outlined" : "text"}
              classes={classes}
            >
              Week
            </ActionButton>
            <ActionButton
              key={3}
              startIcon={<CalendarMonthIcon/>}
              onClick={handleViewChange("month")}
              variant={view === "month" ? "outlined" : "text"}
              classes={classes}
            >
              Month
            </ActionButton>
            <ActionButton
              key={4}
              startIcon={<List/>}
              onClick={handleListView}
              variant={view === "list" ? "outlined" : "text"}
              classes={classes}
            >
              List
            </ActionButton>
          </div>
          <div className="left-items">
            <ActionButton
              key={4}
              startIcon={<IosShareIcon/>}
              onClick={handleClickOpen}
              classes={classes}
            >
              Share
            </ActionButton>
          </div>
        </nav>,
      ]}
    >
      <SchedularView
        showSideBar={showCalenderSidebar}
        ref={schedulerRef}
        listViewActive={view === "list"}
      />
      <ShareCalendar onHide={onHide} visible={visible}/>
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
