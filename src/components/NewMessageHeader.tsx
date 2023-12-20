import { Button, IconButton, Menu, MenuItem, TextField } from "@mui/material";
import GAB from "./dialogs/GAB";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ArrowDownward, Delete, PriorityHigh } from "@mui/icons-material";
import { withStyles } from "@mui/styles";
import { withTranslation } from "react-i18next";
import { useTypeDispatch, useTypeSelector } from "../store";
import { Contact, Importance, Message, NullableOption, Recipient } from "microsoft-graph";
import { GabSelections } from "../types/misc";
import { fetchContactsData } from "../actions/contacts";
import { throttle } from "lodash";
import { gabSelectionToRequestFormat } from "../utils";
import AttendeeAutocomplete from "./AttendeeAutocomplete";


const styles: any = (theme: any) => ({
  input: {
    margin: "4px 0px",
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  ccButton: {
    minWidth: 40,
  },
  button: {
    margin: theme.spacing(0, 1),
  },
  buttonRow: {
    display: 'flex',
    marginBottom: 4,
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
  arrowButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 4,
    minWidth: 24
  }
});

// TODO: Create proper type
const NewMessageHeader = ({ classes, t, initialState, handleNewMessage, handleTabLabelChange,
  submit, handleDraftClose }: any) => {
  const dispatch = useTypeDispatch();
  const { contacts } = useTypeSelector(state => state.contacts);
  const [gabOpen, setGabOpen] = useState<string>("");
  const [ccVisible, setCcVisible] = useState<boolean>(Boolean(initialState?.ccRecipients?.length));
  const [bccVisible, setBccVisible] = useState<boolean>(false);
  const [selectedContacts, setSelectedContacts] = useState<GabSelections>({
    toRecipients: [],
    ccRecipients: [],
    bccRecipients: [],
  });
  const { toRecipients, ccRecipients, bccRecipients } = selectedContacts;

  const [subject, setSubject] = useState(initialState?.subject || "");
  const [messageImportance, setMessageImportance] = useState<Importance>("normal");
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchContactsData());
  }, [])

  const handleGAB = (recipType: string) => () => {
    setGabOpen(recipType)
  }

  const handleAutocomplete = (type: string) => (_e: any, newVal: Array<(string | Contact)>) => {
    setSelectedContacts(currentState => ({
      ...currentState,
      [type]: newVal
    }));
  }

  const handleGABSelection = (selection: Array<Contact>) => {
    setSelectedContacts({
      ...selectedContacts,
      [gabOpen]: selection,
    });
  }

  const handleContactRemove = (type: keyof GabSelections) =>(index: number) => () => {
    const copy = [...selectedContacts[type]];
    copy.splice(index, 1);
    setSelectedContacts({
      ...selectedContacts,
      [type]: copy,
    });
  }

  interface IExtraProps {
    ccRecipients?: NullableOption<Recipient[]>;
    bccRecipients?: NullableOption<Recipient[]>;
  }

  const handleSend = (send: boolean) => () => {
    const extraProps: IExtraProps = {}

    if (ccRecipients.length > 0) {
      extraProps["ccRecipients"] = gabSelectionToRequestFormat(ccRecipients)
    }
    if (bccRecipients.length > 0) {
      extraProps["bccRecipients"] = gabSelectionToRequestFormat(bccRecipients)
    }

    const message: Message = {
      subject,
      toRecipients: gabSelectionToRequestFormat(toRecipients),
      importance: messageImportance,
      ...extraProps,
    }
    submit(message, send);
  }

  const debouncedTabLabelChange = throttle((value) => {
    handleTabLabelChange(value);
  }, 500)

  const handleSubject = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { value } = (e.target as HTMLInputElement);
    setSubject(value);
    debouncedTabLabelChange(value);
  }, []);
  
  const handleSendMenu = (open: boolean) => (event: React.MouseEvent<HTMLButtonElement>) => {
    setSendMenuAnchor(open ? event.currentTarget : null);
  };

  return <>
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
          <PriorityHigh color='error' />
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
      <AttendeeAutocomplete
        value={toRecipients}
        onChange={handleAutocomplete('toRecipients')}
        options={contacts}
        handleContactRemove={handleContactRemove('toRecipients')}
        renderInput={(params: any) => (
          <TextField
            {...params}
            className={classes.input}
            autoFocus
            InputProps={{
              ...params.InputProps,
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
        )}
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
      <AttendeeAutocomplete
        value={ccRecipients}
        onChange={handleAutocomplete('ccRecipients')}
        options={contacts}
        handleContactRemove={handleContactRemove("ccRecipients")}
      />
    </div>}
    {bccVisible && <div className={classes.flexRow}>
      <Button
        variant='outlined'
        onClick={handleGAB("bccRecipients")}
        sx={{ mr: 2 }}
      >
        {t("Cc")}
      </Button>
      <AttendeeAutocomplete
        value={bccRecipients}
        onChange={handleAutocomplete('bccRecipients')}
        options={contacts}
        handleContactRemove={handleContactRemove("bccRecipients")}
      />
    </div>}
    <GAB
      open={Boolean(gabOpen)}
      onClose={() => setGabOpen("")}
      seletedContact={selectedContacts[gabOpen as keyof GabSelections] || []}
      setSelectedContacts={handleGABSelection}
      handleNewMessage={handleNewMessage}
    />
    <TextField
      className={classes.input}
      style={{ marginBottom: 8 }}
      label={t("Subject")}
      onChange={handleSubject}
      value={subject}
      fullWidth
    />
  </> ;
}

export default withTranslation()(withStyles(styles)(NewMessageHeader));
