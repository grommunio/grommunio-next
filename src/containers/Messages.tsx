// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { fetchMailFoldersData, fetchMessagesData } from '../actions/messages';
import { Avatar, Badge, Button, Checkbox, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, Menu,
  MenuItem, Paper, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { MailFolder, Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import SearchTextfield from '../components/SearchTextfield';
import { CheckBoxOutlined, FilterList, FlagOutlined, Forward, MailOutlineOutlined, PriorityHigh, PushPinOutlined } from '@mui/icons-material';
import { debounce } from 'lodash';
import FolderList from '../components/FolderList';
import Hover from '../components/Hover';
import MailActions from '../components/messages/MailActions';
import { now } from 'moment';
import NewMessage from './NewMessage';

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
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  flexRow: {
    display: 'flex',
    flex: 1,
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: "0 16px",
  },
  messages: {
    flex: 1,
    borderTop: "none",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  mailListActions: {
    marginTop: 16,
    borderBottom: "none",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  search: {
    flex: 1,
    marginRight: 4,
  },
  mailActionsContainer: {
    marginBottom: 4,
  },
  filterRow: {
    display: 'flex',
    marginRight: -4,
  },
  iconButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  menu: {
    margin: 0,
  },
  mailListItemTitle: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 30,
    justifyContent: 'space-between'
  },
  mailListHeader: {
    padding: 4,
    display: 'flex',
    justifyContent: 'space-between',
  },
  checkAll: {
    marginLeft: 8,
  },
  filterButton: {
    marginRight: 8,
    textTransform: 'none',
  },
  filterIcon: {
    marginBottom: 4,
  },
  mailContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  mailTabsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  }
};

type MessagesProps = {
  classes: any;
}

type MailTab = {
  // This will probably get more props in the future
  ID: number,
  label: string,
  component?: JSX.Element,
};

function objectToCNF(filters: any) {
  return Object.entries(filters)
    .filter(e => e[1])
    .map(e => e[0])
    .join(" and ");
}

const filterOptions = [
  { label: "High importance", value: "importance eq 'high'" },
  { label: "Unread", value: "isRead eq false" },
  { label: "Attachments", value: "hasAttachments eq true" }
]

function Messages({ classes }: MessagesProps) {
  const app = useAppContext();
  const { t } = useTranslation();
  const editorRef = useRef({});
  const [selectedFolder, setSelectedFolder] = useState<MailFolder | null>(null); // TODO: Get default somehow
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [checkedMessages, setCheckedMessages] = useState<Array<Message>>([]);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [mailFilters, setMailFilters] = useState<any>({});
  const { mails: messages, mailFolders } = useTypeSelector(state => state.messages);
  const [mailTabs, setMailTabs] = useState<Array<MailTab>>([]);
  const [mailTab, setMailTab] = useState<MailTab | null>(null);
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchMessagesData({app}));
    dispatch(fetchMailFoldersData(app));
  }, []);

  const debouncedSearch = debounce(async (search: string, folderid?: string) => {
    await dispatch(fetchMessagesData({
      app,
      folderid,
      params: {
        search: search === '""' ? undefined : search,
      },
    }));
  }, 250);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    debouncedSearch(`"${value}"`, selectedFolder?.id);
  };

  const handleMailFolderClick = (folder: MailFolder) => () => {
    setSelectedFolder(folder);
    dispatch(fetchMessagesData({app, folderid: folder?.id, params: { filter: objectToCNF(mailFilters) || undefined }}))
  }

  const handleMailClick = (msg: Message) => () => {
    const copy = [...mailTabs];
    const tab = { ID: 1, label: msg.subject || '' };
    if(selectedMsg === null) copy.unshift(tab);
    else copy[0] = tab;
    setSelectedMsg(msg);
    setMailTabs(copy);
    setMailTab(tab);
  }

  const handleForward = () => {
    navigate('/newMessage', { state: selectedMsg });
  }

  const handleFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setFilterAnchor(null);
  };

  const handleFilter = (filter: string) => () => {
    setMailFilters({
      ...mailFilters,
      [filter]: !mailFilters[filter],
    });
  }

  useEffect(() => {
    dispatch(fetchMessagesData({
      app,
      folderid: selectedFolder?.id,
      params: {
        filter: objectToCNF(mailFilters) || undefined,
      },
    }));
  }, [mailFilters]);

  const handleMailCheckbox = (message: Message) => (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const copy = [...checkedMessages];
    if(e.target.checked) {
      copy.push(message);
    } else {
      copy.splice(copy.findIndex(m => m.id === message.id), 1);
    }
    setCheckedMessages(copy);
  }

  const handlePlaceholder = (e: React.MouseEvent<HTMLElement>) => e.stopPropagation();

  const handleCheckAll = () => {
    setCheckedMessages(messages.length === checkedMessages.length ? [] : messages);
  }

  const handleNewMessage = () => {
    const copy = [...mailTabs];
    const tab = { ID: now(), label: '<No subject>', component: <NewMessage /> };
    copy.push(tab);
    setMailTabs(copy);
    setMailTab(tab);
  }

  const handleTab = (e: any, newVal: MailTab) => setMailTab(newVal);

  return (
    <AuthenticatedView
      header={t("Messages")}
      actions={<MailActions handleNewMessage={handleNewMessage} openedMail={selectedMsg} selection={checkedMessages}/>}
    >
      <div className={classes.content}>
        <FolderList>
          {mailFolders.map((folder: MailFolder, idx: number) => 
            <ListItem disablePadding key={idx}>
              <ListItemButton
                onClick={handleMailFolderClick(folder)}
                selected={selectedFolder?.id === folder.id}
                divider
              >
                <ListItemText primary={folder.displayName} />
                <Badge
                  badgeContent={folder.unreadItemCount}
                  color="primary"
                >
                  <div style={{width: 16, height: 12}}></div>
                </Badge>
              </ListItemButton>
            </ListItem>)}
        </FolderList>
        <div className={classes.flexContainer}>
          <div className={classes.filterRow}>
            <SearchTextfield
              className={classes.search}
              label="Filter mails"
              onChange={handleSearch}
            />
            <Menu
              anchorEl={filterAnchor}
              open={!!filterAnchor}
              onClose={handleMenuClose}
              PaperProps={{
                className: classes.menu,
              }}
            >
              {filterOptions.map(({ label, value }, key) =>
                <MenuItem
                  key={key}
                  selected={mailFilters[value]}
                  onClick={handleFilter(value)}
                >
                  {t(label)}
                </MenuItem>
              )}
            </Menu>
          </div>
          <Paper className={classes.mailListActions}>
            <div className={classes.mailListHeader}>
              <IconButton onClick={handleCheckAll} className={classes.checkAll}>
                <CheckBoxOutlined color={checkedMessages.length === messages.length ? "primary" : "secondary"}/>
              </IconButton>
              <Button
                className={classes.filterButton}
                onClick={handleFilterMenu}
                startIcon={<FilterList className={classes.filterIcon}/>}
                color="inherit"
              >
                Filter
              </Button>
            </div>
          </Paper>
          <Paper className={classes.messages}>
            <List className={classes.mailList}>
              {messages.map((message: Message, key: number) => {
                const names = message.sender?.emailAddress?.name?.split(" ") || [" ", " "];
                const checked = checkedMessages.includes(message);
                return <Hover key={key}>
                  {(hover: boolean) => <ListItemButton
                    selected={checked || selectedMsg === message}
                    onClick={handleMailClick(message)}
                  >
                    {hover || checkedMessages.length > 0 ? <ListItemIcon>
                      <Checkbox
                        sx={{ p: 0.5 }}
                        checked={checked}
                        onChange={handleMailCheckbox(message)}
                      />
                    </ListItemIcon> : <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <Typography variant='body2'>{names[0][0]}{names[names.length - 1][0]}</Typography>
                      </Avatar>
                    </ListItemAvatar>}
                    
                    <ListItemText
                      primary={<>
                        {message.subject}
                        {hover ? <div>
                          <IconButton onClick={handlePlaceholder} size='small' title="Mark as unread">
                            <MailOutlineOutlined fontSize='small'/>
                          </IconButton>
                          <IconButton onClick={handlePlaceholder} size='small' title="Mark this message">
                            <FlagOutlined fontSize='small'/>
                          </IconButton>
                          <IconButton onClick={handlePlaceholder} size='small' title="Pin this message">
                            <PushPinOutlined fontSize='small'/>
                          </IconButton>
                        </div> : message.importance === "high" && <div>
                          <PriorityHigh color="error" fontSize='small' />
                        </div>}
                      </>}
                      secondary={message.bodyPreview}
                      primaryTypographyProps={{
                        className: classes.mailListItemTitle,
                      }}
                    />
                  </ListItemButton>}
                </Hover>;
              })}
            </List>
          </Paper>
        </div>
        <div className={classes.mailContainer}>
          {mailTab?.ID === 1 && <Paper id="readonlyDiv" className={classes.tinyMceContainer}>
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
          </Paper>}
          {mailTabs.slice(1).map((tab, key) =>
            <TabPanel key={key} hidden={tab.ID !== mailTab?.ID}>
              {tab?.component || null}
            </TabPanel>
          )}
          <div className={classes.mailTabsContainer}>
            <Tabs onChange={handleTab} value={mailTab} color="primary">
              {mailTabs.map((tab, key) =>
                <Tab key={key} value={tab} label={tab.label} />
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </AuthenticatedView>
  );
}

function TabPanel(props: any) {
  const { children, hidden, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={hidden}
      style={{ flex: 1 }}
      {...other}
    >
      {children}
    </div>
  );
}

export default withStyles(styles)(Messages);
