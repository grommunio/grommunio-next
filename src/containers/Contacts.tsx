// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useEffect, useState, MouseEvent } from 'react';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TablePagination } from '@mui/material';
import { Contact, EmailAddress } from 'microsoft-graph';
import { deleteContactData, fetchContactsData } from '../actions/contacts';
import AddContact from '../components/dialogs/AddContact';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import { useNavigate } from 'react-router-dom';
import IosShareIcon from "@mui/icons-material/IosShare";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { CSVLink } from 'react-csv';

const styles: any = {
  nav: {
    display: "flex",
    gap: 20
  },
};

function Contacts({ classes }: any) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [adding, setAdding] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);



  useEffect(() => {
    dispatch(fetchContactsData());
  }, []);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  const handleDelete = (contactId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteContactData(contactId));
  }

  const handleContact = (contact: Contact) => () => {
    navigate('/contacts/' + contact.id);
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - contacts.length) : 0;

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
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("Name")}</TableCell>
              <TableCell>{t("E-Mail Addresses")}</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? contacts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : contacts
            ).map((contact: Contact, idx: number) => {
              return (
                <TableRow
                  hover
                  role="checkbox"
                  key={idx}
                  onClick={handleContact(contact)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{contact.displayName}</TableCell>
                  <TableCell>
                    {contact.emailAddresses
                      ?.map((obj: EmailAddress) => obj.address)
                      .join(", ")}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <CSVLink
                      data={formatContactsToCSV([contact])}
                      filename={'exported-data.csv'}
                      style={{ marginTop: "7px" }}
                    >
                      <IconButton onClick={(e: MouseEvent<HTMLElement>) => e.stopPropagation()}><IosShareIcon /></IconButton>
                    </CSVLink>
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton onClick={handleDelete(contact.id || "")}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          style={{ color: 'white',  }}
          component="div"
          count={contacts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <AddContact open={adding} onClose={handleAdding(false)} />
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Contacts);
