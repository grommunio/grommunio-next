// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { Button, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, TextField } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Importance, Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import { Delete, ImportContacts } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setGABOpen } from '../actions/gab';
import { useTypeSelector } from '../store';
import { grey } from '@mui/material/colors';

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
  messageCopy: {
    display: "flex",
    alignItems: "center",
    alignSelf: "center",
    padding: 7,
    height: 35,
    marginLeft: "0.5%",
    marginRight: "0.5%",
    "&:hover": {
      backgroundColor: grey.A200,
      color: "#ffffff",
      cursor: "pointer",
    },
  }
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
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [toBcc, setToBcc] = useState(
    initialState?.bccRecipients
      ?.map((recip) => recip.emailAddress?.address || "")
      .join(",") || ""
  );
  const [toCc, setToCc] = useState(
    initialState?.ccRecipients
      ?.map((recip) => recip.emailAddress?.address || "")
      .join(",") || ""
  );
  const [subject, setSubject] = useState(initialState?.subject || "");
  const [toggleCc, setToggleCc] = useState(false);
  const [toggleBcc, setToggleBcc] = useState(false);
  const [importance, setImportance] = useState<Importance>("normal");
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
    'setToBcc': setToBcc,
    'setToCc': setToCc,
  }

  const handleSend = (send: boolean) => () => {
    const message: Message = {
      subject,
      importance: importance,
      body: {
        contentType: 'html',
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      toRecipients: toRecipients.split(',').map((address: string) => ({
        emailAddress: {
          address,
        },
      })),
      bccRecipients:
      toBcc.length > 0
        ? toBcc.split(",").map((address: string) => ({
          emailAddress: {
            address,
          },
        }))
        : undefined,
    ccRecipients:
      toCc.length > 0
        ? toCc.split(",").map((address: string) => ({
          emailAddress: {
            address,
          },
        }))
        : undefined
    }
    postMessage(app.authProvider!, message, send)
      .then(handleDraftClose);
  }

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    stateFuncs[stateFunc]((e.target as HTMLInputElement).value);
  }

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setSubject(value);
    handleTabLabelChange(value);
  }

  const handleGAB = () => {
    dispatch(setGABOpen(true));
  }

  const handleToggleCc = () => {
    setToggleCc(!toggleCc);
  };

  const handleToggleBcc = () => {
    setToggleBcc(!toggleBcc);
  };
  const handleChange = (event: any) => {
    setImportance(event.target.value);
  };

  useEffect(() => {
    if(selectedGABReceipients.length > 0) setToRecipients(toRecipients + (toRecipients && ",") +
      selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(','));
  }, [selectedGABReceipients]);

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
           <div className={classes.messageCopy} onClick={handleToggleCc}>
            Cc
          </div>
          <div className={classes.messageCopy} onClick={handleToggleBcc}>
            Bcc
          </div>
        </div>
        <TextField
          className={classes.input}
          label={t("Subject")}
          onChange={handleSubject}
          value={subject}
          fullWidth
        />
         <div className={classes.flexRow}>
          <TextField
            className={classes.input}
            label={t("Subject")}
            onChange={handleSubject}
            value={subject}
            fullWidth
          />
          <FormControl sx={{ m: 1, minWidth: 80 }}>
            <InputLabel id="demo-simple-select-autowidth-label">
              importance
            </InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={importance}
              onChange={handleChange}
              autoWidth
              label="importance"
            >
              <MenuItem value={"high"}>high</MenuItem>
              <MenuItem value={"low"}>low</MenuItem>
              <MenuItem value={"normal"}>normal</MenuItem>
            </Select>
          </FormControl>
        </div>
        {toggleCc && (
          <TextField
            className={classes.input}
            value={toCc}
            onChange={handleInput("setToCc")}
            label={t("Cc")}
            fullWidth
          />
        )}
        {toggleBcc && (
          <TextField
            className={classes.input}
            value={toBcc}
            onChange={handleInput("setToBcc")}
            label={t("Bcc")}
            fullWidth
          />
        )}
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
    </div>
  );
}


export default withStyles(styles)(NewMessage);
