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
import GABOption from "./GABOption";
import GABAutocompleteTextfield from "./GABAutocompleteTextfield";
import { gabSelectionToRequestFormat } from "../utils";


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

type Recipients = {
  toRecipients: string;
  ccRecipients: string;
  bccRecipients: string;
}

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

  const [subject, setSubject] = useState(initialState?.subject || "");
  const [messageImportance, setMessageImportance] = useState<Importance>("normal");
  const [sendMenuAnchor, setSendMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(fetchContactsData());
  }, [])

  const [recipients, setRecipients] = useState<Recipients>({
    toRecipients: "",
    ccRecipients: "",
    bccRecipients: "",
  })

  const handleGAB = (recipType: string) => () => {
    setGabOpen(recipType)
  }

  const handleRecipients = (type: string) => (_e: any, value: string) => {
    setRecipients({
      ...recipients,
      [type]: value,
    });
  }

  const handleAutocomplete = (type: string) => (e: any, newVal: Array<(string | Contact)>) => {
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

  const handleContactRemove = (id: string, recipType: string) => () =>
    setSelectedContacts({
      ...selectedContacts,
      [recipType]: selectedContacts[recipType as keyof GabSelections].filter(c => c.id !== id)
    });

  interface IExtraProps {
    ccRecipients?: NullableOption<Recipient[]>;
    bccRecipients?: NullableOption<Recipient[]>;
  }

  const handleSend = (send: boolean) => () => {
    const extraProps: IExtraProps = {}

    if (ccRecipients) {
      extraProps["ccRecipients"] = gabSelectionToRequestFormat(ccRecipients, selectedContacts.ccRecipients)
    }
    if (bccRecipients) {
      extraProps["bccRecipients"] = gabSelectionToRequestFormat(bccRecipients, selectedContacts.bccRecipients)
    }

    const message: Message = {
      subject,
      toRecipients: gabSelectionToRequestFormat(toRecipients, selectedContacts.toRecipients),
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

  const { toRecipients, ccRecipients, bccRecipients } = recipients;
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
      <GABAutocompleteTextfield
        value={selectedContacts.toRecipients}
        inputValue={toRecipients}
        onChange={handleAutocomplete('toRecipients')}
        onInputChange={handleRecipients("toRecipients")}
        options={contacts}
        handleContactRemove={handleContactRemove}
        renderInput={(params: any) => (
          <TextField
            {...params}
            className={classes.input}
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
      <GABAutocompleteTextfield
        value={selectedContacts.ccRecipients}
        inputValue={ccRecipients}
        onChange={handleAutocomplete('ccRecipients')}
        onInputChange={handleRecipients("ccRecipients")}
        renderOption={(props: any, option: string | Contact) => (
          <GABOption childProps={props} contact={option as Contact} />
        )}
        options={contacts}
        handleContactRemove={handleContactRemove}
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
      <GABAutocompleteTextfield
        value={selectedContacts.bccRecipients}
        inputValue={bccRecipients}
        onChange={handleAutocomplete('bccRecipients')}
        onInputChange={handleRecipients("bccRecipients")}
        renderOption={(props: any, option: string | Contact) => (
          <GABOption childProps={props} contact={option as Contact} />
        )}
        options={contacts}
        handleContactRemove={handleContactRemove}
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
