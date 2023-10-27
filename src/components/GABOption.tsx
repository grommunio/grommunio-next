import { AccountCircle } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Contact, EmailAddress } from "microsoft-graph";

type GABOption = {
  contact: Contact,
  childProps: any,
}

const GABOption = ({ contact, ...childProps }: GABOption) => {
  return <ListItem
    disablePadding
    {...childProps}
  >
    <ListItemIcon>
      <AccountCircle/>
    </ListItemIcon>
    <ListItemText
      primary={contact.displayName}
      secondary={contact.emailAddresses?.map((o: EmailAddress) => o.address).join(', ')}
    />
  </ListItem>;
}

export default GABOption;
