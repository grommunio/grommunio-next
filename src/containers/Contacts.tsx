// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useEffect, useState, MouseEvent } from 'react';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Contact, EmailAddress } from 'microsoft-graph';
import { deleteContactData, fetchContactsData } from '../actions/contacts';
import AddContact from '../components/dialogs/AddContact';
import { Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import { useNavigate } from 'react-router-dom';
import Checkbox from '@mui/material/Checkbox';

const styles: any = {
  paper: {
    flex: 1,
  },
  nav: {
    display: "flex",
  },
};

function Contacts({ classes }: any) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [adding, setAdding] = useState<boolean>(false);
  const [selected, setSelected] = useState<readonly string[]>([]);

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  useEffect(() => {
    dispatch(fetchContactsData());
  }, []);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  const handleDelete = (contactId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteContactData(contactId));
  }

  const handleContact = (contact: Contact) => () => {
    navigate('/contacts/' + contact.id)
  }

  return (
    <AuthenticatedView
      header={t('Contacts')}
      actions={
        <nav className={classes.nav} key={1}>
          <Button onClick={handleAdding(true)} variant='contained' color="primary" className={classes.addButton}>
            {t("New contact")}
          </Button>
          <div>

          </div>
        </nav>
      }
    >
      <Paper className={classes.paper}>
        <Table>
          <TableHead>
            <TableRow
            >
              <TableCell>{t("#")}</TableCell>
              <TableCell>{t("Name")}</TableCell>
              <TableCell>{t("E-Mail Addresses")}</TableCell>
              <TableCell padding='checkbox' />
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact: Contact, idx: number) => {
              // const isItemSelected = isSelected(contact.displayName);
              const labelId = `enhanced-table-checkbox-${idx}`;
              return (
                <TableRow
                  hover
                  role="checkbox"
                  key={idx}
                  onClick={handleContact(contact)}
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      inputProps={{
                        'aria-labelledby': labelId,
                      }}
                    />
                  </TableCell>
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
                </TableRow>)
            })}
          </TableBody>
        </Table>
      </Paper>
      <AddContact
        open={adding}
        onClose={handleAdding(false)}
      />
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Contacts);
