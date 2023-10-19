// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Add, CancelOutlined, Check, Mail, MailOutlined } from '@mui/icons-material';
import { Avatar, Button, Divider, Grid, IconButton, ListItemButton, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { withTranslation } from 'react-i18next';
import { useTypeDispatch } from '../store';
import { patchContactData } from '../actions/contacts';
import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useState } from 'react';

const styles: any = (theme: any) => ({
  root: {
    flex: 1,
    display: 'flex',
  },
  paper: {
    padding: 16,
    marginLeft: 8,
    flex: 1,
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
    alignItems: 'center',
  },
  mail: {
    textTransform: 'none',
    padding: 0,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  subheader: {
    marginBottom: 8,
  },
});

function ContactForm({ classes, t, contact, handleChange, handleNestedChange, addEmail }: any) {
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<number>(0);
  const [addingEmail, setAddingEmail] = useState<boolean | string>(false);

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

  const handleNewMessage = (mailIdx: number) => () => {
    navigate('/', {
      state: { email: contact.emailAddresses?.length && contact.emailAddresses[mailIdx].address }
    });
  };
  
  const handleTab = (_: any, tab: number) => setTab(tab);

  const handleTextfield = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = (e.target as HTMLInputElement);
    setAddingEmail(value);
  }

  const handleAddEmail = () => {
    addEmail(addingEmail);
    setAddingEmail(false);
  }

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <div className={classes.header}>
          <Avatar sx={{ width: 80, height: 80, mr: 2 }}/>
          <div>
            <Typography variant="h5">{contact.displayName}</Typography>
            <Button
              onClick={handleNewMessage(0)}
              size="small"
              startIcon={<Mail />}
            >
              Send mail
            </Button>
          </div>
        </div>
        <Tabs value={tab} onChange={handleTab} className={classes.subheader}>
          <Tab className={classes.tab} label="Overview" />
          <Tab className={classes.tab} label="Contact" />
        </Tabs>
        <Divider className={classes.divider}/>
        {tab === 0 && <div className={classes.details}>
          <Typography variant="h6" className={classes.subheader}>Contact info</Typography>
          {contact.emailAddresses?.map((addr: any, idx: number) => <ListItemButton
            className={classes.flexRow}
            key={idx}
            onClick={handleNewMessage(idx)}
          >
            <MailOutlined sx={{ mr: 1 }}/>
            <div className={classes.details}>
              <Typography variant="caption">E-Mail</Typography>
              <Typography
                className={classes.mail}
                color="primary"
              >
                {addr.address}
              </Typography>
            </div>
          </ListItemButton>)}
          <div className={classes.flexRow} style={{ marginLeft: 32, marginTop: 2 }}>
            {addingEmail === false ? <Button
              onClick={() => setAddingEmail("")}
              startIcon={<Add sx={{ mr: 1 }}/>}
            >
              {t("Add E-Mail")}
            </Button> : <>
              <TextField
                label={t("E-Mail")}
                autoFocus
                variant="standard"
                size='small'
                value={addingEmail}
                onChange={handleTextfield}
              />
              <IconButton size='small' onClick={handleAddEmail}>
                <Check />
              </IconButton>
              <IconButton onClick={() => setAddingEmail(false)} size='small'>
                <CancelOutlined />
              </IconButton>
            </>}
          </div>
        </div>}
        {tab === 1 && <>
          <div className={classes.flexRow}>
            <Typography variant="h6" className={classes.subheader}>{t('Name')}</Typography>
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
        </>}
        <div className={classes.bottomRow}>

        </div>
      </Paper>
    </div>
  );
}


export default withTranslation()(withStyles(styles)(ContactForm));