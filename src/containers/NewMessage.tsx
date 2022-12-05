// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useRef, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { Button, Paper, TextField, Typography } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Message } from 'microsoft-graph';

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
    margin: theme.spacing(2, 1),
  },
  input: {
    margin: theme.spacing(1, 0),
  }
});

type MessagesProps = {
  classes: any,
}

function NewMessage({ classes }: MessagesProps) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const [toRecipients, setToRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
  }

  const handleSend = (send: boolean) => () => {
    const message: Message = {
      subject,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      toRecipients: toRecipients.split(',').map(address => ({
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

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
      <Typography variant="h4">New Message</Typography>
        <div>
          <Button
            onClick={handleSend(false)}
            variant='contained'
            color="primary"
          >
            Save
          </Button>
          <Button
            className={classes.button}
            onClick={handleSend(true)}
            variant='contained'
            color="primary"
          >
            Send
          </Button>
        </div>
        <div className={classes.content}>
          <Paper className={classes.tinyMceContainer}>
            <TextField
              className={classes.input}
              label="Subject"
              onChange={handleInput('setSubject')}
              value={subject}
              fullWidth
            />
            <TextField
              className={classes.input}
              label="Recipients"
              onChange={handleInput('setToRecipients')}
              value={toRecipients}
              fullWidth
            />
            <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={''}
              init={{
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </Paper>
        </div>
      </div>
    </AuthenticatedTemplate>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(NewMessage);
