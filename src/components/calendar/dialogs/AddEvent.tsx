import { ChangeEvent, MouseEvent, SetStateAction, useEffect, useRef, useState } from "react";
import {
  Button,
  TextField,
  InputAdornment,
  Switch,
  MenuItem,
  FormControlLabel,
  IconButton,
  ClickAwayListener,
  Paper,
  ListItemIcon,
  Typography,
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
import { AccessAlarm, AttachFile, Check, Close, EventNote, FiberManualRecord, Repeat, Tune } from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { postEventAttachments, postEventData } from "../../../actions/calendar";
import { gabSelectionToRequestFormat, purify } from "../../../utils";
import { useAppContext } from "../../../azure/AppContext";
import AttendeeAutocomplete from "../../AttendeeAutocomplete";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { Event } from "microsoft-graph";
import moment from "moment";
import { SchedulerHelpers } from "@aldabil/react-scheduler/types";
import RecurrenceDialog from "./RecurrenceDialog";
import { NewEvent } from "../../../types/calendar";
import { FREEBUSY_TYPES, REMINDER_OPTIONS } from "../../../constants";

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
  },
  topbar: {
    display: 'flex',
    flex: 1,
    padding: 4,
    marginBottom: 16,
  },
  attachments: {
    marginLeft: 42,
    display: 'flex',
    alignItems: 'center',
  }
}

type AddEventT = {
  classes: any;
  scheduler: SchedulerHelpers;
}

const AddEvent = ({ classes, scheduler }: AddEventT) => {
  const editorRef = useRef<any>();
  const [event, setEvent] = useState<NewEvent>({
    showAs: "free",
    responseRequested: true,
    hideAttendees: false,
  });
  const { calendars } = useTypeSelector(state => state.calendar);
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const dispatch = useTypeDispatch();
  const app = useAppContext();
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const { contacts } = useTypeSelector(state => state.contacts);
  const [dirty, setDirty]= useState(false);
  const [recurrenceDialog, setRecurrenceDialog] = useState(false);
  const [reminder, setReminder] = useState("15");
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList>();

  // handles file upload
  const handleUploadConfirm = (e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files) setFiles(e.target.files);
  };

  const handleUpload = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  useEffect(() => {
    const { start } = scheduler.state as any;
    setEvent({
      ...event,
      start: moment(start.value),
      end: moment(start.value).add(30, 'minutes'),
    });
  }, [scheduler]);

  useEffect(() => {
    if(!selectedCalendar) {
      setSelectedCalendar(calendars[0]?.id || "");
    }
  }, [calendars]);

  const formatEventForRequest = (): Event => { 
    const { start, end, location } = event;
    const reminderTime = parseInt(reminder);
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
      },
      reminderMinutesBeforeStart: reminderTime !== -1 ? reminderTime : 0,
      isReminderOn: reminderTime !== -1,
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
      end: field === "start" && newVal.isAfter(event.end) ? newVal.clone().add(30, "minutes") : event.end,
    });
    if(!dirty) setDirty(true);
  }

  const handleAdd = () => {
    const data = formatEventForRequest();
    dispatch(postEventData(data, selectedCalendar))
      .then(async event => {
        if(files?.length) await dispatch(postEventAttachments(event, files));
        scheduler.close()
      });
    if(inputRef.current) inputRef.current.value = "";
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

  const handleReminder = (e: ChangeEvent<HTMLInputElement>) => {
    setReminder(e.target.value);
  }

  const handlePropToggle = (field: keyof Event) => () => {
    setEvent({
      ...event,
      [field]: !event[field],
    })
  }

  const recurrenceType = event.recurrence?.pattern?.type;
  return <ClickAwayListener onClickAway={scheduler.close}>
    <div className={classes.root}>
      <Paper className={classes.topbar}>
        <TextField
          select
          InputProps={{
            startAdornment: (<InputAdornment position="start">
              <Tune />
            </InputAdornment>),
          }}
          SelectProps={{
            MenuProps: {
              disablePortal: true,
            },
          }}
          style={{ width: 208, marginRight: 8 }}
          size="small"
          label="Response options"
          InputLabelProps={{
            shrink: false,
            style: { marginLeft: 32 }
          }}
        >
          <MenuItem
            onClick={handlePropToggle("responseRequested")}
          >
            <ListItemIcon>
              {Boolean(event.responseRequested) && <Check />}
            </ListItemIcon>
            Request responses
          </MenuItem>
          <MenuItem
            onClick={handlePropToggle("hideAttendees")}
          >
            <ListItemIcon>
              {Boolean(event.hideAttendees) && <Check />}
            </ListItemIcon>
            Hide attendee list
          </MenuItem>
        </TextField>
        <TextField
          select
          InputProps={{
            startAdornment: (<InputAdornment position="start">
              <AccessAlarm />
            </InputAdornment>),
          }}
          onChange={handleReminder}
          SelectProps={{
            MenuProps: {
              disablePortal: true,
            },
          }}
          value={reminder}
          style={{ width: 200 }}
          size="small"
        >
          {REMINDER_OPTIONS.map(option =>
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          )}
        </TextField>
        <TextField
          select
          InputProps={{
            startAdornment: (<InputAdornment position="start">
              <EventNote />
            </InputAdornment>),
          }}
          SelectProps={{
            MenuProps: {
              disablePortal: true,
            },
          }}
          {...textEditorProps("showAs")}
          style={{ width: 200, marginLeft: 8 }}
          size="small"
        >
          {FREEBUSY_TYPES.map(option =>
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          )}
        </TextField>
      </Paper>
      <div className={classes.flexRow}>
        <div className={classes.flexRow}>
          <div>
            <Button
              variant="contained"
              className={classes.button}
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
                  style={{ marginLeft: 8 }}
                >
                  {recurrenceType ? (recurrenceType?.includes("absolute") ? recurrenceType.slice(7) :
                    recurrenceType?.includes("relative") ? recurrenceType.slice(8) : recurrenceType) :
                    "Don't repeat"}
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
                  title="This will be turned on automatically once you add an attendee"
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
        <div className={classes.attachments}>
          <IconButton onClick={handleUpload}>
            <AttachFile />
          </IconButton>
          <Typography>{Array.from(files || []).map(file => file.name).join(", ")}</Typography>
        </div>
      </div>
      <RecurrenceDialog
        open={recurrenceDialog}
        handleClose={handleRecurrence(false)}
        event={event}
        setEvent={setEvent}
      />
      <input
        accept={"application/pdf"}
        hidden
        type="file"
        multiple
        ref={inputRef}
        onChange={handleUploadConfirm}
      />
    </div>
  </ClickAwayListener>
}

export default withStyles(styles)(AddEvent);
