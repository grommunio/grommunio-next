import { withTranslation } from 'react-i18next';
import { Menu, MenuItem} from '@mui/material';
import { deleteMessageData, moveMessageData } from '../../actions/messages';
import { useAppContext } from '../../azure/AppContext';
import { useDispatch } from 'react-redux';

// TODO: These actions are duplicated in the actionbar. Use a hook or HOC to deduplicate functions
const MailContextMenu = ({ t, isOpen, onClose, anchorPosition, openedMail, folder }) => {
  const app = useAppContext();
  const dispatch = useDispatch();

  const handleMailDelete = () => {
    // TODO: Close contextmenu after successful delete
    dispatch(deleteMessageData({
      app,
      messages: [openedMail],
      // TODO: This does not work. Find way to convert non-english displayname
      force: folder?.displayname == "Deleted items"
    }));
  }

  const handleMailMove = destinationId => () => {
    dispatch(moveMessageData({
      app,
      messages: [openedMail],
      destinationId,
    }));
  }

  return (
    <Menu
      open={isOpen}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
    >
      <MenuItem onClick={handleMailDelete}>{t("Delete")}</MenuItem>
      <MenuItem onClick={handleMailMove("archive")}>{t("Archive")}</MenuItem>
    </Menu>
  );
};

export default withTranslation()(MailContextMenu);
