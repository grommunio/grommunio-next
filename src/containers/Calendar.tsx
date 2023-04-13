// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { fetchEventsData } from '../actions/calendar';
import { useTypeDispatch } from '../store';
import ScheduleCalendar from './calendar/Scheduler';
import AuthenticatedView from '../components/AuthenticatedView';
import { withTranslation } from 'react-i18next';
import { Button } from '@mui/material';

const styles: any = {
};

function Calendar({ t }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();

  useEffect(() => {
    dispatch(fetchEventsData(app));
  }, [app.authProvider]);


  return (
    <AuthenticatedView
      header={t("Calendar")}
      actions={[
        <Button key={0} variant='contained' color="primary">
          {"New event"}
        </Button>
      ]}
    >
      <ScheduleCalendar app={app}/>
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Calendar));
