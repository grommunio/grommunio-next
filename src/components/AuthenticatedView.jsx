import { AuthenticatedTemplate } from "@azure/msal-react";
import { Typography } from "@mui/material";
import { withStyles } from '@mui/styles';
import { withTranslation } from "react-i18next";

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 16,
    overflow: 'auto',
  },
  header: {
    margin: 8,
  },
  actions: {
    marginLeft: 8,
  },
}

function AuthenticatedView({
  classes, children, header, actions=[]
}) {

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant="h4" className={classes.header}>{header || ''}</Typography>
        <div className={classes.actions}>
          {actions}
        </div>
        {children}
      </div>
    </AuthenticatedTemplate>
  );
}

export default withTranslation()(withStyles(styles)(AuthenticatedView));