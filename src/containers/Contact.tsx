// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useState } from 'react';
import { withStyles } from '@mui/styles';
import AuthenticatedView from '../components/AuthenticatedView';
import { getStringAfterLastSlash } from '../utils';
import ContactForm from '../components/ContactForm';
import { getContact, patchContact } from '../api/contacts';
import { Contact as ContactType } from 'microsoft-graph';
import { Button } from '@mui/material';
import { withTranslation } from 'react-i18next';

const styles: any = {

};

function Contact({ classes, t }: any) {
  const [contact, setContact] = useState<ContactType>({});

  const fetchContact = async () => {
    const contact = await getContact(getStringAfterLastSlash());
    return contact;
  }

  useEffect(() => {
    fetchContact().then(setContact);
  }, []);

  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setContact({
      ...contact,
      [field]: e.target.value,
    })
  };

  const handleSave = async () => {
    await patchContact(contact);
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
    <AuthenticatedView
      header={t("Contact")}
    >
      <div className={classes.formContainer}>
        <ContactForm contact={contact} handleChange={handleChange} handleNestedChange={handleNestedChange}/>
      </div>
      <Button variant='contained' onClick={handleSave}>Save</Button>
    </AuthenticatedView>
  );
}


export default withTranslation()(withStyles(styles)(Contact));
