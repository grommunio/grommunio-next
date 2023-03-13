// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { fetchMailFoldersData, fetchMessagesData } from '../actions/messages';
import { Badge, Button, IconButton, List, ListItem, ListItemButton, ListItemText, Paper, Tooltip, Typography } from '@mui/material';
import { MailFolder, Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import SearchTextfield from '../components/SearchTextfield';
import { debounce } from "lodash";
import { Forward } from '@mui/icons-material';

const styles: any = {
  content: {
    flex: 1,
    height: '100%',
    display: 'flex',
  },
  mailList: {
    width: 400,
    overflowY: 'auto',
    height: 0, // Used to get inside-div scrolling
    minHeight: '100%',
    padding: 0,
  },
  tinyMceContainer: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerLi: {
    width: 'auto',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: 'transparent',
      textShadow: '0px 0px 1px white',
      color: 'white',
    },
  },
  badgeAnchor: {
    width: 16,
    height: 12,
  },
  flexRow: {
    display: 'flex',
    flex: 1,
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  messages: {
    flex: 1,
  },
  search: {
    margin: '16px 16px 4px 16px'
  },
  mailActionsContainer: {
    marginBottom: 4,
  },
};

type MessagesProps = {
  classes: any;
  setDrawerElements: (elements: Array<JSX.Element>) => void;
}

function Messages({ classes, setDrawerElements }: MessagesProps) {
  const app = useAppContext();
  const { t } = useTranslation();
  const editorRef = useRef({});
  const [params, setParams] = useState({});
  const [selectedFolder, setSelectedFolder] = useState<MailFolder | null>(null); // TODO: Get default somehow
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const dispatch = useTypeDispatch();
  const { mails: messages, mailFolders } = useTypeSelector(state => state.messages);
  const navigate = useNavigate();

  const help = (search: string) => {
    dispatch(fetchMessagesData({
      app,
      folderid: selectedFolder?.id,
      params: { ...params, search: `${search}` || undefined },
    }));
  }

  const throttledSearch = useRef(debounce(help, 200));

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchMessagesData({app}));
    dispatch(fetchMailFoldersData(app));
  }, []);

  const handleMailFolderClick = (folder: MailFolder) => () => {
    setSelectedFolder(folder);
    dispatch(fetchMessagesData({app, folderid: folder?.id, params}))
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    throttledSearch.current(value);
    setParams({ ...params, search: value ? `"${value}"` : "" });
  };

  const handleMailClick = (msg: Message) => () => setSelectedMsg(msg);

  const handleNewMessage = () => navigate('/newMessage');

  /*const handleContactSelect = () => {
    const contacts = useTypeSelector(state => state.gab.seletion);
    if(selectedMsg) postMessageForward(app.authProvider!, selectedMsg, {
      toRecipients: contacts.map((contact: Contact) => {
        if(contact?.emailAddresses && contact?.emailAddresses?.length > 0) {
          return  {
            emailAddress: {
              ...contact.emailAddresses[0] //TODO: This should not be hardcoded in the future
            }
          }
        } else {
          return null;
        }
      })
    })
  }*/

  const handleForward = () => {
    navigate('/newMessage', { state: selectedMsg });
  }

  useEffect(() => {
    const elements = mailFolders.map((folder: MailFolder, idx: number) => 
      <ListItem disablePadding key={idx}>
        <ListItemButton
          className={classes.drawerLi}
          onClick={handleMailFolderClick(folder)}
          selected={selectedFolder?.id === folder.id}
          divider
        >
          {folder.displayName}
          <Badge
            badgeContent={folder.unreadItemCount}
            color="primary"
          >
            <div className={classes.badgeAnchor}></div>
          </Badge>
        </ListItemButton>
      </ListItem>);
    setDrawerElements(elements);
  }, [mailFolders, selectedFolder])

  return (
    <AuthenticatedView
      header={t("Messages")}
      actions={[
        <Button onClick={handleNewMessage} variant='contained' color="primary">
          {t("New message")}
        </Button>
      ]}
    >
      <div className={classes.content}>
        <div className={classes.flexContainer}>
          <SearchTextfield
            className={classes.search}
            label="Search mails"
            onChange={handleSearch}
          />
          <Paper className={classes.messages}>
            <List className={classes.mailList}>
              {messages.map((message: Message) =>
                <ListItemButton
                  key={message.id}
                  onClick={handleMailClick(message)}
                >
                  <ListItemText
                    primary={message.subject}
                    secondary={message.bodyPreview}
                  />
                </ListItemButton>
              )}
            </List>
          </Paper>
        </div>
        <Paper id="readonlyDiv" className={classes.tinyMceContainer}>
          {selectedMsg && <div id="mailActionsContainer" className={classes.mailActionsContainer}>
            <Tooltip title={t("Forward")} placement="top">
              <IconButton onClick={handleForward}>
                <Forward />
              </IconButton>
            </Tooltip>
          </div>}
          {selectedMsg?.from?.emailAddress &&
            <Typography variant="h4">
              {selectedMsg.from.emailAddress.name || ''} &lt;{selectedMsg.from.emailAddress.address || ''}&gt;
            </Typography>}
          {selectedMsg?.body?.content && <div className={classes.flexRow}>
            <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={selectedMsg?.body?.content}
              disabled
              init={{
                disabled: true,
                menubar: false,
                readonly: true,
                toolbar: '',
                plugins: ['wordcount'],
                width: '100%',
                height: '100%', // Doesn't work on its own. The .tox-tinymce class has been overwritten as well
              }}
            /></div>}
        </Paper>
      </div>
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Messages);
