// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import {
  Button,
  IconButton,
  Paper,
  TextField,
  Select,
  InputLabel,
  SelectChangeEvent,
  FormControl,
  MenuItem,
  InputAdornment,
  ButtonGroup,
  Backdrop,
  Alert,
  AlertTitle
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Contact, Message, Importance } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import { Delete, ImportContacts, Save, PriorityHigh, ArrowDownward, HighlightOffSharp } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setGABOpen } from '../actions/gab';
import { useTypeSelector } from '../store';

const styles: any = (theme: any) => ({
  content: {
    display: 'flex',
    height: '100%',
    position: 'relative',
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
    padding: 5,
  },
  iconButtonRow: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cc: {
    width: '45px',
    cursor: 'pointer',
    height: '40px',
    padding: '1px 6px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    justifyContent: 'center',
  },
  Bcc: {
    width: '45px',
    cursor: 'pointer',
    height: '40px',
    padding: '1px 6px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    justifyContent: 'center',
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
  const [toRecipients, setToRecipients] = useState(initialState?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(",") || "");
  const [ccRecipients, setCcRecipients] = useState(initialState?.ccRecipients?.map(carboncopy => carboncopy.emailAddress?.address || "").join(",") || "");
  const [bccRecipients, setBccRecipients] = useState(initialState?.bccRecipients?.map(blindcarboncopy => blindcarboncopy.emailAddress?.address || "").join(",") || "");
  const [subject, setSubject] = useState(initialState?.subject || "");
  const stateFuncs: any = {
    'setToRecipients': setToRecipients,
    'setSubject': setSubject,
    'setCcRecipients': setCcRecipients,
    'setBccRecipients': setBccRecipients
  }

  const [isCcVisible, setIsCcVisible] = useState(false);
  const [isBccVisible, setIsBccVisible] = useState(false);
  const [toFieldEmpty, setToFieldEmpty] = useState(true);
  const [bccFieldEmpty, setBccFieldEmpty] = useState(true);
  const [ccFieldEmpty, setCcFieldEmpty] = useState(true);
  const [selectedOption, setSelectedOption] = useState('');
  const [importance, setImportance] = useState<Importance>("normal");

  const handleImportance = (event: SelectChangeEvent<string>) => {
    const value = event.target.value
    setSelectedOption(value);
    if (value === 'High') {
      setImportance("high");
    } else if (value === 'Low') {
      setImportance("low");
    } else {
      setImportance("normal")
    }
  };

  const handleCcClick = () => {
    setIsCcVisible(true);
  };

  const handleBccClick = () => {
    setIsBccVisible(true);
  };

  const handleCcRemove = () => {
    setIsCcVisible(false);
  };

  const handleBccRemove = () => {
    setIsBccVisible(false);
  };

  const handleInput = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    stateFuncs[stateFunc](value);

    if (value.length > 0) {
      setToFieldEmpty(false);
    } else {
      setToFieldEmpty(true);
    }
  };

  const handleInputBcc = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    stateFuncs[stateFunc](value);

    if (value.length > 0) {
      setBccFieldEmpty(false);
    } else {
      setBccFieldEmpty(true);
    }
  };

  const handleInputCc = (stateFunc: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    stateFuncs[stateFunc](value);

    if (value.length > 0) {
      setCcFieldEmpty(false);
    } else {
      setCcFieldEmpty(true);
    }
  };

  const handleSubject = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setSubject(value);
    handleTabLabelChange(value);
  }

  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  const handleSendClick = () => {
    if (!toFieldEmpty) {
      return handleSend(true)();
    } else {
      setOpen(true);
    }
  };

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
      importance: importance,
      ...(ccFieldEmpty
        ? {}
        : {
          ccRecipients: ccRecipients.split(',').map((address: string) => ({
            emailAddress: {
              address,
            },
          })),
        }),
      ...(bccFieldEmpty
        ? {}
        : {
          bccRecipients: bccRecipients.split(',').map((address: string) => ({
            emailAddress: {
              address,
            },
          })),
        }),
    }
    postMessage(app.authProvider!, message, send)
      .then(handleDraftClose);
  }

  const handleGAB = () => {
    dispatch(setGABOpen(true));
  }

  useEffect(() => {
    if (selectedGABReceipients.length > 0) setToRecipients(toRecipients + (toRecipients && ",") +
      selectedGABReceipients.map((contact: Contact) => {
        return contact.emailAddresses ? contact.emailAddresses[0].address : ''
      }).join(','));
  }, [selectedGABReceipients]);

  return (
    <div className={classes.content}>
      <Paper className={classes.actions}>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={open}
        >
          <Alert severity="info" onClose={handleClose}>
            <AlertTitle>Error</AlertTitle>
            Please, specify at least <strong>one recipient</strong>
          </Alert>
        </Backdrop>
        <Button
          onClick={handleSend(false)}
          variant='outlined'
          color="primary"
          startIcon={<Save />}
          size='small'
        >
          {t("Save")}
        </Button>
        <Button
          className={classes.button}
          onClick={handleSendClick}
          variant='contained'
          color="primary"
          endIcon={<SendIcon />}
          size='small'
        >
          {t("Send")}
        </Button>
        <FormControl sx={{ m: 0.1, minWidth: 130 }} size="small">
          <InputLabel>Importance</InputLabel>
          <Select
            value={selectedOption}
            label="Importance"
            onChange={handleImportance}
          >
            <MenuItem value={'High'}>High</MenuItem>
            <MenuItem value={'Low'}>Low</MenuItem>
            <MenuItem value={'Normal'}>Normal</MenuItem>
          </Select>
        </FormControl>
        <div className={classes.iconButtonRow}>
          <ButtonGroup variant="text" aria-label="text button group">
            {!isCcVisible && (<Button onClick={handleCcClick} color='primary'>Cc</Button>)}
            {!isBccVisible && (<Button onClick={handleBccClick} color='primary'>Bcc</Button>)}
          </ButtonGroup>
          <IconButton title={t('Discard') || ""} onClick={handleDraftClose /* TODO: Prompt confirmation dialog */}>
            <Delete />
          </IconButton>
        </div>
      </Paper>
      <Paper className={classes.tinyMceContainer}>
        <div>
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
              size='small'
            />
          </div>
          {isCcVisible && (
            <div className={classes.flexRow}>
              <IconButton>
                <ImportContacts />
              </IconButton>
              <TextField
                className={classes.input}
                label={t("Cc")}
                onChange={handleInputCc('setCcRecipients')}
                value={ccRecipients}
                fullWidth
                size='small'
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCcRemove}>
                        <HighlightOffSharp
                          sx={{ fontSize: 20 }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
          )}
          {isBccVisible && (
            <div className={classes.flexRow}>
              <IconButton>
                <ImportContacts />
              </IconButton>
              <TextField
                className={classes.input}
                label={t("Bcc")}
                onChange={handleInputBcc('setBccRecipients')}
                value={bccRecipients}
                fullWidth
                size='small'
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleBccRemove}>
                        <HighlightOffSharp
                          sx={{ fontSize: 20 }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
          )}
          <TextField
            className={classes.input}
            label={t("Subject")}
            onChange={handleSubject}
            value={subject}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    {importance === 'high' && <PriorityHigh color='error' />}
                    {importance === 'low' && <ArrowDownward />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </div>
        <div>
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
        </div>
      </Paper>
    </div>
  );
}


export default withStyles(styles)(NewMessage);
