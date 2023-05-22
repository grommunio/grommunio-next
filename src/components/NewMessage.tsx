// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { Button, IconButton, Paper, TextField } from '@mui/material';
<<<<<<< HEAD
import withTinyMCE from './hocs/withTinyMCE';
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
<<<<<<< HEAD
import { Delete, ImportContacts, StarBorderOutlined, StarOutlined } from '@mui/icons-material';
=======
import { Delete, ImportContacts } from '@mui/icons-material';
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
import { useDispatch } from 'react-redux';
import { setGABOpen } from '../actions/gab';
import { useTypeSelector } from '../store';

const styles: any = (theme: any) => ({
  content: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
  },
  tinyMceContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
  button: {
    margin: theme.spacing(0, 1),
  },
  input: {
    margin: theme.spacing(1, 0),
  },
  flexRow: {
    display: 'flex',
  },
  actions: {
    display: 'flex',
    marginBottom: 16,
    padding: 9,
  },
  iconButtonRow: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

type MessagesProps = {
  classes: any,
  handleTabLabelChange: (label: string) => void,
  handleDraftClose: () => void,
  initialState?: Message,
}

function NewMessage({ classes, handleTabLabelChange, handleDraftClose, initialState }: MessagesProps) {
  const app = useAppContext();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const editorRef = useRef<any>(null);
  const selectedGABReceipients = useTypeSelector(state => state.gab.seletion);
<<<<<<< HEAD
  const [importance, setImportance] = useState(false);
  const [ccRecipients, setCCRecipients] = useState(initialState?.ccRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [bccRecipients, setBCCRecipients] = useState(initialState?.bccRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [subject, setSubject] = useState(initialState?.subject || "");
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
<<<<<<< HEAD
    'setBCCRecipients': setBCCRecipients,
    'setCCRecipients': setCCRecipients
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
  }

  const handleSend = (send: boolean) => () => {
    const message: Message = {
      subject,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      toRecipients: toRecipients.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })),
<<<<<<< HEAD
      ccRecipients: ccRecipients.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })),
      bccRecipients: bccRecipients.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })),
      importance: importance ? 'high' : 'normal',
    };
    postMessage(app.authProvider!, message, send)
      .then(handleDraftClose);
  };
=======
    }
    postMessage(app.authProvider!, message, send)
      .then(handleDraftClose);
  }
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    stateFuncs[stateFunc]((e.target as HTMLInputElement).value);
  }

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setSubject(value);
    handleTabLabelChange(value);
  }
<<<<<<< HEAD
  
  const toggleImportance = () => {
    setImportance(!importance);
  };
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15

  const handleGAB = () => {
    dispatch(setGABOpen(true));
  }

  useEffect(() => {
<<<<<<< HEAD
    if (selectedGABReceipients.length > 0) {
      const selectedEmails = selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(',');
  
      setToRecipients((prevToRecipients) => {
        const existingToRecipients = prevToRecipients.split(',').filter((address: string) => address.trim() !== '');
        return existingToRecipients.concat(selectedEmails).join(',');
      });
  
      setCCRecipients((prevCCRecipients) => {
        const existingCCRecipients = prevCCRecipients.split(',').filter((address: string) => address.trim() !== '');
        return existingCCRecipients.concat(selectedEmails).join(',');
      });
  
      setBCCRecipients((prevBCCRecipients) => {
        const existingBCCRecipients = prevBCCRecipients.split(',').filter((address: string) => address.trim() !== '');
        return existingBCCRecipients.concat(selectedEmails).join(',');
      });
    }
  }, [selectedGABReceipients]);
  
=======
    if(selectedGABReceipients.length > 0) setToRecipients(toRecipients + (toRecipients && ",") +
      selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(','));
  }, [selectedGABReceipients]);
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15

  return (
    <div className={classes.content}>
      <Paper className={classes.actions}>
        <Button
          onClick={handleSend(false)}
          variant='contained'
          color="primary"
        >
          {t("Save")}
        </Button>
        <Button
          className={classes.button}
          onClick={handleSend(true)}
          variant='contained'
          color="primary"
        >
          {t("Send")}
        </Button>
        <div className={classes.iconButtonRow}>
          <IconButton title={t('Discard') || ""} onClick={handleDraftClose /* TODO: Prompt confirmation dialog */}>
            <Delete />
          </IconButton>
        </div>
      </Paper>
      <Paper className={classes.tinyMceContainer}>
        <div className={classes.flexRow}>
<<<<<<< HEAD
          <IconButton onClick={toggleImportance}>
            {importance ? <StarOutlined /> : <StarBorderOutlined />}
          </IconButton>
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
          <IconButton onClick={handleGAB}>
            <ImportContacts />
          </IconButton>
          <TextField
            className={classes.input}
            label={t("Recipients")}
            onChange={handleInput('setToRecipients')}
            value={toRecipients}
            fullWidth
          />
<<<<<<< HEAD
          <TextField
            className={classes.input}
            label={t("CC")}
            onChange={handleInput('setCCRecipients')}
            value={ccRecipients}
            fullWidth
          />
          <TextField
            className={classes.input}
            label={t("BCC")}
            onChange={handleInput('setBCCRecipients')}
            value={bccRecipients}
            fullWidth
          />
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
        </div>
        <TextField
          className={classes.input}
          label={t("Subject")}
          onChange={handleSubject}
          value={subject}
          fullWidth
        />
        <Editor
          tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={initialState?.body?.content || ''}
          init={{
            id: 'tinyMCE-editor',
            language: i18n.language,
<<<<<<< HEAD
            skin: "oxide-dark",
            content_css: "dark",
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </Paper>
    </div>
  );
}

<<<<<<< HEAD
withTinyMCE(NewMessage)
=======

>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
export default withStyles(styles)(NewMessage);
