import { MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { copyMessage } from "../../../api/messages";
import { useAppContext } from "../../../azure/AppContext";
import { withTranslation } from "react-i18next";

const CopyMailMenuItem = ({ t, openedMail }) => {
  const app = useAppContext();

  const handleCopy = destinationId => () => {
    copyMessage(
      app.authProvider,
      openedMail.id,
      destinationId,
    );
  }

  return <NestedMenuItem
    label={t("Copy")}
  >
    <MenuItem onClick={handleCopy("inbox")}>{t("Inbox")}</MenuItem>
    <MenuItem onClick={handleCopy("deletedItems")}>{t("Deleted items")}</MenuItem>
    <MenuItem onClick={handleCopy("archive")}>{t("Archive")}</MenuItem>
  </NestedMenuItem>;
}

export default withTranslation()(CopyMailMenuItem);