// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Mail } from '@mui/icons-material';
import { Avatar, Button, Divider, Grid, Paper, TextField, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { withTranslation } from 'react-i18next';
import { patchContact } from '../api/contacts';
import { useTypeDispatch } from '../store';
import { patchContactData } from '../actions/contacts';

const styles = (theme: any) => ({
  paper: {
    padding: 16,
    marginLeft: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  input: {
    margin: theme.spacing(1),
  },
  divider: {
    margin: theme.spacing(2, 0, 2, 0),
  },
  gridItem: {
    display: 'flex',
  },
  flexTextfield: {
    flex: 1,
    marginRight: 8,
  },
  grid: {
    display: 'flex',
    margin: theme.spacing(1),
    flex: 1,
  },
  propertyInput: {
    margin: theme.spacing(1),
    flex: 1,
  },
  flexRow: {
    display: 'flex',
    margin: theme.spacing(0, 0, 2, 0),
  },
});

function ContactForm({ classes, t, contact, handleChange, handleNestedChange }: any) {
  const dispatch = useTypeDispatch();

  const tfProps = (label: string, field: string, nested="") => ({
    fullWidth: true,
    onChange: nested ? handleNestedChange(field, nested) : handleChange(field),
    value: (nested && contact[field] ? contact[field][nested] : contact[field]) || '',
    label: t(label),
    className: classes.propertyInput,
  });

  const handleSave = async () => {
    await dispatch(patchContactData(contact));
  }
  
  return (
    <Paper className={classes.paper}>
      <div className={classes.header}>
        <Avatar sx={{ width: 80, height: 80, mr: 2 }}/>
        <div>
          <Typography variant="h5">{contact.displayName}</Typography>
          <Button
            onClick={() => null /* TODO: Implement send-mail link */}
            size="small"
            startIcon={<Mail />}
          >
            Send mail
          </Button>
        </div>
      </div>
      <div className={classes.flexRow}>
        <Typography variant="h6">{t('Name')}</Typography>
      </div>
      <Grid container>
        <Grid item xs={12} className={classes.gridItem}>
          <div className={classes.grid}>
            <TextField 
              {...tfProps("First name", "givenName")}
              className={classes.flexTextfield}
              fullWidth={false}
            />
            <TextField 
              {...tfProps("Initials", "initials")}
              className={undefined}
              fullWidth={false}
            />
          </div>
          <TextField
            {...tfProps("Surname", "surname")}
          />
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <TextField 
            {...tfProps("Display name", "displayName")}
          />
          <TextField
            {...tfProps("Nickname", "nickName")}
          />
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container>
        <Grid item xs={6} style={{ display: 'flex' }}>
          <TextField 
            {...tfProps("Address", "businessAddress", "street")}
            fullWidth={false}
            multiline
            rows={3}
            inputProps={{
              style: {
                height: 95,
              },
            }}
          />
        </Grid>
        <Grid item xs={6} style={{ paddingRight: 16 }}>
          <TextField
            {...tfProps("Position", "jobTitle")}
            className={classes.input}
          />
          <TextField
            {...tfProps("Company", "companyName")}
            className={classes.input}
          />
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12} className={classes.gridItem}>
          <TextField
            {...tfProps("Department", "department")}
          />
          <TextField
            {...tfProps("Office", "officeLocation")}
          />
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <TextField
            {...tfProps("Postal Code", "businessAddress", "postalCode")}
          />
          <TextField
            {...tfProps("Assistant", "assistantName")}
          />
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <TextField
            {...tfProps("Mobile", 'mobilePhone')}
          />
        </Grid>
      </Grid>
      <Divider className={classes.divider}/>
      <Grid item xs={12} className={classes.gridItem}>
        <TextField
          {...tfProps("Comment", 'personalNotes')}
          multiline
          rows={4}
        />
      </Grid>
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: 8 }}>
        <Button variant='contained' onClick={handleSave}>Save</Button>
      </div>
    </Paper>
  );
}


export default withTranslation()(withStyles(styles)(ContactForm));