// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import AuthenticatedView from '../components/AuthenticatedView';
import { getStringAfterLastSlash } from '../utils';
import ContactForm from '../components/ContactForm';
import { getContact, patchContact } from '../api/contacts';
import { Contact as ContactType } from 'microsoft-graph';
import { Button, Typography } from '@mui/material';

const styles: any = {
  root: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  },
  centerRow: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  },
  formContainer: {
    margin: 8,
  }
};

function Contact({ classes }: any) {
  const app = useAppContext();
  const [contact, setContact] = useState<ContactType>({});

  const fetchContact = async () => {
    const contact = await getContact(app.authProvider!, getStringAfterLastSlash());
    return contact;
  }

  useEffect(() => {
    fetchContact().then(setContact);
  }, [app.authProvider]);

  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact({
      ...contact,
      [field]: e.target.value,
    })
  };

  const handleSave = async () => {
    await patchContact(app.authProvider!, {
      ...contact,
    });
  }

  const handleNestedChange = (field: string, nested: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact({
      ...contact,
      [field]:  {
        ...(contact[field as keyof ContactType] as Record<string, unknown>),
        [nested]: e.target.value,
      }
    })
  };

  return (
    <AuthenticatedView rootClass={classes.root}>
      <Typography variant="h4">Contact</Typography>
      <div className={classes.formContainer}>
        <ContactForm contact={contact} handleChange={handleChange} handleNestedChange={handleNestedChange}/>
      </div>
      <Button variant='contained' onClick={handleSave}>Save</Button>
    </AuthenticatedView>
  );
}


export default withStyles(styles)(Contact);
