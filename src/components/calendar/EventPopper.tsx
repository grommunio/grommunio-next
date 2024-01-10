import { Divider, IconButton, Paper, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { toReadableTimeInTimezone } from "../../utils";
import { ExtendedEvent } from "../../types/calendar";
import { LocationOn, OpenInFull, Schedule } from "@mui/icons-material";


const styles = {
  root: {
    padding: 16,
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  spaceBetween: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'space-between',
    paddingTop: 8,
  }
};

type EventPopperT = {
  classes: any,
  event: ExtendedEvent;
  onClose?: () => void;
  handleDialog: (event: ExtendedEvent | null) => () => void;
}

const EventPopper = ({ classes, event, handleDialog }: EventPopperT) => {
  const { subject, startDate, endDate, location } = event;

  return <Paper className={classes.root}>
    <div>
      <div className={classes.spaceBetween}>
        <Typography variant="h6">{subject}</Typography>
        <IconButton onClick={handleDialog(event)}>
          <OpenInFull fontSize="small"/>
        </IconButton>
      </div>
      <Divider />
      <div className={classes.flexRow}>
        <Schedule style={{ marginRight: 8 }}/>
        <Typography>
          {toReadableTimeInTimezone(startDate)} - {toReadableTimeInTimezone(endDate)}
        </Typography>
      </div>
      {location?.displayName && <div className={classes.flexRow}>
        <LocationOn style={{ marginRight: 8 }}/>
        <Typography>
          {location.displayName}
        </Typography>
      </div>}
    </div>
  </Paper>;
}

export default withStyles(styles)(EventPopper);
