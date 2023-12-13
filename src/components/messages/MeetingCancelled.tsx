import { AccessTime, CalendarToday, EventBusy } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { EventMessage } from "microsoft-graph"
import { toReadableTimeInTimezone } from "../../utils";
import { useTranslation } from "react-i18next";
import { useTypeDispatch } from "../../store";
import { getEventFromEventMessage } from "../../api/calendar";
import { deleteEventData } from "../../actions/calendar";
import { moveMessageData } from "../../actions/messages";

const styles = (theme: any): any => ({
  root: {
    marginBottom: 16,
    border: '1px solid grey',
  },
  info: {
    padding: 12,
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  reply: {
    padding: 12,
    backgroundColor: theme.palette.mode === "dark" ? "#1f1f1f" : "#ddd",
  },
  button: {
    marginTop: 8,
    marginRight: 8,
  }
});

type MeetingInfoProps = {
  classes: any,
  message: EventMessage;
}

const MeetingCancelled = ({ classes, message }: MeetingInfoProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();

  const handleDeleteEvent = async () => {
    const details: EventMessage = await getEventFromEventMessage(message.id || "");
    const success = await dispatch(deleteEventData(details.event?.id || ""));

    if (success) {
      await dispatch(moveMessageData([message], "deletedItems"));
    }
  }
 
  return <div className={classes.root}>
    <div className={classes.info}>
      <div className={classes.flexRow}>
        <CalendarToday fontSize="small" className={classes.icon}/>
        <Typography>{message.subject}</Typography>
      </div>
      <div className={classes.flexRow}>
        <AccessTime fontSize="small" className={classes.icon}/>
        <Typography>
          <s>{toReadableTimeInTimezone(message.startDateTime)} - {toReadableTimeInTimezone(message.endDateTime)}</s>
        </Typography>
      </div>
    </div>
    <div className={classes.reply}>
      <div className={classes.flexRow}>
        <Button
          startIcon={<EventBusy />}
          variant="outlined"
          onClick={handleDeleteEvent}
        >
          {t("Remove from calendar")}
        </Button>
      </div>
    </div>
  </div>
}

export default withStyles(styles)(MeetingCancelled);
