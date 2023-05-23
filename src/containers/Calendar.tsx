// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import {useState } from 'react';
import { withStyles } from '@mui/styles';
import AuthenticatedView from '../components/AuthenticatedView';
import { withTranslation } from 'react-i18next';
import { Button, Menu, MenuItem} from '@mui/material';
import { RetractableCalendar } from './calendar/RetractableCalender';
import GetTrial from "./calendar/AddCalendar";
import "./calendar/calender.css";

// import { DayView, MonthView, WeekView, Scheduler } from '@devexpress/dx-react-scheduler-material-ui';
import {
  Scheduler,
  Toolbar,
  MonthView,
  WeekView,
  DayView,
  Appointments,
  AppointmentTooltip,
  DragDropProvider,
  EditRecurrenceMenu,
  AllDayPanel,
  TodayButton,
  DateNavigator,
} from '@devexpress/dx-react-scheduler-material-ui';
import { EditingState, ViewState } from '@devexpress/dx-react-scheduler';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const styles: any = {
};
type ViewOption = 'Day' | 'Week' | 'Month';

interface CalendarProps {
  onChange?: (option: ViewOption) => void;
  value: ViewOption; 
}

const CustomViewSwitcher: React.FC<CalendarProps> = ({ onChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOption, setSelectedOption] = useState<ViewOption>('Day');

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (option: ViewOption) => {
    setSelectedOption(option);
    handleMenuClose();

    if (onChange) {
      onChange(option);
    }
  };


  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleButtonClick}>
        {selectedOption || 'Select Time Unit'}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => handleClick('Day')}
          selected={selectedOption === 'Day'}
        >
          Day
        </MenuItem>
        <MenuItem
          onClick={() => handleClick('Week')}
          selected={selectedOption === 'Week'}
        >
          Week
        </MenuItem>
        <MenuItem
          onClick={() => handleClick('Month')}
          selected={selectedOption === 'Month'}
        >
          Month
        </MenuItem>
      </Menu>
    </div>
  );
};

interface Appointment {
  id: number;
}


function Calendar({ t }: any){
  const [currentView, setCurrentView] = useState<ViewOption>('Month');
  // eslint-disable-next-line
  const [data, setData] = useState<Appointment[]>([]);
  const [displaySmallCalendar, setDisplaySmallCalendar] = useState(false);

  const toggleSmallCalendar = () => {
    setDisplaySmallCalendar((prevState) => !prevState);
  };

  const handleViewSwitch = (option: ViewOption) => {
    setCurrentView(option);
  };

  const commitChanges = ({ added, changed, deleted }: any) => {
    setData((prevData) => {
      let updatedData = [...prevData];

      if (added) {
        const startingAddedId = prevData.length > 0 ? prevData[prevData.length - 1].id + 1 : 0;
        updatedData = [...updatedData, { id: startingAddedId, ...added }];
      }

      if (changed) {
        updatedData = updatedData.map((appointment) =>
          changed[appointment.id] ? { ...appointment, ...changed[appointment.id] } : appointment
        );
      }

      if (deleted !== undefined) {
        updatedData = updatedData.filter((appointment) => appointment.id !== deleted);
      }

      return updatedData;
    });
  };

  return (
    <AuthenticatedView 
      header={t('Calendar')}
      actions={[
        <div style={{display:'flex', flexDirection:'row'}} key={0}>
          <div  onClick={toggleSmallCalendar} style={{marginRight:"1em", marginTop:"0.5em"}}>
            <FontAwesomeIcon  icon={faBars} style={{height:"20px"}}/>       
          </div>
          <Button key={1} variant="contained" color="primary">
            {t('New event')}
          </Button>,
          <CustomViewSwitcher value={currentView} onChange={handleViewSwitch} key={2} />
        </div>
      ]}
    >
      <div className="rowOrColumn">
        <div className={displaySmallCalendar ? 'displayOrNone' : ''}>
          <RetractableCalendar  />
          <hr/>
          <GetTrial />
        </div>
        <Scheduler >
          <ViewState
            defaultCurrentDate={new Date()}
          />
          <EditingState
            onCommitChanges={commitChanges}
          />
          {currentView === 'Day' ? <DayView /> :
            currentView === 'Week' ? <WeekView /> :
              currentView === 'Month' ? <MonthView />: null}
          <AllDayPanel />
          <EditRecurrenceMenu />
          <Appointments />
          <AppointmentTooltip
            showOpenButton
            showCloseButton
            showDeleteButton
          />
          <Toolbar />
          <DateNavigator /> 
          <TodayButton />   
          <DragDropProvider />
        </Scheduler>        
      </div>
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Calendar));
