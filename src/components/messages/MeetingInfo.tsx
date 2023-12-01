import { AccessTime, CalendarToday, Check, Close, QuestionMark, Reply } from "@mui/icons-material";
import { Button, TextField, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { EventMessage } from "microsoft-graph"
import { toReadableTimeInTimezone } from "../../utils";
import { useTranslation } from "react-i18next";
import { useTypeDispatch } from "../../store";
import { acceptEventMessage } from "../../actions/calendar";
import { getEventFromEventMessage } from "../../api/calendar";

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
  responseContainer: {
    marginTop: 16,
    marginLeft: 36,
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

const MeetingInfo = ({ classes, message }: MeetingInfoProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();

  const handleYes = async () => {
    const details: EventMessage = await getEventFromEventMessage(message.id || "");
    dispatch(acceptEventMessage(details.event?.id || ""));
  }

 
  return <div className={classes.root}>
    <div className={classes.info}>
      <div className={classes.flexRow}>
        <CalendarToday fontSize="small" className={classes.icon}/>
        <Typography>{message.subject}</Typography>
      </div>
      <div className={classes.flexRow}>
        <AccessTime fontSize="small" className={classes.icon}/>
        <Typography>{toReadableTimeInTimezone(message.startDateTime)} - {toReadableTimeInTimezone(message.endDateTime)}</Typography>
      </div>
    </div>
    <div className={classes.reply}>
      <div className={classes.flexRow}>
        <Reply fontSize="small" className={classes.icon} />
        <Typography>{t("Reply to this event")}</Typography>
      </div>
      <div className={classes.responseContainer}>
        <TextField
          placeholder={t("Answer") || ""}
          fullWidth
          variant="standard"
          multiline
          minRows={2}
        />
        <div className={classes.flexRow}>
          <Button
            className={classes.button}
            variant="outlined"
            startIcon={<Check color="success" />}
            color="inherit"
            onClick={handleYes}
          >
            Yes
          </Button>
          <Button
            className={classes.button}
            variant="outlined"
            startIcon={<QuestionMark color="info" />}
            color="inherit"
            //onClick={handleCow}
          >
            Perhaps
          </Button>
          <Button
            className={classes.button}
            variant="outlined"
            startIcon={<Close color="error" />}
            color="inherit"
          >
            No
          </Button>
        </div>
      </div>
    </div>
  </div>
}

export default withStyles(styles)(MeetingInfo);
