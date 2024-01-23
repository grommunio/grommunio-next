import { ChangeEvent, SetStateAction, useEffect, useRef, useState } from "react";
import {
  Button,
  DialogContent,
  TextField,
  InputAdornment,
  Switch,
  MenuItem,
  FormControlLabel,
  IconButton,
  ClickAwayListener,
} from "@mui/material";
import LocationOn from "@mui/icons-material/LocationOn";
import Notes from "@mui/icons-material/Notes";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Create from "@mui/icons-material/Create";
import { styled } from "@mui/material/styles";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Skypeicon } from "../svgicon";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Tooltip from "@mui/material/Tooltip";
import { Editor } from "@tinymce/tinymce-react";
import "react-quill/dist/quill.snow.css";
import { withStyles } from '@mui/styles';
import { Close, FiberManualRecord, Repeat } from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { postEventData } from "../../../actions/calendar";
import { gabSelectionToRequestFormat, purify } from "../../../utils";
import { useAppContext } from "../../../azure/AppContext";
import AttendeeAutocomplete from "../../AttendeeAutocomplete";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { Event } from "microsoft-graph";
import moment, { Moment } from "moment";
import { SchedulerHelpers } from "@aldabil/react-scheduler/types";
import RecurrenceDialog from "./RecurrenceDialog";

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 38,
  height: 20,
  padding: 0,
  display: "flex",
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 15,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(9px)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(20px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" && "#177ddc",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 15,
    height: 15,
    borderRadius: 6,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,.35)"
        : "rgba(0,0,0,.25)",
    boxSizing: "border-box",
  },
}));

const styles = {
  root: {
    padding: 16,
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  body: {
    display: 'flex',
    marginTop: 16,
  },
  datesContainer: {
    display: 'flex',
    marginTop: 8,
    marginBottom: 8,
  },
  flexEnd: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
  }
}

type NewEvent = Event & {
  start?: Moment;
  end?: Moment;
  location?: string;
}

type AddEventT = {
  classes: any;
  scheduler: SchedulerHelpers;
}

