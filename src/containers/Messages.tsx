// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { fetchMailFoldersData, fetchMessagesData } from '../actions/messages';
import { Badge, Button, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { MailFolder, Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 16,
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
    overflowY: 'auto',
  },
  tinyMceContainer: {
    flex: 1,
    padding: 16,
  },
  drawerLi: {
    width: 'auto',
    margin: '6px 12px 6px',
    borderRadius: '3px',
    position: 'relative',
    display: 'flex',
    padding: '9px 14px',
    transition: 'all 200ms linear',
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
};

type MessagesProps = {
  classes: any,
}

function Messages({ classes }: MessagesProps) {
  const app = useAppContext();
  const { t } = useTranslation();
  const editorRef = useRef({});
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const dispatch = useTypeDispatch();
  const { mails: messages, mailFolders } = useTypeSelector(state => state.messages);
  const navigate = useNavigate();

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchMessagesData({app}));
    dispatch(fetchMailFoldersData(app));
  }, [app.authProvider]);

  const handleMailFolderClick = (folderid: string) => () => {
    dispatch(fetchMessagesData({app, folderid}));
  }

  const handleMailClick = (msg: Message) => () => setSelectedMsg(msg);

  const handleNewMessage = () => navigate('/newMessage');

  const drawerListElements = mailFolders.map((folder: MailFolder, idx: number) => 
    <ListItem disablePadding key={idx}>
      <ListItemButton
        className={classes.drawerLi}
        onClick={handleMailFolderClick(folder.id || '')}
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

  return (
    <AuthenticatedView
      drawerProps={{
        listElements: drawerListElements,
      }}
      rootClass={classes.root}
    >
      <Typography variant="h4">{t("Messages")}</Typography>
      <div>
        <Button onClick={handleNewMessage} variant='contained' color="primary">
          {t("New message")}
        </Button>
      </div>
      <div className={classes.content}>
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
        <Paper id="readonlyDiv" className={classes.tinyMceContainer}>
          {selectedMsg?.from?.emailAddress &&
          <Typography variant="h4">
            {selectedMsg.from.emailAddress.name || ''} &lt;{selectedMsg.from.emailAddress.address || ''}&gt;
          </Typography>}
          {selectedMsg?.body?.content && <Editor
            tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={selectedMsg?.body?.content}
            disabled
            init={{
              disabled: true,
              height: '100%',
              menubar: false,
              readonly: true,
              toolbar: '',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />}
        </Paper>
      </div>
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Messages);
