import { Button, Paper, Tab, Tabs } from "@mui/material";
import { withStyles } from "@mui/styles";
import { useState } from "react";

const styles = {
  root: {
    padding: 8,
    marginBottom: 24,
  },
  tab: {
    padding: 4,
    minWidth: 60,
    textTransform: 'none',
  },
  tabs: {
    marginBottom: 8,
  },
}

const Toolbar = ({ classes, children }) => {
  const [tab, setTab] = useState(0);

  const handleTab = (e, newVal) => setTab(newVal);

  return ( <>
    <Tabs value={tab} onChange={handleTab} className={classes.tabs}>
      <Tab className={classes.tab} label="Start" />
      <Tab className={classes.tab} label="Help" />
    </Tabs>
    <Paper className={classes.root}>
      {tab === 0 && children}
      {tab === 1 && <Button variant="outlined" color="secondary">Send help</Button>}
    </Paper>
  </>);
}

export default withStyles(styles)(Toolbar);