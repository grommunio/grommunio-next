import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import NestedMenuItem from "../../menu/NestedMenuItem";
import { withTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { patchMessageData } from "../../../actions/messages";
import { Add, Check, Sell } from "@mui/icons-material";
import { getMessageCategoryColor } from "../../../utils";
import { useState } from "react";


const CategorizeMailMenuItem = ({ t, openedMail, handleAddCategory }) => {
  const dispatch = useDispatch();
  const [mail, setMail] = useState(openedMail);
  const { categories } = useSelector(state => state.messages);

  const handleCategorize = cat => () => {
    const copy = [...mail.categories];
    if(copy.includes(cat)) {
      copy.splice(copy.findIndex(c => c.displayName === cat), 1);
    } else {
      copy.push(cat);
    }

    setMail({...mail, categories: copy });

    dispatch(patchMessageData(
      mail,
      {
        categories: copy,
      },
    ));
  }

  return <NestedMenuItem
    label={t("Categorize")}
  >
    {categories.map(({ displayName, color }, key) =>
      <MenuItem
        key={key}
        onClick={handleCategorize(displayName)}
      >
        <ListItemIcon>
          <Sell color="inherit" style={{ color: getMessageCategoryColor(color) }} /* TODO: Parse proper color */ />
        </ListItemIcon>
        <ListItemText>{displayName}</ListItemText>
        {mail.categories.includes(displayName) && <Check fontSize="small"/>}
      </MenuItem>
    )}
    <MenuItem onClick={handleAddCategory(true)}>
      <ListItemIcon><Add /></ListItemIcon>
      <ListItemText>{t("New category")}</ListItemText>
    </MenuItem>
  </NestedMenuItem>;
}

export default withTranslation()(CategorizeMailMenuItem);