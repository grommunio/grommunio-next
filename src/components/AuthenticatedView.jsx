import { AuthenticatedTemplate } from "@azure/msal-react";
import { withStyles } from '@mui/styles';
import { withTranslation } from "react-i18next";
import Toolbar from "./Toolbar";

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: "0px 16px 16px 16px",
    overflow: 'auto',
  },
}

function AuthenticatedView({
  classes, children, actions=[]
}) {

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Toolbar>{actions}</Toolbar>
        {children}
      </div>
    </AuthenticatedTemplate>
  );
}

export default withTranslation()(withStyles(styles)(AuthenticatedView));