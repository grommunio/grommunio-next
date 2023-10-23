// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { ChangeEvent, MouseEvent, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Button, Chip, IconButton, Menu, MenuItem, Paper, TextField } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message, Importance, NullableOption, Recipient } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { ArrowDownward, ContactMail, Delete } from '@mui/icons-material';
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
    margin: "4px 0px",
  },
  buttonRow: {
    display: 'flex',
    marginBottom: 4,
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
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
  },
  arrowButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 4,
    minWidth: 24
  }
});

type MessagesProps = {
  classes: any;
  handleTabLabelChange: (label: string) => void;
  handleDraftClose: () => void;
  initialState?: any;
  handleNewMessage: (a1?: any, a2?: any) => (e: MouseEvent<HTMLElement>) => void;
}

type GabSelections = {
  toRecipients: Array<Contact>;
  ccRecipients: Array<Contact>;
  bccRecipients: Array<Contact>;
}

const ContactChip = (props: any) => (
  <Chip
    sx={{ mr: 0.5 }}
    icon={<ContactMail fontSize='small'/>}
    {...props}
  />
);

function NewMessage({ classes, handleTabLabelChange, handleNewMessage, handleDraftClose, initialState }: MessagesProps) {
  const { t, i18n } = useTranslation();
  const editorRef = useRef<any>(null);
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients || "");
  const [ccRecipients, setCcRecipients] = useState("");
  const [bccRecipients, setBccRecipients] = useState("");
  const [subject, setSubject] = useState(initialState?.subject || "");
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
  const [messageImportance, setMessageImportance] = useState<Importance>("normal");
  const [gabOpen, setGabOpen] = useState<string>("");
  const [selectedContacts, setSelectedContacts] = useState<GabSelections>({
    "toRecipients": [],
    "ccRecipients": [],
    "bccRecipients": [],
  });
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);

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
      extraProps["ccRecipients"] = recipientsToValidRecipientFormat(ccRecipients, selectedContacts.ccRecipients)
    }
    if (bccRecipients) {
      extraProps["bccRecipients"] = recipientsToValidRecipientFormat(bccRecipients, selectedContacts.bccRecipients)
    }

    const message: Message = {
      subject,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      toRecipients: recipientsToValidRecipientFormat(toRecipients, selectedContacts.toRecipients),
      importance: messageImportance,
      ...extraProps,
    }
    postMessage(message, send)
      .then(handleDraftClose);
  }

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = (e.target as HTMLInputElement);
    setSubject(value);
    handleTabLabelChange(value);
  }

  const handleGAB = (recipType: string) => () => {
    setGabOpen(recipType)
  }

  const handleContactRemove = (contact: Contact, recipType: string) => () =>
    setSelectedContacts({
      ...selectedContacts,
      [recipType]: selectedContacts[recipType as keyof GabSelections].filter(c => c.id !== contact.id)
    });

  const handleGABSelection = (selection: Array<Contact>) => {
    setSelectedContacts({
      ...selectedContacts,
      [gabOpen]: selection,
    });
  }

  const handleSendMenu = (open: boolean) => (event: React.MouseEvent<HTMLButtonElement>) => {
    setSendMenuAnchor(open ? event.currentTarget : null);
  };

  return (
    <div className={classes.content}>
      <Paper className={classes.tinyMceContainer}>
        <div className={classes.buttonRow}>
          <Button
            onClick={handleSend(true)}
            variant='contained'
            color="primary"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, }}
          >
            {t("Send")}
          </Button>
          <Button
            onClick={handleSendMenu(true)}
            variant='contained'
            className={classes.arrowButton}
          >
            <ArrowDownward fontSize='small' />
          </Button>
          <Menu
            anchorEl={sendMenuAnchor}
            open={Boolean(sendMenuAnchor)}
            onClose={handleSendMenu(false)}
          >
            <MenuItem onClick={handleSend(false)}>{t("Save")}</MenuItem>
            <MenuItem onClick={handleSend(true)}>{t("Send")}</MenuItem>
          </Menu>
          <div className={classes.iconButtonRow}>
            <IconButton title={t('Discard') || ""} onClick={handleDraftClose /* TODO: Prompt confirmation dialog */}>
              <Delete />
            </IconButton>
            <IconButton title={t('High Importance') || ""} onClick={() => setMessageImportance("high")}>
              <PriorityHighIcon color='error' />
            </IconButton>
          </div>
        </div>
        <div className={classes.flexRow}>
          <Button
            variant='outlined'
            onClick={handleGAB("toRecipients")}
            sx={{ mr: 2 }}
          >
            {t("To")}
          </Button>
          <TextField
            className={classes.input}
            onChange={e => setToRecipients(e.target.value)}
            value={toRecipients}
            fullWidth
            InputProps={{
              startAdornment: <div className={classes.flexRow}>
                {selectedContacts.toRecipients.length > 0 && selectedContacts.toRecipients.map((c, key) =>
                  <ContactChip
                    key={key}
                    label={c.displayName}
                    onDelete={handleContactRemove(c, "toRecipients")}
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
                  Cc
                </Button>
                <Button
                  className={classes.ccButton}
                  onClick={() => setBccVisible(!bccVisible)}
                  size='small'
                  color={bccVisible ? 'primary' : 'secondary'}
                >
                  Bcc
                </Button>
              </div>
            }}
          />
        </div>
        {ccVisible && <div className={classes.flexRow}>
          <Button
            variant='outlined'
            onClick={handleGAB("ccRecipients")}
            sx={{ mr: 2 }}
          >
            {t("Cc")}
          </Button>
          <TextField
            className={classes.input}
            onChange={e => setCcRecipients(e.target.value)}
            value={ccRecipients}
            fullWidth
            InputProps={{
              startAdornment: <div className={classes.flexRow}>
                {selectedContacts.ccRecipients.length > 0 && selectedContacts.ccRecipients.map((c, key) =>
                  <ContactChip
                    key={key}
                    label={c.displayName}
                    onDelete={handleContactRemove(c, "ccRecipients")}
                  />
                )}
              </div>
            }}
          />
        </div>}
        {bccVisible && <div className={classes.flexRow}>
          <Button
            variant='outlined'
            onClick={handleGAB("bccRecipients")}
            sx={{ mr: 2 }}
          >
            {t("Bcc")}
          </Button>
          <TextField
            className={classes.input}
            onChange={e => setBccRecipients(e.target.value)}
            value={bccRecipients}
            fullWidth
            InputProps={{
              startAdornment: <div className={classes.flexRow}>
                {selectedContacts.bccRecipients.length > 0 && selectedContacts.bccRecipients.map((c, key) =>
                  <ContactChip
                    key={key}
                    label={c.displayName}
                    onDelete={handleContactRemove(c, "bccRecipients")}
                  />
                )}
              </div>
            }}
          />
        </div>}
        <TextField
          className={classes.input}
          style={{ marginBottom: 8 }}
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
        open={Boolean(gabOpen)}
        onClose={() => setGabOpen("")}
        seletedContact={selectedContacts[gabOpen as keyof GabSelections] || []}
        setSelectedContacts={handleGABSelection}
        handleNewMessage={handleNewMessage}
      />
    </div>
  );
}


export default withStyles(styles)(NewMessage);
