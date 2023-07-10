// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import { Button, MenuItem, Menu, TextField, IconButton } from '@mui/material';
import { withTranslation } from 'react-i18next';
import { ArchiveOutlined, CleaningServicesOutlined, DeleteOutlineOutlined, DraftsOutlined, DriveFileMoveOutlined,
  FlagOutlined, KeyboardArrowDown, MailOutlineOutlined, PushPinOutlined, ReplyAllOutlined } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { withStyles } from '@mui/styles';
import { useDispatch, useSelector } from 'react-redux';
import { deleteMessageData, moveMessageData, patchMessageData } from '../../actions/messages';
import { useState } from 'react';

const styles = theme => ({
  button: {
    marginRight: 8,
    textTransform: 'none',
  },
  plainButton: {
    marginRight: 8,
    textTransform: 'none',
    color: theme.palette.textPrimary,
  },
});

const ActionButton = withStyles(styles)(({ classes, children, color, ...childProps }) => {
  return (
    <Button
      className={color ? classes.button : classes.plainButton}
      color={color || "inherit"}
      {...childProps}
    >
      {children}
    </Button>
  );
});

const MailActions = ({ t, openedMail, selection, handleNewMessage, handleReply, folder, handleFoldersToggle,
  handlePin, clearCheckedMails }) => {
  const mailsSelected = selection.length > 0 || openedMail !== null;
  const handlePlaceholder = (e) => e.stopPropagation();
  const { mailFolders } = useSelector(state => state.folders);
  const dispatch = useDispatch();
  const [mailFolderFilter, setMailFolderFilter] = useState("");
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null);

  const handleMailDelete = () => {
    dispatch(deleteMessageData(
      selection.length > 0 ? selection : [openedMail],
      folder?.wellKnownName == "deleteditems"
    )).then(success => (success ? clearCheckedMails() : null))
  }

  const handleMailMove = destinationId => () => {
    dispatch(moveMessageData(
      selection.length > 0 ? selection : [openedMail],
      destinationId,
    )).then(success => (success ? clearCheckedMails() : null));
  }

  const handleReadToggle = () => {
    (selection.length > 0 ? selection : [openedMail]).forEach(message => {
      dispatch(patchMessageData( message, { isRead: !message.isRead }));
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

  const handleFlag = () => {
    dispatch(patchMessageData(
      openedMail,
      {
        flag: {
          // TODO: Add full followupFlag resource type
          flagStatus: openedMail.flag?.flagStatus === "flagged" ? "notFlagged" : "flagged",
        }
      },
    ));
  };

  return <>
    <IconButton onClick={handleFoldersToggle} style={{ marginRight: 8 }}>
      <MenuIcon />
    </IconButton>
    <ActionButton
      onClick={handleNewMessage}
      variant='contained'
      color="primary"
      startIcon={<MailOutlineOutlined />}
    >
      {t("New message")}
    </ActionButton>
    <ActionButton
      onClick={handleMailDelete}
      disabled={!mailsSelected}
      startIcon={<DeleteOutlineOutlined />}
    >
      {t("Delete")}
    </ActionButton>
    <ActionButton
      onClick={handleMailMove("archive")}
      disabled={!mailsSelected}
      startIcon={<ArchiveOutlined color={mailsSelected ? "success" : "secondary"}/>}
    >
      {t("Archive")}
    </ActionButton>
    <ActionButton
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<ArchiveOutlined color={mailsSelected ? "error" : "secondary"}/>}
    >
      {t("Report")}
    </ActionButton>
    <ActionButton
      onClick={handleClean}
      disabled={!mailsSelected}
      startIcon={<CleaningServicesOutlined />}
    >
      {t("Clean")}
    </ActionButton>
    <ActionButton
      onClick={handleMove}
      disabled={!mailsSelected}
      startIcon={<DriveFileMoveOutlined color={mailsSelected ? "info" : "secondary"}/>}
      endIcon={<KeyboardArrowDown />}
    >
      {t("Move")}
    </ActionButton>
    <ActionButton
      onClick={handleReply}
      disabled={selection.length > 1 || !openedMail /* TODO: this is still a bit buggy */} 
      startIcon={<ReplyAllOutlined color={mailsSelected ? "primary" : "secondary"}/>}
    >
      {t("Reply all")}
    </ActionButton>
    <ActionButton
      onClick={handleReadToggle}
      disabled={!mailsSelected}
      startIcon={<DraftsOutlined />}
    >
      {t("Read/Unread")}
    </ActionButton>
    <ActionButton
      onClick={handlePlaceholder}
      disabled={!mailsSelected}
      startIcon={<DraftsOutlined />}
    >
      {t("Categorize")}
    </ActionButton>
    <ActionButton
      onClick={handleFlag}
      disabled={!mailsSelected}
      startIcon={<FlagOutlined color={mailsSelected ? "error" : "secondary"}/>}
    >
      {t("Flag")}
    </ActionButton>
    <ActionButton
      onClick={handlePin}
      disabled={!mailsSelected}
      startIcon={<PushPinOutlined color={mailsSelected ? "info" : "secondary"}/>}
    >
      {t("Pin")}
    </ActionButton>
    <Menu
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
  </>;
}

MailActions.propTypes = {
  t: PropTypes.func.isRequired,
  selection: PropTypes.array.isRequired,
};

export default withTranslation()(MailActions);
