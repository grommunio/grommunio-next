// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';

import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { Person } from 'microsoft-graph';
import { fetchPeopleData } from '../actions/user';

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    display: 'flex',
  },
  paper: {
    flex: 1,
    marginTop: 8,
  },
};

function People({ classes }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const { people } = useTypeSelector(state => state.user);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchPeopleData(app));
  }, []);

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant='h4'>People {":)"}</Typography>
        <Paper className={classes.paper}>
          <List>
            {people.map((person: Person, idx: number) =>
              <ListItem key={idx}>
                <ListItemText
                  primary={person.displayName}
                  secondary={person.givenName}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </div>
    </AuthenticatedTemplate>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(People);
