import { Button, Input, MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { copyMessage } from "../../../api/messages";
import { useAppContext } from "../../../azure/AppContext";
import { withTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMailFolderData } from "../../../actions/folders";

const CopyMailMenuItem = ({ t, openedMail }) => {
  const app = useAppContext();
  const dispatch = useDispatch();
  const [newFolder, setNewFolder] = useState("");
  const [showingAll, setShowingAll] = useState(false);
  const mailFolders = useSelector(state => state.messages.mailFolders);

  const handleCopy = destinationId => () => {
    copyMessage(
      app.authProvider,
      openedMail.id,
      destinationId,
    );
  }

  const handleCreate = async () => {
    const res = await dispatch(postMailFolderData({app, folder: { displayName: newFolder }}));
    if(!res.error) {
      copyMessage(
        app.authProvider,
        openedMail.id,
        res.payload.id,
      );
      setNewFolder("");
    } else {
      /* TODO: Implement feedback snackbar */
      console.log(res.payload);
    }
  }

  return <NestedMenuItem
    label={t("Copy")}
  >
    {showingAll ? mailFolders.map((mailFolder, idx) => 
      <MenuItem key={idx} onClick={handleCopy(mailFolder.id)}>{mailFolder.displayName || ""}</MenuItem>
    ) : <>
      <MenuItem onClick={handleCopy("inbox")}>{t("Inbox")}</MenuItem>
      <MenuItem onClick={handleCopy("deletedItems")}>{t("Deleted items")}</MenuItem>
      <MenuItem onClick={handleCopy("archive")}>{t("Archive")}</MenuItem>
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