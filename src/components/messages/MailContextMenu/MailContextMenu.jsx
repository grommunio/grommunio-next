// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { withTranslation } from 'react-i18next';
import { Menu, MenuItem } from '@mui/material';
import { deleteMessageData, moveMessageData, patchMessageData } from '../../../actions/messages';
import { useDispatch } from 'react-redux';
import { withStyles } from '@mui/styles';
import CopyMailMenuItem from './CopyMailMenuItem';
import CategorizeMailMenuItem from './CategorizeMailMenuItem';
import MoveMailMenuItem from './MoveMailMenuItem';

const styles = {
  backdrop: {
    zIndex: 1200,
  }
}

// TODO: These actions are duplicated in the actionbar. Use a hook or HOC to deduplicate functions
const MailContextMenu = ({ t, isOpen, onClose, anchorPosition, openedMail, folder, handleAddCategory, clearCheckedMails }) => {
  const dispatch = useDispatch();

  const handleMailDelete = () => {
    dispatch(deleteMessageData(
      [openedMail],
      // TODO: This does not work. Find way to convert non-english displayname
      folder?.displayname == "Deleted items"
    )).then(success => {
      if(success) {
        clearCheckedMails();
        onClose();
      }
    });
  }

  const handleMailMove = destinationId => () => {
    dispatch(moveMessageData(
      [openedMail],
      destinationId,
    )).then(success => {
      if(success) {
        clearCheckedMails();
        onClose();
      }
    });
  }

  const handleMarkAsUnread = () => {
    [openedMail].forEach(message => {
      dispatch(patchMessageData(message, { isRead: false }));
    });
  }

  return (
    <Menu
      open={isOpen}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      autoFocus={false}
    >
      <MenuItem onClick={handleMailDelete}>{t("Delete")}</MenuItem>
      <MenuItem onClick={handleMailMove("archive")}>{t("Archive")}</MenuItem>
      <MenuItem onClick={handleMarkAsUnread}>{t("Mark as unread")}</MenuItem>
      <MoveMailMenuItem openedMail={openedMail} />
      <CopyMailMenuItem openedMail={openedMail}/>
      <CategorizeMailMenuItem openedMail={openedMail} handleAddCategory={handleAddCategory}/>
    </Menu>
  );
};

export default withStyles(styles)(withTranslation()(MailContextMenu));
