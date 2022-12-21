// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';

import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Contact, EmailAddress } from 'microsoft-graph';
import { fetchContactsData } from '../actions/contacts';

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

function Contacts({ classes }: any) {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchContactsData(app));
  }, []);

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant='h4'>Contacts</Typography>
        <Paper className={classes.paper}>
          <Table>
            <TableHead>
              <TableCell>Name</TableCell>
              <TableCell>E-Mail Addresses</TableCell>
            </TableHead>
            <TableBody>
              {contacts.map((contact: Contact, idx: number) =>
                <TableRow key={idx}>
                  <TableCell>
                    {contact.displayName}
                  </TableCell>
                  <TableCell>
                    {contact.emailAddresses?.map((obj: EmailAddress) => obj.address).join(', ')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </div>
    </AuthenticatedTemplate>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Contacts);
