// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { withTranslation } from 'react-i18next';
import { Button, Input, Menu, MenuItem } from '@mui/material';
import { useDispatch } from 'react-redux';
import { withStyles } from '@mui/styles';
import { useState } from 'react';
import { postMailFolderData } from '../../actions/folders';

const styles = {
  backdrop: {
    zIndex: 1200,
  }
}

// TODO: These actions are duplicated in the actionbar. Use a hook or HOC to deduplicate functions
const FoldersContextMenu = ({ t, isOpen, onClose, anchorPosition, parentFolderId }) => {
  const dispatch = useDispatch();
  const [newFolder, setNewFolder] = useState("");

  const handleCreate = async () => {
    dispatch(postMailFolderData({ displayName: newFolder }, parentFolderId));
  }

  return (
    <Menu
      open={isOpen}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      autoFocus={false}
    >
      <MenuItem onKeyDown={e => e.stopPropagation()}>
        <Input
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          endAdornment={<Button
            size="small"
            onClick={handleCreate}
            disabled={!newFolder}
          >
            {t("Save")}
          </Button>}
          placeholder="New sub-folder"
        />
      </MenuItem>
    </Menu>
  );
};

export default withStyles(styles)(withTranslation()(FoldersContextMenu));
