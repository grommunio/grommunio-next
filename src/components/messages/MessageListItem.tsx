// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import Hover from "../Hover";
import { withStyles } from "@mui/styles";
import { Avatar, Checkbox, IconButton, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from "@mui/material";
import { Event, EventAvailable, EventBusy, FlagOutlined, MailOutlineOutlined, PriorityHigh, PushPinOutlined, QuestionMark } from "@mui/icons-material";
import { EventMessage, Message } from "microsoft-graph";
import { parseISODate } from "../../utils";
import CategoryChip from "./CategoryChip";
import { useTypeDispatch } from "../../store";
import { patchMessageData } from "../../actions/messages";

const styles: any = {
  mailSender: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 220,
  },
  mailPreview: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 312,
  },
  mailSubjectContainer: {
    display: 'flex',
  },
  mailSubject: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 256,
  },
  mailDate: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  mailListItemTitle: {
    display: 'flex',
    alignItems: 'center',
    height: 30,
    justifyContent: 'space-between'
  },
  typeIcon: {
    marginRight: 4,
  },
  iconButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  }
}

type MessageListItemProps = {
  classes: any;
  message: Message;
  checkedMessages: Array<Message>;
  selectedMsg: Message | null;
  handlePin: (messageId: string) => (b: React.MouseEvent<HTMLElement>) => void;
  pinnedMessages: Array<string>;
  handleContextMenu: (a: Message) => (b: React.MouseEvent<HTMLElement>) => void;
  handleMailClick: (a: Message) => () => void;
  handleMailCheckbox: (a: Message) => (b: React.ChangeEvent<HTMLInputElement>) => void;
}

const MesssageListItem = ({ classes, pinnedMessages, handlePin, checkedMessages, message, selectedMsg, handleContextMenu,
  handleMailClick, handleMailCheckbox }: MessageListItemProps) => {
  const theme = useTheme();
  const names = message.sender?.emailAddress?.name?.split(" ") || [" ", " "];
  const checked = checkedMessages.includes(message);
  const dispatch = useTypeDispatch();
  const isPinned = pinnedMessages.includes(message.id || ""); // useMemo doesn't work here

  const handleFlag = () => {
    dispatch(patchMessageData(
      message,
      {
        flag: {
          // TODO: Add full followupFlag resource type
          flagStatus: message.flag?.flagStatus === "flagged" ? "notFlagged" : "flagged",
        }
      },
    ));
  };

  const handleSetUnread = () => {
    dispatch(patchMessageData(message, { isRead: false }));
  }

  const getMessageTypeIcon = () => {
    switch((message as EventMessage)?.meetingMessageType) {
    case "meetingRequest": return <Event className={classes.typeIcon} fontSize="small"/>;
    case "meetingAccepted": return <EventAvailable className={classes.typeIcon} fontSize="small"/>;
    case "meetingTenativelyAccepted": return <QuestionMark className={classes.typeIcon} fontSize="small"/>;
    case "meetingDeclined": return <EventBusy className={classes.typeIcon} fontSize="small"/>;
    case "meetingCancelled": return <EventBusy className={classes.typeIcon} fontSize="small"/>;
    default: return null;
    }
  }
  
  return <Hover>
    {(hover: boolean) => <ListItemButton
      onContextMenu={handleContextMenu(message)}
      selected={checked || selectedMsg?.id === message.id}
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
          <div className={classes.mailSender}>
            {message.sender?.emailAddress?.name || message.sender?.emailAddress?.address || "Unknown sender"}
          </div>
          <div className={classes.iconButtons}>
            <IconButton
              style={{ visibility: hover ? "visible" : "hidden" }}
              onClick={handleSetUnread}
              size='small'
              title="Mark as unread"
            >
              <MailOutlineOutlined fontSize='small'/>
            </IconButton>
            <IconButton
              style={{ visibility: (hover || message.flag?.flagStatus === "flagged") ? "visible" : "hidden" }}
              onClick={handleFlag}
              size='small'
              title="Flag this message"
            >
              <FlagOutlined fontSize='small' color={message.flag?.flagStatus === "flagged" ? "error" : "inherit"}/>
            </IconButton>
            {!hover && getMessageTypeIcon()}
            {(hover || isPinned) && <IconButton
              onClick={handlePin(message?.id || "")}
              size='small'
              title="Pin this message"
            >
              <PushPinOutlined fontSize='small' color={isPinned ? "error" : "inherit"}/>
            </IconButton>}
            {message.importance === "high" && <PriorityHigh color="error" fontSize='small' />}
          </div> 
        </>}
        secondary={<>
          <div className={classes.mailSubjectContainer}>
            <div className={classes.mailSubject}>
              <Typography
                style={{ fontWeight: message.isRead ? "normal" : "bold"}}
                variant='body2'
                color={message.isRead ? theme.palette.text.primary : "primary"}
              >
              &gt; {message.subject}
              </Typography>
            </div>
            <div className={classes.mailDate}>
              <Typography variant='body2' color={message.isRead ? "white" : "primary"}>
                {parseISODate(message.receivedDateTime || "")}
              </Typography>
            </div>
          </div>
          <div className={classes.mailPreview}>{message.bodyPreview}</div>
          {message.categories?.map((cat: string, key: number) => <CategoryChip key={key} color={cat} />)}
        </>}
        primaryTypographyProps={{
          className: classes.mailListItemTitle,
        }}
        secondaryTypographyProps={{
          component: 'span',
        }}
      />
    </ListItemButton>}
  </Hover>;
}

export default withStyles(styles)(MesssageListItem);