// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { fetchMessageCategories, fetchMessagesData, patchMessageData } from '../actions/messages';
import { Button, Grid, IconButton, List, Menu,
  MenuItem, Pagination, Paper, Tab, Tabs, Typography } from '@mui/material';
import { MailFolder, Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import SearchTextfield from '../components/SearchTextfield';
import { CheckBoxOutlined, Close, EditOutlined, FilterList, Mail } from '@mui/icons-material';
import { debounce } from 'lodash';
import MailActions from '../components/messages/MailActions';
import { now } from 'moment';
import NewMessage from '../components/NewMessage';
import MessagePaper from '../components/messages/MessagePaper';
import MailContextMenu from '../components/messages/MailContextMenu/MailContextMenu';
import MessageListItem from '../components/messages/MessageListItem';
import AddCategory from '../components/dialogs/AddCategory';
import usePinnedMessages from '../hooks/usePinnedMessages';
import { fetchMailFoldersData } from '../actions/folders';
import FolderHierarchy from '../components/FolderHierarchy';
import { ContextMenuCoords } from '../types/misc';

const styles: any = (theme: any) => ({
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
  
  filterRow: {
    display: 'flex',
    marginRight: -4,
  },
  menu: {
    margin: 0,
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
    marginBottom: 22,
  },
  tab: {
    textTransform: 'none',
    border: '2px solid #545454',
    marginRight: 8,
    padding: 11,
    minHeight: 48,
    minWidth: 120,
  },
  tabContent: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 172,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(15),
  },
  centralize: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mailIconContainer: {
    paddingBottom: 8,
    display: 'flex',
    justifyContent: 'center',
  },
  paginationContainer: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'flex-end',
  }
});

type MessagesProps = {
  classes: any;
}

