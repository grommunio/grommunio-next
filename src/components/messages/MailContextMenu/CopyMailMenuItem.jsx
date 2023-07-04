// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Button, Input, ListItemIcon, MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { withTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMailFolderData } from "../../../actions/folders";
import { Archive, DeleteOutline, Folder, Inbox } from "@mui/icons-material";
import { copyMessageData } from "../../../actions/messages";


const CopyMailMenuItem = ({ t, openedMail }) => {
  const dispatch = useDispatch();
  const [newFolder, setNewFolder] = useState("");
  const [showingAll, setShowingAll] = useState(false);
  const mailFolders = useSelector(state => state.folders.mailFolders);

  const handleCopy = destinationId => () => {
    dispatch(copyMessageData(
      openedMail.id,
      destinationId,
    ));
  }

  const handleCreate = async () => {
    const data = await dispatch(postMailFolderData({ displayName: newFolder }));
    if(data?.payload) {
      dispatch(copyMessageData(
        openedMail.id,
        data.payload.id,
      ));
      setNewFolder("");
    }
  }

  return <NestedMenuItem
    label={t("Copy")}
  >
    {showingAll ? mailFolders.map((mailFolder, idx) => 
      <MenuItem key={idx} onClick={handleCopy(mailFolder.id)}>
        <ListItemIcon><Folder fontSize="small"/></ListItemIcon>
        {mailFolder.displayName || ""}
      </MenuItem>
    ) : <>
      <MenuItem onClick={handleCopy("inbox")}>
        <ListItemIcon><Inbox fontSize="small"/></ListItemIcon>
        {t("Inbox")}
      </MenuItem>
      <MenuItem onClick={handleCopy("deletedItems")}>
        <ListItemIcon><DeleteOutline fontSize="small"/></ListItemIcon>
        {t("Deleted items")}
      </MenuItem>
      <MenuItem onClick={handleCopy("archive")}>
        <ListItemIcon><Archive fontSize="small"/></ListItemIcon>
        {t("Archive")}
      </MenuItem>
    </>}
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
    {!showingAll && /* This is intentional. (copied from outlook live) */
      <MenuItem onClick={() => setShowingAll(true)}>
        {t("Other")}...
      </MenuItem>}
  </NestedMenuItem>;
}

export default withTranslation()(CopyMailMenuItem);