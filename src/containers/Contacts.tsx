// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';

import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Contact, EmailAddress } from 'microsoft-graph';
import { deleteContactData, fetchContactsData } from '../actions/contacts';
import AddContact from '../components/dialogs/AddContact';
import { Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [adding, setAdding] = useState<boolean>(false);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchContactsData(app));
  }, []);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  const handleDelete = (contactId: string) => () => {
    dispatch(deleteContactData({app, contactId}));
  }

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant='h4'>{t('Contacts')}</Typography>
        <div>
          <Button onClick={handleAdding(true)} variant='contained' color="primary">
            {t("New contact")}
          </Button>
        </div>
        <Paper className={classes.paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("Name")}</TableCell>
                <TableCell>{t("E-Mail Addresses")}</TableCell>
                <TableCell padding='checkbox' />
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
                  <TableCell padding='checkbox'>
                    <IconButton onClick={handleDelete(contact.id || '')}>
                      <Delete color="error" />
                    </IconButton>
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