type MailTab = {
  // This will probably get more props in the future
  ID: number,
  label: string,
  Component?: typeof NewMessage,
  initialState?: any,
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
  const { t } = useTranslation();
  const [selectedFolder, setSelectedFolder] = useState<MailFolder | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [checkedMessages, setCheckedMessages] = useState<Array<Message>>([]);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [mailFilters, setMailFilters] = useState<any>({});
  const { mails: messages, count: totalMailCount } = useTypeSelector(state => state.messages);
  const { mailFolders } = useTypeSelector(state => state.folders);
  const [mailTabs, setMailTabs] = useState<Array<MailTab>>([]);
  const [activeMailTab, setActiveMailTab] = useState<MailTab | null>(null);
  const [foldersVisible, setFoldersVisible] = useState<boolean>(true);
  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuCoords | null>(null);
  const isContextMenuOpen = Boolean(contextMenuPosition);
  const dispatch = useTypeDispatch();
  const [mailListPage, setMailListPage] = useState(1);

  const [pinnedMessages, setPinnedMessages] = usePinnedMessages();

  // componentDidMount()
  useEffect(() => {
    // TODO: Try implementing a single 'batch' request for these
    dispatch(fetchMessagesData());
    dispatch(fetchMailFoldersData());
    dispatch(fetchMessageCategories());
  }, []);

  // Set default folder selection after folders have been fetched
  useEffect(() => {
    setSelectedFolder(mailFolders.find(f => f["wellKnownName"] === "inbox"));
  }, [mailFolders]);

  // Update selected message when message object in store changes
  useEffect(() => {
    if(selectedMsg?.id) setSelectedMsg(messages.find((m: Message) => m.id === selectedMsg.id));
  }, [messages]);

  const debouncedSearch = debounce(async (search: string, folderid?: string) => {
    await dispatch(fetchMessagesData(
      folderid,
      {
        search: search === '""' ? undefined : search,
      },
    ));
    if(mailListPage !== 1) setMailListPage(1);
  }, 250);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    debouncedSearch(`"${value}"`, selectedFolder?.id);
  };

  const handleMailFolderClick = (folder: MailFolder) => () => {
    setSelectedFolder(folder);
    setMailListPage(1);
    dispatch(fetchMessagesData(folder?.id, { filter: objectToCNF(mailFilters) || undefined }));
  }

  const handleMailClick = (msg: Message) => () => {
    const copy = [...mailTabs];
    const tab = { ID: 1, label: msg.subject || '' };
    // No message selected and no empty reading tab created
    if(selectedMsg === null && copy.length === 0) {
      copy.unshift(tab);
    }
    // Replace empty reading tab with clicked mail
    else copy[0] = tab;
    setSelectedMsg({...msg});
    setMailTabs(copy);
    setActiveMailTab(tab);
    // Set isRead
    if(!msg.isRead) dispatch(patchMessageData(msg, { isRead: true }));
  }

  const handleForward = () => {
    const copy = [...mailTabs];
    const tab: MailTab = {
      ID: now(),
      label: 'FW: ' + selectedMsg?.subject,
      Component: NewMessage,
      initialState: {
        ...(selectedMsg || {}),
        body: {
          // TODO: Improve reply body (this already works really well)
          content: "<br><div>---------------<br>" + selectedMsg?.body?.content + "</div>",
        },
      }
    };
    copy.push(tab);
    setMailTabs(copy);
    setActiveMailTab(tab);
  }

  const handleReply = () => {
    const copy = [...mailTabs];
    const tab: MailTab = {
      ID: now(),
      label: 'FW: ' + selectedMsg?.subject,
      Component: NewMessage,
      initialState: {
        subject: "RE: " + selectedMsg?.subject,
        toRecipients: selectedMsg?.toRecipients?.map(recip => recip.emailAddress?.address || "").join(","),
        body: {
          // TODO: Improve reply body (this already works really well)
          content: "<br><div>---------------<br>" + selectedMsg?.body?.content + "</div>",
        }
      },
    };
    copy.push(tab);
    setMailTabs(copy);
    setActiveMailTab(tab);
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
    dispatch(fetchMessagesData(
      selectedFolder?.id,
      {
        filter: objectToCNF(mailFilters) || undefined,
      },
    ));
    setMailListPage(1);
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

  const handleCheckAll = () => {
    setCheckedMessages(messages.length === checkedMessages.length ? [] : messages);
  }

  const handleTabLabelChange = (tabIndex: number) => (newLabel: string) => {
    const copy = [...mailTabs];
    copy[tabIndex].label = newLabel;
    setMailTabs(copy);
  }

  const handleNewMessage = (initialState?: any, label?: string) => () => {
    const copy = [...mailTabs];
    if(copy.length === 0) { /* No e-mail selected */
      const readingTab = {
        ID: 1, /* Reading tab ID */
        label: label || 'Select mail to read',
      }
      copy.push(readingTab);
    }
    const tab = {
      ID: now(),
      label: '<No subject>',
      Component: NewMessage,
      initialState,
    };
    copy.push(tab);
    setMailTabs(copy);
    setActiveMailTab(tab);
  }

  const handleTab = (e: any, newVal: MailTab) => setActiveMailTab(newVal);

  const handleDraftClose = (tabIndex: number) => () => {
    const copy = [...mailTabs];
    copy.splice(tabIndex, 1);
    setActiveMailTab(copy[0] || null);
    setMailTabs(copy);
  }

  const handleFoldersToggle = () => setFoldersVisible(!foldersVisible);

  const handleContextMenu = (msg: Message) => (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const copy = [...mailTabs];
    const tab = { ID: 1, label: msg.subject || '' };
    if(selectedMsg === null) copy.unshift(tab);
    else copy[0] = tab;
    setMailTabs(copy);
    setActiveMailTab(tab);
    setSelectedMsg({...msg});
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
  };

  const handleAddCategory = (open: boolean) => () => {
    setAddingCategory(open);
  }

  const clearCheckedMails = () => setCheckedMessages([]);
    
  // Move pinned messages to top of list
  const sortedMessages = useMemo(() => {
    const copy = [...messages];
    copy.sort((a: Message, b: Message) => {
      const aIncluded = pinnedMessages.includes(a.id);
      const bIncluded = pinnedMessages.includes(b.id);
      if(aIncluded && bIncluded) return 0;
      if(aIncluded) return -1;
      if(bIncluded) return 1;
      return 0;
    });
    return copy;
  }, [pinnedMessages, messages]);

  const handlePin = (messageId: string) => () => {
    const copy = [...pinnedMessages];
    if(pinnedMessages.includes(messageId)) {
      copy.splice(copy.findIndex(id => id === messageId), 1);
    } else {
      copy.push(messageId || "")
    }
    setPinnedMessages(copy);
  }

  const handleCloseTab = (tab: MailTab) => (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const copy = [...mailTabs];
    const idx = copy.findIndex(t => t.ID === tab.ID);
    if(idx !== -1) {
      copy.splice(idx, 1);
    }
    // Closing active tab -> Select the last one
    if(activeMailTab?.ID === tab.ID) {
      setActiveMailTab(copy[copy.length - 1])
    }
    setMailTabs(copy);
  }

  const handlePagination = (_: any, value: number) => {
    dispatch(fetchMessagesData(selectedFolder?.id, {
      filter: objectToCNF(mailFilters) || undefined,
      skip: 10 * (value - 1),
    }));
    setMailListPage(value);
  }

  return (
    <AuthenticatedView
      header={t("Messages")}
      actions={<MailActions
        handleNewMessage={handleNewMessage()}
        openedMail={selectedMsg}
        selection={checkedMessages}
        clearCheckedMails={clearCheckedMails}
        folder={selectedFolder}
        handleReply={handleReply}
        handleFoldersToggle={handleFoldersToggle}
        handlePin={handlePin(selectedMsg?.id || "")}
      />}
    >
      <div className={classes.content}>
        {foldersVisible && <FolderHierarchy
          data={mailFolders} 
          handleMailFolderClick={handleMailFolderClick}
          selected={selectedFolder}
        />}
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
              {sortedMessages.map((message: Message, key: number) =>
                <MessageListItem
                  key={key}
                  message={message}
                  selectedMsg={selectedMsg}
                  checkedMessages={checkedMessages}
                  handleMailCheckbox={handleMailCheckbox}
                  handleMailClick={handleMailClick}
                  handleContextMenu={handleContextMenu}
                  pinnedMessages={pinnedMessages}
                  handlePin={handlePin}
                />
              )}
            </List>
          </Paper>
          <div className={classes.paginationContainer}>
            <Pagination
              onChange={handlePagination}
              count={Math.ceil(totalMailCount / 10)}
              page={mailListPage}
              shape="rounded"
            />
          </div>
        </div>
        <div className={classes.mailContainer}>
          <div className={classes.mailTabsContainer}>
            <Tabs
              onChange={handleTab}
              value={activeMailTab}
              color="primary"
              textColor="inherit"
              style={{ color: 'white' }}
            >
              {mailTabs.map((tab, key) =>
                <Tab
                  disableRipple
                  key={key}
                  value={tab}
                  iconPosition='start'
                  icon={key !== 0 ? <EditOutlined fontSize='inherit' style={{ fontSize: 16, marginRight: 4 }}/> : undefined}
                  label={<div className={classes.tabContent}>
                    <Typography>{tab.label || "<No subject>"}</Typography>
                    {key !== 0 && <IconButton
                      onClick={handleCloseTab(tab)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <Close fontSize='small'/>
                    </IconButton>}
                  </div>}
                  className={classes.tab}
                  
                />
              )}
            </Tabs>
          </div>
          {mailTabs.length === 0 && <div className={classes.centralize}>
            <Grid>
              <div className={classes.mailIconContainer}>
                <Mail color="primary" fontSize="inherit" style={{ fontSize: 69 /* nice */ }}/>
              </div>
              <Typography align='center'>Select E-Mail to read</Typography>
              <Typography color="grey" align='center'>No selection made</Typography>
            </Grid>
          </div>}
          {activeMailTab?.ID === 1 && <MessagePaper
            handleForward={handleForward}
            handleReply={handleReply}
            selectedMsg={selectedMsg}
          />}
          {(mailTabs.length > 1 ? mailTabs.slice(1) : []).map((tab, key) =>
            <TabPanel key={key} hidden={tab.ID !== activeMailTab?.ID}>
              {tab?.Component ? <tab.Component
                initialState={tab.initialState}
                handleNewMessage={handleNewMessage}
                handleTabLabelChange={handleTabLabelChange(key + 1 /* First tab is the selected mail */)}
                handleDraftClose={handleDraftClose(key + 1)}
              /> : null}
            </TabPanel>
          )}
        </div>
      </div>
      <MailContextMenu
        isOpen={isContextMenuOpen}
        onClose={handleCloseContextMenu}
        anchorPosition={contextMenuPosition}
        openedMail={selectedMsg}
        folder={selectedFolder}
        handleAddCategory={handleAddCategory}
        clearCheckedMails={clearCheckedMails}
      />
      <AddCategory
        open={addingCategory}
        onClose={handleAddCategory(false)}
      />
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
