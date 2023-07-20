// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItemText, ListItemButton, ListItemIcon, Button, Typography, Chip, Divider,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Contact } from 'microsoft-graph';
import { useTypeDispatch, useTypeSelector } from '../../store';
import { fetchContactsData } from '../../actions/contacts';
import { AccountCircle } from '@mui/icons-material';
import { useEffect, useState } from 'react';


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
};

type GABProps = {
  classes: any;
  t: (a1: string) => string;
  open: boolean;
  setOpen: (a1: boolean) => void;
  seletedContact: Array<Contact>;
  setSelectedContacts: (a1: Array<Contact>) => void;
}

function GAB({ t, classes, open, setOpen, seletedContact, setSelectedContacts }: GABProps) {
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [preselection, setPreselection] = useState<Array<Contact>>([]);

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

  const handleContactSelect = (contact: Contact) => () => {
    const idx = preselection.findIndex(c => c.id === contact.id);
    if (idx !== -1) {
      const copy = [...preselection];
      copy.splice(idx, 1);
      setPreselection(copy);
    } else {
      setPreselection([...preselection, contact]);
    }
  }

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    setSelectedContacts(preselection);
    setOpen(false);
  }

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      maxWidth="lg"
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
        <List dense>
          {contacts.map((contact: Contact, key: number) =>
            <ListItemButton
              key={key}
              onClick={handleContactSelect(contact)}
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
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
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
