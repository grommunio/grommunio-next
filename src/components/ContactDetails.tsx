import { Mail } from "@mui/icons-material";
import { Avatar, Button, Divider, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { Contact } from "microsoft-graph";

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    flex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    margin: "16px 0",
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  mail: {
    textTransform: 'none',
    padding: 0,
  },
}

type ContactDetailsProps = {
  classes: any,
  contact?: Contact;
}

const ContactDetails = ({ contact, classes }: ContactDetailsProps) => {
  if(!contact) return null;
  return <div className={classes.root}>
    <div className={classes.header}>
      <Avatar sx={{ width: 80, height: 80, mr: 2 }}/>
      <div>
        <Typography variant="h5">{contact.displayName}</Typography>
        <Button size="small" startIcon={<Mail />}>Send mail</Button>
      </div>
    </div>
    <Divider className={classes.divider}/>
    <div className={classes.details}>
      <Typography variant="h6" sx={{ mb: 1 }}>Contact info</Typography>
      <div className={classes.flexRow}>
        <Mail sx={{ mr: 1 }}/>
        <div className={classes.details}>
          <Typography variant="caption">E-Mail</Typography>
          <Button className={classes.mail} color="primary">
            {contact.emailAddresses!.length > 0 && contact.emailAddresses![0].address}
          </Button>
        </div>
      </div>
    </div>
  </div>;
}

export default withStyles(styles)(ContactDetails);