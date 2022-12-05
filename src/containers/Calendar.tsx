// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { add, format, getDay, parseISO } from 'date-fns';
import { endOfWeek, startOfWeek } from 'date-fns/esm';

import { useAppContext } from '../azure/AppContext';
import CalendarDayRow from '../components/CalendarDayRow';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { Button } from '@mui/material';
import { fetchEventsData } from '../actions/calendar';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Event } from 'microsoft-graph';

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
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
  const navigate = useNavigate();
  const events = useTypeSelector(state => state.calendar.events);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, []);

  const handleNavigation = (path: string) => (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    navigate(`/${path}`);
  };
  
  // <ReturnSnippet>
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(weekStart);

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <div className="mb-3">
          <h1 className="mb-3">{format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}</h1>
          <Button variant="contained" onClick={handleNavigation('newevent')}>New event</Button>
        </div>
        <div className={classes.centerRow}>
          {events && <Table size="sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5, 6].map(idx =>
                <CalendarDayRow
                  key={idx}
                  date={idx ? add(weekStart, { days: idx }) : weekStart}
                  timeFormat={app.user?.timeFormat!}
                  events={events!.filter((event: Event) => getDay(parseISO(event.start?.dateTime!)) === idx)} />
              )}
            </tbody>
          </Table>}
        </div>
      </div>
    </AuthenticatedTemplate>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Calendar);
