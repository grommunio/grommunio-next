import PropTypes from 'prop-types';
import { Button, MenuItem, Menu, TextField, IconButton } from '@mui/material';
import { withTranslation } from 'react-i18next';
import { ArchiveOutlined, CleaningServicesOutlined, DeleteOutlineOutlined, DraftsOutlined, DriveFileMoveOutlined,
  FlagOutlined, KeyboardArrowDown, MailOutlineOutlined, PushPinOutlined, ReplyAllOutlined } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { withStyles } from '@mui/styles';
import { useAppContext } from '../../azure/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { deleteMessageData, moveMessageData, patchMessageData } from '../../actions/messages';
import { useState } from 'react';

const styles = {
  button: {
    marginRight: 8,
    textTransform: 'none',
  },
}

const ActionButton = withStyles(styles)(({ classes, children, color, ...childProps }) => {
  return (
    <Button
      className={classes.button}
      color={color || "inherit"}
      style={color ? undefined : {color: 'white'}} // Can't be part of the class, because it would affect primary buttons too
      {...childProps}
    >
      {children}
    </Button>
  );
});

const MailActions = ({ t, openedMail, selection, handleNewMessage, handleReply, folder, handleFoldersToggle }) => {
  const mailsSelected = selection.length > 0 || openedMail !== null;
  const app = useAppContext();
  const handlePlaceholder = (e) => e.stopPropagation();
  const { mailFolders } = useSelector(state => state.messages);
  const dispatch = useDispatch();
  const [mailFolderFilter, setMailFolderFilter] = useState("");
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null);

  const handleMailDelete = () => {
    dispatch(deleteMessageData({
      app,
      messages: selection.length > 0 ? selection : [openedMail],
      // TODO: This does not work. Find way to convert non-english displayname
      force: folder.displayname == "Deleted items"
    }));
  }

  const handleMailMove = destinationId => () => {
    dispatch(moveMessageData({
      app,
      messages: selection.length > 0 ? selection : [openedMail],
      destinationId,
    }));
  }

  const handleReadToggle = () => {
    (selection.length > 0 ? selection : [openedMail]).forEach(message => {
      dispatch(patchMessageData({app, message, specificProps: { isRead: !message.isRead }}));
    });
  }

  const handleClean = () => window.alert("Action cannot be performed on this mailbox");

  const handleMove = (event) => {
    setMoveMenuAnchor(event.currentTarget);
  };

  const handleMoveMenuClose = () => {
    setMoveMenuAnchor(null);
  };

  const handleFolderFilter = e => setMailFolderFilter(e.target.value.toLowerCase());

  return [
    <IconButton onClick={handleFoldersToggle} style={{ marginRight: 8 }}>
      <MenuIcon />
    </IconButton>,
    <ActionButton
      key={0}
      onClick={handleNewMessage}
      variant='contained'
      color="primary"
      startIcon={<MailOutlineOutlined />}
    >
      {t("New message")}
    </ActionButton>,
    <ActionButton
      key={1}
      onClick={handleMailDelete}
      disabled={!mailsSelected}
      startIcon={<DeleteOutlineOutlined />}
    >
      {t("Delete")}
    </ActionButton>,
    <ActionButton
      key={2}
      onClick={handleMailMove("archive")}
      disabled={!mailsSelected}
      startIcon={<ArchiveOutlined color={mailsSelected ? "success" : "secondary"}/>}
    >
      {t("Archive")}
    </ActionButton>,
    <ActionButton
      key={3}
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<ArchiveOutlined color={mailsSelected ? "error" : "secondary"}/>}
    >
      {t("Report")}
    </ActionButton>,
    <ActionButton
      key={69420}
      onClick={handleClean}
      disabled={!mailsSelected}
      startIcon={<CleaningServicesOutlined />}
    >
      {t("Clean")}
    </ActionButton>,
    <ActionButton
      key={4}
      onClick={handleMove}
      disabled={!mailsSelected}
      startIcon={<DriveFileMoveOutlined color={mailsSelected ? "info" : "secondary"}/>}
      endIcon={<KeyboardArrowDown />}
    >
      {t("Move")}
    </ActionButton>,
    <ActionButton
      key={5}
      onClick={handleReply}
      disabled={selection.length > 1 || !openedMail /* TODO: this is still a bit buggy */} 
      startIcon={<ReplyAllOutlined color={mailsSelected ? "primary" : "secondary"}/>}
    >
      {t("Reply all")}
    </ActionButton>,
    <ActionButton
      key={6}
      onClick={handleReadToggle}
      disabled={!mailsSelected}
      startIcon={<DraftsOutlined />}
    >
      {t("Read/Unread")}
    </ActionButton>,
    <ActionButton
      key={7}
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<DraftsOutlined />}
    >
      {t("Categorize")}
    </ActionButton>,
    <ActionButton
      key={8}
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<FlagOutlined color={mailsSelected ? "error" : "secondary"}/>}
    >
      {t("Flag")}
    </ActionButton>,
    <ActionButton
      key={9}
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<PushPinOutlined color={mailsSelected ? "info" : "secondary"}/>}
    >
      {t("Pin")}
    </ActionButton>,
    <Menu
      key={10}
      anchorEl={moveMenuAnchor}
      open={Boolean(moveMenuAnchor)}
      onClose={handleMoveMenuClose}
    >
      <MenuItem disableRipple disableTouchRipple onKeyDown={(e) => e.stopPropagation()} /* Prevent 'select by typing' */>
        <TextField
          placeholder={t("Search folders")}
          fullWidth
          variant='standard'
          onChange={handleFolderFilter}
          value={mailFolderFilter}
        />
      </MenuItem>
      {(mailFolderFilter ? mailFolders.filter(f => f.displayName.toLowerCase().includes(mailFolderFilter)) : mailFolders).map((mailFolder, key) =>
        <MenuItem
          key={key}
          onClick={handleMailMove(mailFolder.id)}
        >
          {mailFolder.displayName}
        </MenuItem>
      )}
    </Menu>
  ];
}

MailActions.propTypes = {
  t: PropTypes.func.isRequired,
  selection: PropTypes.array.isRequired,
};

export default withTranslation()(MailActions);
