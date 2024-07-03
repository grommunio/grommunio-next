// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItemText, ListItemButton, ListItemIcon, Button, Typography, Chip, Divider, TextField, Grid,
  ListItem, IconButton,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Contact } from 'microsoft-graph';
import { useTypeDispatch, useTypeSelector } from '../../store';
import { fetchContactsData } from '../../actions/contacts';
import { AccountCircle, AddRounded, ContactMail } from '@mui/icons-material';
import { MouseEvent, useEffect, useState } from 'react';
import ContactDetails from '../ContactDetails';


const styles = {
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#71a7ec7a !important'
  },
  divider: {
    margin: "8px 0",
  },
  centralize: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contactIconContainer: {
    paddingBottom: 8,
    display: 'flex',
    justifyContent: 'center',
  },
};

type GABProps = {
  classes: any;
  t: (a1: string) => string;
  open: boolean;
  onClose: () => void;
  seletedContact: Array<Contact>;
  handleNewMessage: (a1?: any, a2?: any) => (e: MouseEvent<HTMLElement>) => void;
  setSelectedContacts: (a1: Array<Contact>) => void;
}

function GAB({ t, classes, open, onClose, seletedContact, handleNewMessage, setSelectedContacts }: GABProps) {
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [search, setSearch] = useState<string>("");
  const lcs = search.toLowerCase();
  const [preselection, setPreselection] = useState<Array<Contact>>([]);
  const [details, setDetails] = useState<Contact | null>(null);

  /*
  * It is possble to remove contacts in the NewMessage view (by deleting the chips).
  * This however does not update the preselection in this view.
  * To sync the states, set the preselection to NewMessage's contact selection,
  * when re-opening the GAB.
  */
  useEffect(() => {
    setPreselection(seletedContact);
  }, [open])
  
  // componentDidMount()
  const handleEnter = () => {
    dispatch(fetchContactsData());
  };

  const handleContactSelect = (contact: Contact) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const idx = preselection.findIndex(c => c.id === contact.id);
    if (idx !== -1) {
      const copy = [...preselection];
      copy.splice(idx, 1);
      setPreselection(copy);
    } else {
      setPreselection([...preselection, contact]);
    }
  }

  const handleContactDetails = (contact: Contact) => () => {
    setDetails(contact);
  }

  const handleConfirm = () => {
    setSelectedContacts(preselection);
    onClose();
  }

  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="xl"
      fullWidth
      TransitionProps={{
        onEnter: handleEnter,
      }}
    >
      <DialogTitle>{t('Global Address Book')}</DialogTitle>
      <DialogContent>
        <div className={classes.flexRow}>
          <Typography sx={{ mr: 1 }}>{t("To")}:</Typography>
          <div>
            {preselection.map((c, key) =>
              <Chip
                sx={{ mr: 0.5 }}
                key={key}
                label={c.displayName}
              />
            )}
          </div>
        </div>
        <Divider className={classes.divider}/>
        <Grid container>
          <Grid item xs={6}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              label={t("Search")}
            />
            <List dense>
              {(search ?
                contacts.filter((c: Contact) => c.displayName?.toLowerCase().includes(lcs) ||
                c.emailAddresses![0].address?.toLowerCase().includes(lcs))
                : contacts
              ).map((contact: Contact, key: number) =>
                <ListItem
                  key={key}
                  secondaryAction={<IconButton edge="end" onClick={handleContactSelect(contact)}>
                    <AddRounded />
                  </IconButton>}
                  disablePadding
                >
                  <ListItemButton
                    dense
                    role={undefined} 
                    onClick={handleContactDetails(contact)}
                    selected={preselection.findIndex(c => c.id === contact.id) !== -1}
                    classes={{ selected: classes.selected }}
                  >
                    <ListItemIcon>
                      <AccountCircle/>
                    </ListItemIcon>
                    <ListItemText
                      primary={contact.displayName}
                      secondary={contact.emailAddresses?.map(o => o.address).join(', ')}
                    />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Grid>
          <Grid item xs={6} style={{ display: 'flex' }}>
            {details ? <ContactDetails handleNewMessage={handleNewMessage} contact={details} /> :
              <div className={classes.centralize}>
                <Grid>
                  <div className={classes.contactIconContainer}>
                    <ContactMail color="primary" fontSize="inherit" style={{ fontSize: 69 /* nice */ }}/>
                  </div>
                  <Typography align='center'>Select E-Mail to read</Typography>
                  <Typography color="grey" align='center'>No selection made</Typography>
                </Grid>
              </div>
            }
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t("Cancel")}
        </Button>
        <Button variant='contained' onClick={handleConfirm}>
          {t("Confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withTranslation()(withStyles(styles)(GAB));
