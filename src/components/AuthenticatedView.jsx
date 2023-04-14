import { AuthenticatedTemplate } from "@azure/msal-react";
import { Paper } from "@mui/material";
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
    padding: 8,
    marginBottom: 24,
  },
}

function AuthenticatedView({
  classes, children, actions=[]
}) {

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Paper className={classes.actions}>
          {actions}
        </Paper>
        {children}
      </div>
    </AuthenticatedTemplate>
  );
}

export default withTranslation()(withStyles(styles)(AuthenticatedView));