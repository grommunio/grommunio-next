// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Button, Input, ListItemIcon, MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { withTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMailFolderData } from "../../../actions/folders";
import { moveMessageData } from "../../../actions/messages";
import { Archive, DeleteOutline, Folder } from "@mui/icons-material";
import { pushAlertStack } from "../../../actions/alerts";

const MoveMailMenuItem = ({ t, openedMail }) => {
  const dispatch = useDispatch();
  const [newFolder, setNewFolder] = useState("");
  const [showingAll, setShowingAll] = useState(false);
  const mailFolders = useSelector(state => state.folders.mailFolders);

  const handleCopy = destinationId => () => {
    dispatch(moveMessageData(
      [openedMail],
      destinationId,
    ));
  }

  const handleCreate = async () => {
    const res = await dispatch(postMailFolderData({ displayName: newFolder }));
    if(!res.error) {
      dispatch(moveMessageData(
        [openedMail],
        res.payload.id,
      ));
      setNewFolder("");
    } else {
      dispatch(pushAlertStack({ message: res.payload, severity: "error" }));
    }
  }

  return <NestedMenuItem
    label={t("Move")}
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
        placeholder="New folder"
      />
    </MenuItem>
    {showingAll ? mailFolders.map((mailFolder, idx) => 
      <MenuItem key={idx} onClick={handleCopy(mailFolder.id)}>
        <ListItemIcon><Folder fontSize="small"/></ListItemIcon>
        {mailFolder.displayName || ""}
      </MenuItem>
    ) : <>
      <MenuItem onClick={handleCopy("deletedItems")}>
        <ListItemIcon><DeleteOutline fontSize="small"/></ListItemIcon>
        {t("Deleted items")}
      </MenuItem>
      <MenuItem onClick={handleCopy("archive")}>
        <ListItemIcon><Archive fontSize="small"/></ListItemIcon>
        {t("Archive")}
      </MenuItem>
    </>}
    {!showingAll && /* This is intentional. (copied from outlook live) */
      <MenuItem onClick={() => setShowingAll(true)}>
        {t("Other")}...
      </MenuItem>}
  </NestedMenuItem>;
}

export default withTranslation()(MoveMailMenuItem);