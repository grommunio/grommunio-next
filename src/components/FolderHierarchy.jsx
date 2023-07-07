// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import PropTypes from 'prop-types';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import { Badge, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { DRAWER_WIDTH } from '../constants';

const styles = {
  root: {
    width: DRAWER_WIDTH,
  },
  treeItemLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: "6px 0px",
  },
};

const FolderHierarchy = ({classes, data, handleMailFolderClick, selected}) => {

  const renderTree = folders => folders.map(({ id, displayName, childFolders, childFolderCount, unreadItemCount }) => 
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
        ? renderTree(childFolders)
        : null}
    </TreeItem>
  );

  return (
    <TreeView
      selected={selected?.id || "-1"}
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {data.length !== 0 && renderTree(data)}
    </TreeView>
  );
}

FolderHierarchy.propTypes = {
  classes: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
}

export default withStyles(styles)(FolderHierarchy);