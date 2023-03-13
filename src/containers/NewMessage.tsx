// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { Button, IconButton, Paper, TextField } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ImportContacts } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setGABOpen } from '../actions/gab';
import { useTypeSelector } from '../store';
import AuthenticatedView from '../components/AuthenticatedView';

const styles: any = (theme: any) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: theme.spacing(2),
  },
  content: {
    flex: 1,
    display: 'flex',
  },
  centerRow: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  },
  mailList: {
    width: 400,
    height: '100%',
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
  }
});

type MessagesProps = {
  classes: any,
  setDrawerElements: (arg1: Array<JSX.Element>) => void,
}

function NewMessage({ classes, setDrawerElements }: MessagesProps) {
  const app = useAppContext();
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation();
  const editorRef = useRef<any>(null);
  const selectedGABReceipients = useTypeSelector(state => state.gab.seletion);
  const [toRecipients, setToRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
  }

  // componentDidMount()
  useEffect(() => {
    setDrawerElements([]);
  }, [])

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
    }
    postMessage(app.authProvider!, message, send);
  }

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    stateFuncs[stateFunc]((e.target as HTMLInputElement).value);
  }

  const handleGAB = () => {
    dispatch(setGABOpen(true));
  }

  useEffect(() => {
    setToRecipients(toRecipients + (toRecipients && ",") +
      selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(','));
  }, [selectedGABReceipients])

  return (
    <AuthenticatedView
      header={t("New message")}
      actions={[
        <Button
          onClick={handleSend(false)}
          variant='contained'
          color="primary"
        >
          {t("Save")}
        </Button>,
        <Button
          className={classes.button}
          onClick={handleSend(true)}
          variant='contained'
          color="primary"
        >
          {t("Send")}
        </Button>
      ]}
    >
      <div className={classes.content}>
        <Paper className={classes.tinyMceContainer}>
          <TextField
            className={classes.input}
            label={t("Subject")}
            onChange={handleInput('setSubject')}
            value={subject}
            fullWidth
          />
          <div className={classes.flexRow}>
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
          </div>
          <Editor
            tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={location.state?.body?.content || ''}
            init={{
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
        </Paper>
      </div>
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(NewMessage);
