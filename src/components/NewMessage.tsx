// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { ChangeEvent, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Button, Chip, IconButton, Paper, TextField } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message, Importance, NullableOption, Recipient } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { Delete, ImportContacts } from '@mui/icons-material';
import GAB from './dialogs/GAB';

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
  ccButton: {
    minWidth: 40,
  }
});

type MessagesProps = {
  classes: any,
  handleTabLabelChange: (label: string) => void,
  handleDraftClose: () => void,
  initialState?: Message,
}

function NewMessage({ classes, handleTabLabelChange, handleDraftClose, initialState }: MessagesProps) {
  const { t, i18n } = useTranslation();
  const editorRef = useRef<any>(null);
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [ccRecipients, setCcRecipients] = useState("");
  const [bccRecipients, setBccRecipients] = useState("");
  const [subject, setSubject] = useState(initialState?.subject || "");
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
  const [messageImportance, setMessageImportance] = useState<Importance>("normal");
  const [gabOpen, setGabOpen] = useState<boolean>(false);
  const [selectedContacts, setSelectedContacts] = useState<Array<Contact>>([]);
  // TODO: This solution was a stupid idea. Rewrite the state handlers
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
    'setCcRecipients': setCcRecipients,
    'setBccRecipients': setBccRecipients,
  }

  const recipientsToValidRecipientFormat = (emails: string, contacts: Array<Contact>):  NullableOption<Recipient[]> => {
    let res: Recipient[] = [];
    if (emails) {
      res = res.concat(emails.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })));
    }
    if(contacts.length > 0) {
      res = res.concat(contacts.filter(c => c.emailAddresses?.length! > 0).map((c: Contact) => ({
        emailAddress: {
          // TODO: Which email to select?
          address: c.emailAddresses![0].address,
        },
      })));
    }
    return res.length > 0 ? res : null;
  }

  interface IExtraProps {
    ccRecipients?: NullableOption<Recipient[]>;
    bccRecipients?: NullableOption<Recipient[]>;
  }

  const handleSend = (send: boolean) => () => {
    const extraProps: IExtraProps = {}

    if (ccRecipients) {
      extraProps["ccRecipients"] = recipientsToValidRecipientFormat(ccRecipients, [])
    }
    if (bccRecipients) {
      extraProps["bccRecipients"] = recipientsToValidRecipientFormat(bccRecipients, [])
    }

    const message: Message = {
      subject,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      toRecipients: recipientsToValidRecipientFormat(toRecipients, selectedContacts),
      importance: messageImportance,
      ...extraProps,
    }
    postMessage(message, send)
      .then(handleDraftClose);
  }

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    stateFuncs[stateFunc]((e.target as HTMLInputElement).value);
  }

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = (e.target as HTMLInputElement);
    setSubject(value);
    handleTabLabelChange(value);
  }

  const handleGAB = (bool: boolean) => () => {
    setGabOpen(bool)
  }

  const handleContactRemove = (contact: Contact) => () =>
    setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));

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
          <IconButton title={t('High Importance') || ""} onClick={() => setMessageImportance("high")}>
            <PriorityHighIcon color='error' />
          </IconButton>
        </div>
      </Paper>
      <Paper className={classes.tinyMceContainer}>
        <div className={classes.flexRow}>
          <IconButton onClick={handleGAB(true)}>
            <ImportContacts />
          </IconButton>
          <TextField
            className={classes.input}
            label={t("Recipients")}
            onChange={handleInput('setToRecipients')}
            value={toRecipients}
            fullWidth
            InputProps={{
              startAdornment: selectedContacts.length > 0 && <div className={classes.flexRow}>
                {selectedContacts.map((c, key) =>
                  <Chip
                    sx={{ mr: 0.5 }}
                    key={key}
                    label={c.displayName}
                    onDelete={handleContactRemove(c)}
                  />
                )}
              </div>,
              endAdornment: <div className={classes.flexRow}>
                <Button
                  className={classes.ccButton}
                  onClick={() => setCcVisible(!ccVisible)}
                  size='small'
                  color={ccVisible ? 'primary' : 'secondary'}
                >
                  CC
                </Button>
                <Button
                  className={classes.ccButton}
                  onClick={() => setBccVisible(!bccVisible)}
                  size='small'
                  color={bccVisible ? 'primary' : 'secondary'}
                >
                  BCC
                </Button>
              </div>
            }}
          />
        </div>
        {ccVisible && <div className={classes.flexRow}>
          <IconButton onClick={handleGAB(true)}>
            <ImportContacts />
          </IconButton>
          <TextField
            className={classes.input}
            label={t("Cc")}
            onChange={handleInput('setCcRecipients')}
            value={ccRecipients}
            fullWidth
          />
        </div>}
        {bccVisible && <div className={classes.flexRow}>
          <IconButton onClick={handleGAB(true)}>
            <ImportContacts />
          </IconButton>
          <TextField
            className={classes.input}
            label={t("Bcc")}
            onChange={handleInput('setBccRecipients')}
            value={bccRecipients}
            fullWidth
          />
        </div>}
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
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </Paper>
      <GAB
        open={gabOpen}
        setOpen={setGabOpen}
        seletedContact={selectedContacts}
        setSelectedContacts={setSelectedContacts}
      />
    </div>
  );
}


export default withStyles(styles)(NewMessage);
