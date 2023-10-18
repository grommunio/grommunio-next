// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useEffect, useState, ChangeEvent } from 'react';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, IconButton, Paper, TablePagination, ListItem, ListItemButton, ListItemText, List, ListItemAvatar, Avatar, Checkbox } from '@mui/material';
import { Contact, ContactFolder, EmailAddress } from 'microsoft-graph';
import { fetchContactFoldersData, fetchContactsData } from '../actions/contacts';
import AddContact from '../components/dialogs/AddContact';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import IosShareIcon from "@mui/icons-material/IosShare";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { CSVLink } from 'react-csv';
import FolderList from '../components/FolderList';
import ContactForm from '../components/ContactForm';
import { Contact as ContactType } from 'microsoft-graph';
import Hover from '../components/Hover';
import { CheckBoxOutlined } from '@mui/icons-material';


const styles: any = {
  nav: {
    display: "flex",
    gap: 20
  },
  content: {
    flex: 1,
    display: 'flex',
  },
  paginationContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  }
};

function Contacts({ classes }: any) {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { contacts, contactFolders } = useTypeSelector(state => state.contacts);
  const [selectedContactFolder, setSelectedContactFolder] = useState<ContactFolder | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [checkedContacts, setCheckedContacts] = useState<Array<Contact>>([]);

  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedContact({
      ...selectedContact,
      [field]: e.target.value,
    })
  };

  const handleNestedChange = (field: string, nested: string) => (e: ChangeEvent<HTMLInputElement>) => {
    if(selectedContact) setSelectedContact({
      ...selectedContact,
      [field]:  {
        ...(selectedContact[field as keyof ContactType] as Record<string, unknown>),
        [nested]: e.target.value,
      }
    })
  };

  useEffect(() => {
    dispatch(fetchContactsData());
    dispatch(fetchContactFoldersData());
  }, []);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  const handleContact = (contact: Contact) => () => {
    setSelectedContact(contact);
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };


  function formatContactsToCSV(contacts: any) {
    const csvData = [
      ['Name', 'Email Addresses'], // CSV header row
      ...contacts.map((contact: Contact) => [
        contact.displayName,
        contact.emailAddresses?.map((obj: EmailAddress) => obj.address).join(', '),
      ]),
    ];

    return csvData;
  }

  const csvData = formatContactsToCSV(contacts);

  const handleContactFolderClick = (contactFolder: ContactFolder | null) => () => {
    setSelectedContactFolder(contactFolder);
  }

  const handleMailCheckbox = (contact: Contact) => (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const copy = [...checkedContacts];
    if(e.target.checked) {
      copy.push(contact);
    } else {
      copy.splice(copy.findIndex(m => m.id === contact.id), 1);
    }
    setCheckedContacts(copy);
  }

  const handleCheckAll = () => {
    setCheckedContacts(contacts.length === checkedContacts.length ? [] : contacts);
  }

  return (
    <AuthenticatedView
      header={t("Contacts")}
      actions={
        <nav className={classes.nav} key={1}>
          <Button
            onClick={handleAdding(true)}
            variant="contained"
            color="primary"
            className={classes.addButton}
          >
            {t("New contact")}
          </Button>
          <Paper
            component="form"
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 960 }}
          >
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search"
              inputProps={{ 'aria-label': 'search google maps' }}
            />

            <IconButton color="primary" sx={{ p: '10px' }} aria-label="directions">
              <FilterListIcon />
            </IconButton>
          </Paper>
          <CSVLink
            data={csvData}
            filename={'contacts.csv'}
            style={{ marginTop: "7px" }}
          >
            <Button
              startIcon={<IosShareIcon />}
              color="secondary"
            >
              {t("Export")}
            </Button>
          </CSVLink>
          <Button
            startIcon={<DeleteOutlineIcon />}
            color="secondary"
          >
            {t("Delete All")}
          </Button>
        </nav>
      }
    >
      <div className={classes.content}>
        <FolderList>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleContactFolderClick(null)}
              divider
              selected={!selectedContactFolder?.id}
            >
              <ListItemText primary={t("All contacts")} />
            </ListItemButton>
          </ListItem>
          {contactFolders.map((contactFolder: ContactFolder, idx: number) => 
            <ListItem disablePadding key={idx}>
              <ListItemButton
                onClick={handleContactFolderClick(contactFolder)}
                divider
                selected={selectedContactFolder?.id === contactFolder.id}
              >
                <ListItemText primary={contactFolder.displayName} />
              </ListItemButton>
            </ListItem>)}
        </FolderList>
        <Paper sx={{ ml: 1, display: 'flex', flexDirection: 'column' }}>
          <div>
            <IconButton sx={{ my: 1, mx: 1.5 }} onClick={handleCheckAll} className={classes.checkAll}>
              <CheckBoxOutlined color={checkedContacts.length === contacts.length ? "primary" : "secondary"}/>
            </IconButton>
          </div>
          <List>
            {(rowsPerPage > 0
              ? contacts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : contacts
            ).map((contact: Contact, idx: number) => {
              const checked = checkedContacts.includes(contact)
              return <Hover>
                {(hover: boolean) => hover || checked ? <ListItemButton
                  key={idx}
                  onClick={handleContact(contact)}
                >
                  <ListItemAvatar>
                    <Checkbox
                      sx={{ p: 0.5 }}
                      checked={checked}
                      onChange={handleMailCheckbox(contact)}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.displayName}
                    secondary={contact.emailAddresses?.length && contact.emailAddresses[0].address}
                  />
                </ListItemButton> : <ListItemButton key={idx} onClick={handleContact(contact)}>
                  <ListItemAvatar>
                    <Avatar>
                      {contact.initials}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.displayName}
                    secondary={contact.emailAddresses?.length && contact.emailAddresses[0].address}
                  />
                </ListItemButton>}
              </Hover>
            })}
          </List>
          <div className={classes.paginationContainer}>
            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              style={{ color: 'white' }}
              component="div"
              count={contacts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </Paper>
        {selectedContact &&
          <ContactForm
            contact={selectedContact}
            handleChange={handleChange}
            handleNestedChange={handleNestedChange}
          />}
      </div>
      <AddContact open={adding} onClose={handleAdding(false)} />
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Contacts);
