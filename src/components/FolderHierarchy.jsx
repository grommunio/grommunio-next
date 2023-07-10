// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import { Badge, Button, Input, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { DRAWER_WIDTH } from '../constants';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { postMailFolderData } from '../actions/folders';

const styles = theme => ({
  root: {
    width: DRAWER_WIDTH,
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
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [adding, setAdding] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const handleNewFolder = parentFolderId => e => {
    e.stopPropagation();
    setAdding(parentFolderId);
  }

  const handleCreate = async () => {
    const data = await dispatch(postMailFolderData({ displayName: newFolder }, adding));
    if(data?.id) {
      // TODO: Add folder to tree
      setAdding("");
      setNewFolder("");
    }
  }

  const renderTree = (folders, parentFolderId) => <>
    {folders.map(({ id, displayName, childFolders, childFolderCount, unreadItemCount }) => 
      <TreeItem
        key={id || -1}
        nodeId={id || "-1"}
        label={<div className={classes.treeItemLabel}>
          <Typography variant='body1'>{displayName}</Typography>
          <Badge
            badgeContent={unreadItemCount}
            color="primary"
          >
            <div style={{width: 16, height: 12}}></div>
          </Badge>
        </div>}
        onClick={handleMailFolderClick({id})}
      >
        {childFolderCount
          ? renderTree(childFolders, id)
          : null}
      </TreeItem>
    )}
    <TreeItem
      onKeyDown={e => e.stopPropagation()}
      nodeId={`${parentFolderId}-button`}
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

  return (
    <TreeView
      selected={selected?.id || "-1"}
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {data.length !== 0 && renderTree(data, 0, 0)}
    </TreeView>
  );
}

FolderHierarchy.propTypes = {
  classes: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
}

export default withStyles(styles)(FolderHierarchy);