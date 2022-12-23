import { AuthenticatedTemplate } from "@azure/msal-react";
import Drawer from "./Drawer";
import { withStyles } from '@mui/styles';

const styles = {
  root: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    zIndex: 100,
  },
}

function AuthenticatedView({
  classes,
  rootClass=undefined,
  drawerProps={},
  children,
}) {

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Drawer {...drawerProps}/>
        <div className={rootClass}>
          {children}
        </div>
      </div>
    </AuthenticatedTemplate>
  );
}

export default withStyles(styles)(AuthenticatedView);