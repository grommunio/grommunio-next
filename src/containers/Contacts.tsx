// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';

import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Contact, EmailAddress } from 'microsoft-graph';
import { fetchContactsData } from '../actions/contacts';
import AddContact from '../components/dialogs/AddContact';

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
  const [adding, setAdding] = useState<boolean>(false);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchContactsData(app));
  }, []);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant='h4'>Contacts</Typography>
        <div>
         <Button onClick={handleAdding(true)} variant='contained' color="primary">New Contact</Button>
        </div>
        <Paper className={classes.paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>E-Mail Addresses</TableCell>
              </TableRow>
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
      <AddContact
        open={adding}
        onClose={handleAdding(false)}
      />
    </AuthenticatedTemplate>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Contacts);
