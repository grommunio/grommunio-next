// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent, TextField,
  Button, DialogActions, Grid,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Contact } from 'microsoft-graph';
import { postContactData } from '../../actions/contacts';
import { useTypeDispatch } from '../../store';

const styles = (theme: any) => ({
  grid: {
    display: 'flex',
    margin: theme.spacing(1),
    flex: 1,
  },
  input: {
    marginBottom: theme.spacing(3),
  },
  gridItem: {
    display: 'flex',
  },
  propertyInput: {
    margin: theme.spacing(1),
    flex: 1,
  },
  flexTextfield: {
    flex: 1,
    marginRight: 8,
  },
});

function AddContact(props: any) {
  const { classes, t, open, onClose } = props;
  const dispatch = useTypeDispatch();
  const [ contact, setContact ] = useState<Contact>({})
  const [ emails, setEmails ] = useState<string>('');
  const { displayName, givenName, initials, surname, nickName } = contact;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const inputName = e.target.name;
    setContact((prevState: any)=> {
      return({
        ...prevState,
        [inputName]: newValue,
      });
    });
  }

  // TODO: Add input mask for multiple email addresses
  const handleEmails = (e: ChangeEvent<HTMLInputElement>) => setEmails(e.target.value);

  const handleAdd = () => {
    const mergedContact: Contact = {
      ...contact,
      emailAddresses: [
        {
          name: displayName,
          address: emails,
        }
      ]
    }
    dispatch(postContactData(mergedContact))
      .then((resp: Contact) => resp.id ? onClose() : null); // TODO: Update table view after successful add. (Maybe create action?)
  }
  
  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{t('addHeadline', { item: 'Contact' })}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="emailAddresses"
              className={classes.propertyInput}
              fullWidth
              label={t("E-Mail Address")}
              value={emails || ''}
              onChange={handleEmails}
              autoFocus
            />
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <div className={classes.grid}>
              <TextField
                name="givenName"
                className={classes.flexTextfield}
                label={t("First name")}
                value={givenName || ''}
                onChange={handleChange}
              />
              <TextField 
                name="initials"
                label={t("Initials")}
                value={initials || ''}
                onChange={handleChange}
              />
            </div>
            <TextField
              name="surname"
              className={classes.propertyInput} 
              label={t("Surname")} 
              fullWidth 
              value={surname || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="displayName"
              className={classes.propertyInput}
              label={t("Display name")}
              fullWidth
              value={displayName || ''}
              onChange={handleChange}
            />
            <TextField
              name="nickName"
              className={classes.propertyInput} 
              label={t("Nickname")} 
              fullWidth 
              value={nickName || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
        >
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          color="primary"
        >
          {t('Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default withTranslation()(withStyles(styles)(AddContact));
