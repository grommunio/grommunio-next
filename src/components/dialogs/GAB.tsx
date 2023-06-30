// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItemText, ListItemButton, ListItemIcon, Button,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Contact } from 'microsoft-graph';
import { useTypeDispatch, useTypeSelector } from '../../store';
import { fetchContactsData } from '../../actions/contacts';
import { setGABContactsSelection, setGABOpen } from '../../actions/gab';
import { useState } from 'react';
import { AccountCircle } from '@mui/icons-material';


const styles = {
  selected: {
    backgroundColor: '#71a7ec7a !important'
  }
};

function GAB(props: any) {
  const dispatch = useTypeDispatch();
  const [selectedContacts, setSelectedContacts] = useState<Array<Contact>>([]);
  const { t, classes } = props;
  const { open } = useTypeSelector(state => state.gab);
  const { contacts } = useTypeSelector(state => state.contacts);
  
  // componentDidMount()
  const handleEnter = () => {
    dispatch(fetchContactsData());
  };

  const handleContactSelect = (contact: Contact) => () => {
    if (selectedContacts.includes(contact)) {
      setSelectedContacts(selectedContacts.filter((item) => item.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  }

  const handleClose = () => dispatch(setGABOpen(false));

  const handleConfirm = () => {
    dispatch(setGABContactsSelection(selectedContacts));
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
        <List dense>
          {contacts.map((contact: Contact, key: number) =>
            <ListItemButton
              key={key}
              onClick={handleContactSelect(contact)}
              selected={selectedContacts.findIndex(c => c.id === contact.id) !== -1}
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
