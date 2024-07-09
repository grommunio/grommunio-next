// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import { Badge, Button, Input, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { DRAWER_WIDTH } from '../constants';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { postMailFolderData } from '../actions/folders';
import FoldersContextMenu from './messages/FoldersContextMenu';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';

const styles = theme => ({
  root: {
    width: DRAWER_WIDTH,
    overflow: 'auto',
  },
  treeItemLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: "6px 0px",
  },
  newFolder: {
    color: theme.palette.primary.main,
    paddingLeft: 12,
  },
});


const FolderHierarchy = ({classes, data, handleMailFolderClick, selected}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const isContextMenuOpen = Boolean(contextMenuPosition);
  const [adding, setAdding] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const handleNewFolder = parentFolderId => e => {
    e.stopPropagation();
    setAdding(parentFolderId);
  }

  const handleCreate = async () => {
    const data = await dispatch(postMailFolderData({ displayName: newFolder }, adding));
    if(data?.id) {
      setAdding("");
      setNewFolder("");
    }
  }

  const handleContextMenu = parentFolderId => e => {
    e.preventDefault();
    setAdding(parentFolderId);
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
    setAdding("");
  };

  const renderTree = (folders, parentFolderId) => <>
    {folders.map((folder) => 
      <TreeItem
        onContextMenu={handleContextMenu(folder.id)}
        key={(folder.id) || -1}
        itemId={(folder.id) || "-1"}
        label={<div className={classes.treeItemLabel}>
          <Typography variant='body1'>{folder.displayName}</Typography>
          <Badge
            badgeContent={folder.unreadItemCount}
            color="primary"
          >
            <div style={{width: 16, height: 12}}></div>
          </Badge>
        </div>}
        onClick={handleMailFolderClick(folder)}
      >
        {folder.childFolderCount
          ? renderTree(folder.childFolders, folder.id)
          : null}
      </TreeItem>
    )}
    <TreeItem
      onKeyDown={e => e.stopPropagation()}
      itemId={`${parentFolderId}-textfield`}
      label={adding === parentFolderId ?
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
          placeholder="New folder"
        /> :
        <div className={classes.treeItemLabel}>
          <Typography className={classes.newFolder}>{t("New folder")}</Typography>
        </div>}
      onClick={handleNewFolder(parentFolderId)}
    />
  </>

  return (<>
    <SimpleTreeView
      selectedItems={[selected?.id] || []}
      className={classes.root}
    >
      {data.length !== 0 && renderTree(data, 0)}
    </SimpleTreeView>
    <FoldersContextMenu
      isOpen={isContextMenuOpen}
      onClose={handleCloseContextMenu}
      anchorPosition={contextMenuPosition}
      parentFolderId={adding}
    />
  </>
    
  );
}

FolderHierarchy.propTypes = {
  classes: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
}

export default withStyles(styles)(FolderHierarchy);