const AddEvent = ({ classes, scheduler }: AddEventT) => {
  const editorRef = useRef<any>();
  const [event, setEvent] = useState<NewEvent>({});
  const { calendars } = useTypeSelector(state => state.calendar);
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const dispatch = useTypeDispatch();
  const app = useAppContext();
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const { contacts } = useTypeSelector(state => state.contacts);
  const [dirty, setDirty]= useState(false);
  const [recurrenceDialog, setRecurrenceDialog] = useState(false);

  useEffect(() => {
    const { start } = scheduler.state as any;
    setEvent({
      start: moment(start.value),
      end: moment(start.value).add(30, 'minutes'),
      // TODO: Implement recurrence
    });
  }, [scheduler]);

  useEffect(() => {
    if(!selectedCalendar) {
      setSelectedCalendar(calendars[0]?.id || "");
    }
  }, [calendars]);

  const formatEventForRequest = (): Event => { 
    const { start, end, location } = event;
    return {
      ...event,
      attendees: gabSelectionToRequestFormat(selectedAttendees) || [],
      start: {
        timeZone: app.user?.timeZone,
        dateTime: start?.toISOString()
      },
      end: {
        timeZone: app.user?.timeZone,
        dateTime: end?.toISOString()
      },
      location: location ? {
        displayName: location,
      } : null,
      body: {
        contentType: 'html',
        content: editorRef.current ? purify(editorRef.current.getContent()) : '',
      }
    };
  }

  const handleCalendarChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedCalendar(e.target.value);
  }

  const handleInput = (field: string, value: any) => {
    setEvent({
      ...event,
      [field]: value,
    });
    if(!dirty) setDirty(true);
  };

  const handleSwitch = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setEvent({
      ...event,
      [field]: e.target.checked,
    });
    if(!dirty) setDirty(true);
  };

  const textEditorProps = (field: string) => ({
    onChange: (e: ChangeEvent<HTMLInputElement>) => handleInput(field, e.target.value),
    value: event[field as keyof NewEvent] || "",
    className: classes.textField,
  });

  const handleDateChange = (field: string) => (newVal: any) => {
    setEvent({
      ...event,
      [field]: newVal,
    });
    if(!dirty) setDirty(true);
  }

  const handleAdd = () => {
    const data = formatEventForRequest();
    dispatch(postEventData(data, selectedCalendar))
      .then(scheduler.close);
  }

  const handleAutocomplete = (e: ChangeEvent<HTMLInputElement>, newVal: SetStateAction<never[]>) => {
    setSelectedAttendees(newVal);
    if(!dirty) setDirty(true);
  }

  const handleContactRemove = (index: number) => () => {
    const copy = [...selectedAttendees];
    copy.splice(index, 1);
    setSelectedAttendees(copy);
  }

  const handleRecurrence = (open: boolean) => () => {
    setRecurrenceDialog(open);
  }

  return <ClickAwayListener onClickAway={scheduler.close}>
    <div className={classes.root}>
      <div className={classes.flexRow}>
        <div className={classes.flexRow}>
          <div>
            <Button
              variant="contained"
              className={classes.button}
              style={{ marginLeft: "16px" }}
              onClick={handleAdd}
              disabled={!dirty}
            >
              {selectedAttendees.length === 0 ? "Create" : "Send"}
            </Button>
          </div>
          <TextField
            color="primary"
            select
            label="Calendar"
            onChange={handleCalendarChange}
            value={selectedCalendar}
            variant="standard"
            style={{ marginLeft: "16px", minWidth: 120 }}
            InputProps={{
              startAdornment: <FiberManualRecord fontSize="small" style={{ marginRight: 8 }}/>
            }}
          >
            {calendars.map((cal, key) => 
              <MenuItem value={cal.id} key={key}>{cal.name}</MenuItem>
            )}
          </TextField>
        </div>
        <div className={classes.flexEnd}>
          <IconButton onClick={scheduler.close}>
            <Close />
          </IconButton>
        </div>
      </div>
      <DialogContent style={{ paddingBottom: "20px" }}>
        <div className={classes.content}>
          <div className={classes.flexRow}>
            <Create className={classes.icon} color="action" />
            <TextField
              {...textEditorProps("subject")}
              variant="standard"
              label="Subject"
              fullWidth
              autoFocus
            />
          </div>
          <div className={classes.flexRow}>
            <PersonAddAltIcon className={classes.icon} color="action" />
            <AttendeeAutocomplete
              value={selectedAttendees}
              onChange={handleAutocomplete}
              options={contacts}
              handleContactRemove={handleContactRemove}
              textfieldProps={{
                variant: "standard",
                label: "Attendees"
              }}
            />
          </div>
          <div className={classes.datesContainer}>
            <CalendarToday className={classes.icon} color="action" />
            <div>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <div className={classes.flexRow}>
                  <DatePicker value={event.start || null} onChange={handleDateChange("start")}/>
                  {!event.isAllDay && <TimePicker
                    value={event.start || ""}
                    onChange={handleDateChange("start")}
                  />}
                  <FormControlLabel
                    control={<Switch
                      value={event.isAllDay}
                      checked={event.isAllDay || false}
                      onChange={handleSwitch("isAllDay")}
                    />}
                    style={{ marginLeft: 8 }}
                    label="All day"
                  />
                </div>
                <div className={classes.flexRow}>
                  <DatePicker value={event.end || ""} onChange={handleDateChange("end")}/>
                  {!event.isAllDay && <TimePicker
                    value={event.end || ""}
                    onChange={handleDateChange("end")}
                  />}
                  <Button
                    onClick={handleRecurrence(true)}
                    startIcon={<Repeat />}
                    variant="outlined"
                    size="large"
                  >
                    Repeat
                  </Button>
                </div>
              </LocalizationProvider>
            </div>
          </div>
          <div className={classes.flexRow}>
            <LocationOn className={classes.icon} color="action" />
            <TextField
              {...textEditorProps("location")}
              variant="standard"
              fullWidth
              label="Location"
              InputProps={{
                endAdornment: (
                  <Tooltip
                    title="This will be turn on automatically once you add an attende"
                    arrow
                    placement="top"
                  >
                    <InputAdornment
                      position="end"
                      style={{ display: "flex", gap: "10px" }}
                    >
                      <AntSwitch
                        inputProps={{ "aria-label": "ant design" }}
                      />
                      <i
                        data-icon-name="IcFluentOfficeSkypeColor"
                        aria-hidden="true"
                      >
                        <Skypeicon />
                      </i>
                      <p className="ms-Label wj3t5 root-473">
                        Skype meeting
                      </p>
                    </InputAdornment>
                  </Tooltip>
                ),
              }}
            />
          </div>
          <div className={classes.body}>
            <Notes className={classes.icon} color="action" />
            <Editor
              tinymceScriptSrc={
                process.env.PUBLIC_URL + "/tinymce/tinymce.min.js"
              }
              initialValue={event.body as string || ""}
              init={{
                menubar: false,
                readonly: true,
                toolbar: true,
                plugins: ["wordcount"],
              }}
              onInit={(evt, editor) => editorRef.current = editor}
            />
          </div>
        </div>
      </DialogContent>
      <RecurrenceDialog
        open={recurrenceDialog}
        handleClose={handleRecurrence(false)}
        setEvent={setEvent}
      />
    </div>
  </ClickAwayListener>
}

export default withStyles(styles)(AddEvent);
