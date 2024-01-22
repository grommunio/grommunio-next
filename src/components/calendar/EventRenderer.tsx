import { ProcessedEvent } from "@aldabil/react-scheduler/types";
import { withStyles } from "@mui/styles";
import { Typography } from "@mui/material";
import { ManageHistory, Repeat } from "@mui/icons-material";

type EventRendererT = {
  classes: any;
  event: ProcessedEvent;
}

const styles: any = (theme: any) => ({
  root: {
    display: "flex",
    height: "100%",
    backgroundColor: theme.palette.primary["500"],
  },
  border: {
    backgroundColor: theme.palette.primary["300"],
    height: '100%',
    width: 12,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    flex: 1,
    padding: 4,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  organizer: {
    wordWrap: "anywhere",
  }
});

const EventRenderer = ({ classes, event, ...props }: EventRendererT) => {

  console.log(event);

  return (
    <div className={classes.root}>
      <div className={classes.border}></div>
      <div
        className={classes.content}
        {...props}
      >
        <div className={classes.title}>
          <Typography>{event.subject}</Typography>
          {(event.type === "seriesMaster" || event.type === "occurrence") &&
            <Repeat />
          }
          {event.type === "exception" &&
            <ManageHistory fontSize="small"/>
          }
        </div>
        {event.location && <Typography variant="caption">{event.location.displayName}</Typography>}
        {event.organizer && <Typography variant="caption" className={classes.organizer}>
          {event.organizer.emailAddress?.address}
        </Typography>}
      </div>
    </div>
  );
}

export default withStyles(styles)(EventRenderer);