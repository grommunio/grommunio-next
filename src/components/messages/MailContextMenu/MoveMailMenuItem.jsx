import { Button, Input, MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { useAppContext } from "../../../azure/AppContext";
import { withTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMailFolderData } from "../../../actions/folders";
import { moveMessageData } from "../../../actions/messages";

const MoveMailMenuItem = ({ t, openedMail }) => {
  const app = useAppContext();
  const dispatch = useDispatch();
  const [newFolder, setNewFolder] = useState("");
  const [showingAll, setShowingAll] = useState(false);
  const mailFolders = useSelector(state => state.messages.mailFolders);

  const handleCopy = destinationId => () => {
    dispatch(moveMessageData({
      app,
      messages: [openedMail],
      destinationId,
    }));
  }

  const handleCreate = async () => {
    const res = await dispatch(postMailFolderData({app, folder: { displayName: newFolder }}));
    console.log(res);
    if(!res.error) {
      dispatch(moveMessageData({
        app,
        messages: [openedMail],
        destinationId: res.payload.id,
      }));
      setNewFolder("");
    } else {
      /* TODO: Implement feedback snackbar */
      console.log(res.payload);
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
      <MenuItem key={idx} onClick={handleCopy(mailFolder.id)}>{mailFolder.displayName || ""}</MenuItem>
    ) : <>
      <MenuItem onClick={handleCopy("deletedItems")}>{t("Deleted items")}</MenuItem>
      <MenuItem onClick={handleCopy("archive")}>{t("Archive")}</MenuItem>
    </>}
    {!showingAll && /* This is intentional. (copied from outlook live) */
      <MenuItem onClick={() => setShowingAll(true)}>
        {t("Other")}...
      </MenuItem>}
  </NestedMenuItem>;
}

export default withTranslation()(MoveMailMenuItem);