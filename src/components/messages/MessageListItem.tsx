import Hover from "../Hover";
import { withStyles } from "@mui/styles";
import { Avatar, Checkbox, IconButton, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { FlagOutlined, MailOutlineOutlined, PriorityHigh, PushPinOutlined } from "@mui/icons-material";
import { Message } from "microsoft-graph";
import { parseISODate } from "../../utils";
import CategoryChip from "./CategoryChip";

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
    minHeight: 30,
    justifyContent: 'space-between'
  },
}

type MessageListItemProps = {
  classes: any;
  message: Message;
  checkedMessages: Array<Message>;
  selectedMsg: Message | null;
  handleContextMenu: (a: Message) => (b: React.MouseEvent<HTMLElement>) => void;
  handleMailClick: (a: Message) => () => void;
  handleMailCheckbox: (a: Message) => (b: React.ChangeEvent<HTMLInputElement>) => void;
}

const MesssageListItem = ({ classes, checkedMessages, message, selectedMsg, handleContextMenu, handleMailClick, handleMailCheckbox }: MessageListItemProps) => {
  const names = message.sender?.emailAddress?.name?.split(" ") || [" ", " "];
  const checked = checkedMessages.includes(message);
  const handlePlaceholder = () => null;
  
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
        secondary={<>
          <div className={classes.mailSubjectContainer}>
            <div className={classes.mailSubject}>
              <Typography variant='body2' color={message.isRead ? "white" : "primary"}>
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
          {message.categories?.map((cat: string) => <CategoryChip color={cat} />)}
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