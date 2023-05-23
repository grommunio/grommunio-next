// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { fetchEventsData, fetchUserCalendars } from '../actions/calendar';
import { useTypeDispatch } from '../store';
import ScheduleCalendar from './calendar/Scheduler';
import AuthenticatedView from '../components/AuthenticatedView';
import { withTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { ExternalViewSwitcher } from './calendar/Scheduler';
import MenuIcon from '@mui/icons-material/Menu';
import { IconButton } from '@mui/material';

const styles: any = {
};

function Calendar({ t }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);

  useEffect(() => {
    dispatch(fetchUserCalendars(app));
  }, [app.authProvider]);

  const [currentViewName, setCurrentViewName] = useState('Month');
  const [toggleSide, setToggleSide] = useState(true);

  const handleViewChange = (viewName: string) => {
    setCurrentViewName(viewName);
  };

  const handleToggleSide = () => {
    setToggleSide(!toggleSide);
  };

  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px 5px'}}>
          <IconButton onClick={handleToggleSide} style={{ marginRight: 20}}>
            <MenuIcon />
          </IconButton>
          <Button key={0} variant='contained' color="primary">
            {"New event"}
          </Button>
          <ExternalViewSwitcher
            currentViewName={currentViewName}
            onChange={handleViewChange}
          />
        </div>
      ]}
    >
      <ScheduleCalendar app={app} currentViewName={currentViewName} toggleSide={toggleSide}/>
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
