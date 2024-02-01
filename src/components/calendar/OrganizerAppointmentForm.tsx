import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  DialogContent,
  TextField,
  InputAdornment,
  Switch,
  MenuItem,
  FormControlLabel,
  IconButton,
  Grid,
  List,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Menu,
} from "@mui/material";
import LocationOn from "@mui/icons-material/LocationOn";
import Notes from "@mui/icons-material/Notes";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Create from "@mui/icons-material/Create";
import { styled } from "@mui/material/styles";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Skypeicon } from "./svgicon";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Tooltip from "@mui/material/Tooltip";
import { Editor } from "@tinymce/tinymce-react";
import "react-quill/dist/quill.snow.css";
import { withStyles } from '@mui/styles';
import { AccessAlarm, AttachFile, Check, Close, EventAvailable, EventBusy, EventNote, KeyboardArrowDown, Mic, PendingOutlined, QuestionMark, Tune } from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { deleteEventData, fetchEventAttachments, patchEventData, postEventAttachments } from "../../actions/calendar";
import { gabSelectionToRequestFormat, purify, utcTimeToUserTimezone } from "../../utils";
import { useAppContext } from "../../azure/AppContext";
import { useTypeDispatch, useTypeSelector } from "../../store";
import AttendeeAutocomplete from "../AttendeeAutocomplete";
import { FREEBUSY_TYPES, REMINDER_OPTIONS } from "../../constants";
import { Attachment, BodyType, Contact, DateTimeTimeZone, EmailAddress, Event, NullableOption, ResponseStatus } from "microsoft-graph";
import { ExtendedEvent } from "../../types/calendar";
import { Moment } from "moment";
import AttachmentItem from "../AttachmentItem";

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
    marginTop: 8,
    marginLeft: 24,
    display: 'flex',
    alignItems: 'center',
  },
}

type OrganizerAppointmentFormT = {
  classes: any;
  event: ExtendedEvent;
  onClose: () => void;
}

function getResponseStatusIcon(status: NullableOption<ResponseStatus>) {
  const response = status?.response || "";
  switch(response) {
  case "accepted":
    return <Tooltip title="Accepted"><EventAvailable /></Tooltip>;
  case "tentativelyAccepted":
    return <Tooltip title="Tentatively accepted"><QuestionMark /></Tooltip>;
  case "declined":
    return <Tooltip title="Declined"><EventBusy /></Tooltip>;
  default: return <Tooltip title="Pending"><PendingOutlined /></Tooltip>;
  }
}

type EventFormT = Event & {
  start?: Moment | null;
  end?: Moment | null;
  location?: string;
  body?: string;
}

const OrganizerAppointmentForm = ({ classes, event: storeEvent, onClose }: OrganizerAppointmentFormT) => {
  const editorRef = useRef<any>(null);
  const [event, setEvent] = useState<EventFormT>({});
  const { calendars } = useTypeSelector(state => state.calendar);
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const dispatch = useTypeDispatch();
  const app = useAppContext();
  const [selectedAttendees, setSelectedAttendees] = useState<Contact[]>([]);
  const { contacts } = useTypeSelector(state => state.contacts);
  const [reminder, setReminder] = useState("15");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // handles file upload
  const handleUploadConfirm = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(postEventAttachments(event, e.target.files || []));
    if(inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  useEffect(() => {
    const { id, seriesMasterId, subject, startDate, endDate, location, body, isAllDay, attendees, responseRequested,
      isReminderOn, reminderMinutesBeforeStart, hideAttendees, showAs } = storeEvent;
    setEvent({
      id,
      seriesMasterId,
      start: utcTimeToUserTimezone(startDate),
      end: utcTimeToUserTimezone(endDate),
      location: location?.displayName || "",
      body: body?.content || "",
      isAllDay: Boolean(isAllDay),
      responseRequested,
      hideAttendees,
      showAs,
      subject,
    });
    if(attendees) {
      /*const contactAttendees = attendees.value.reduce((prev, attendee) => {
        const contact = contacts.find(contact =>
          contact.emailAddresses.find(addr => addr.address === attendee.emailAddress.address));
        return contact ? [...prev, contact] : prev;
      }, []);*/

      const contactAttendees: Contact[] = attendees.map((attendee) => {
        const contact = contacts.find((contact: Contact) =>
          contact.emailAddresses?.find((addr: EmailAddress) => addr.address === attendee.emailAddress?.address));
        return contact || { displayName: attendee.emailAddress?.address };
      });
      setSelectedAttendees(contactAttendees);
    }
    // Reminder
    const reminder = isReminderOn ? reminderMinutesBeforeStart : -1;
    setReminder(reminder?.toString() || "15");

    // Fetch event attachments
    fetchAttachments(storeEvent);
  }, [storeEvent]);

  useEffect(() => {
    if(!selectedCalendar) {
      setSelectedCalendar(calendars[0]?.id || "");
    }
  }, [calendars]);

  const fetchAttachments = async (storeEvent: Event) => {
    setAttachments(await dispatch(fetchEventAttachments(storeEvent)));
  }

  const formatEventForRequest = (allEvents: boolean) => {
    const { start, end, location } = event;
    const reminderTime = parseInt(reminder);

    return {
      ...event,
      id: (allEvents ? event.seriesMasterId : event.id) || "",
      attendees: gabSelectionToRequestFormat(selectedAttendees) || [], // TODO: Implement non-contact mails
      start: {
        timeZone: app.user?.timeZone,
        dateTime: start?.toISOString() || "",
      },
      end: {
        timeZone: app.user?.timeZone,
        dateTime: end?.toISOString() || "",
      },
      location: location ? {
        displayName: location,
      } : undefined,
      body: {
        contentType: 'html' as BodyType,
        content: editorRef.current ? purify(editorRef.current.getContent()) : '',
      },
      reminderMinutesBeforeStart: reminderTime !== -1 ? reminderTime : 0,
      isReminderOn: reminderTime !== -1,
    };
  }

  const handleInput = (field: keyof EventFormT, value: string) => {
    setEvent({
      ...event,
      [field]: value,
    });
  };

  const handleSwitch = (field: keyof EventFormT) => (e: ChangeEvent<HTMLInputElement>) => {
    setEvent({
      ...event,
      [field]: e.target.checked,
    });
  };

  const textEditorProps = (field: keyof EventFormT) => ({
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInput(field, e.target.value),
    value: event[field] || "",
    className: classes.textField,
  });

  const handleDateChange = (field: keyof EventFormT) => (newVal: (DateTimeTimeZone & Moment) | null) => {
    setEvent({
      ...event,
      [field]: newVal,
      end: field === "start" && newVal?.isAfter(event.end) ? newVal.clone().add(30, "minutes") : event.end,
    });
  }

  const handleEdit = (allEvents: boolean) => () => {
    const data = formatEventForRequest(allEvents);
    dispatch(patchEventData(data))
      .then(onClose)
      .catch(() => /*TODO: Error handling */ null);
  }

  const handleDelete = (allEvents: boolean) => () => {
    dispatch(deleteEventData((allEvents ? event.seriesMasterId : event.id) || ""))
      .then(onClose)
      .catch(() => /*TODO: Error handling */ null);
  }

  const handleAutocomplete = (_e: any, newVal: Contact[]) => {
    setSelectedAttendees(newVal);
  }

  const handleContactRemove = (index: number) => () => {
    const copy = [...selectedAttendees];
    copy.splice(index, 1);
    setSelectedAttendees(copy);
  }

  const handleReminder = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReminder(e.target.value);
  }

  const handlePropToggle = (field: keyof EventFormT) => () => {
    setEvent({
      ...event,
      [field]: !event[field],
    })
  }

  const handleSaveMenu = (open: boolean) => (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(open ? event.currentTarget : null);
  };

  const handleDeleteMenu = (open: boolean) => (event: React.MouseEvent<HTMLElement>) => {
    setDeleteAnchorEl(open ? event.currentTarget : null);
  };

  return <div className={classes.root}>
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
        {event.type === "singleInstance" ? <div>
          <Button
            className={classes.button}
            variant="outlined"
            onClick={handleDelete(false)}
            color="primary"
          >
            Delete
          </Button>
        </div> : <div>
          <Button
            className={classes.button}
            variant="outlined"
            onClick={handleDeleteMenu(true)}
            endIcon={<KeyboardArrowDown />}
          >
            Delete
          </Button>
          <Menu
            anchorEl={deleteAnchorEl}
            open={Boolean(deleteAnchorEl)}
            onClose={handleDeleteMenu(false)}
          >
            <MenuItem onClick={handleDelete(false)}>
              Delete this event
            </MenuItem>
            <MenuItem onClick={handleDelete(true)}>
              Delete all events in the series
            </MenuItem>
          </Menu>
        </div>}
        {event.type === "singleInstance" ? <div>
          <Button
            variant="contained"
            className={classes.button}
            style={{ marginLeft: "16px" }}
            onClick={handleEdit(false)}
          >
            {selectedAttendees.length === 0 ? "Save" : "Send"}
          </Button>
        </div> : <div>
          <Button
            className={classes.button}
            style={{ marginLeft: "16px" }}
            variant="contained"
            onClick={handleSaveMenu(true)}
            endIcon={<KeyboardArrowDown />}
          >
            {selectedAttendees.length === 0 ? "Save" : "Send"}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleSaveMenu(false)}
          >
            <MenuItem onClick={handleEdit(false)}>
              Edit this event
            </MenuItem>
            <MenuItem onClick={handleEdit(true)}>
              Edit all events in the series
            </MenuItem>
          </Menu>
        </div>}
      </div>
      <div className={classes.flexEnd}>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </div>
    </div>
    <Grid container>
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
                    value={event.start || null}
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
                  <DatePicker value={event.end || null} onChange={handleDateChange("end")}/>
                  {!event.isAllDay && <TimePicker
                    value={event.end || null}
                    onChange={handleDateChange("end")}
                  />}
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
              initialValue={event.body || ""}
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
            {Array.from(attachments || []).map((file, key) =>
              <AttachmentItem key={key} attachment={file} />
            )}
            <Typography>
            </Typography>
          </div>
        </div>
      </DialogContent>
      {event.attendees?.length! > 0 && <div className={classes.attendees}>
        <Typography variant="h6">Tracking</Typography>
        <List
          dense
          subheader={
            <ListSubheader disableGutters>
              Organizer
            </ListSubheader>
          }
        >
          <ListItem disablePadding>
            <ListItemIcon style={{ minWidth: 40 }}>
              <Mic />
            </ListItemIcon>
            <ListItemText
              primary={event.organizer?.emailAddress?.name || ""}
              secondary={""}
            />
          </ListItem>
        </List>
        <List
          subheader={
            <ListSubheader disableGutters>
              Attendees
            </ListSubheader>
          }
          dense
        >
          {event.attendees?.map(({ emailAddress, status, type }, key) => <ListItem
            disablePadding
            key={key}
            divider
          >
            <ListItemIcon style={{ minWidth: 40 }}>
              {getResponseStatusIcon(status || null)}
            </ListItemIcon>
            <ListItemText
              primary={emailAddress?.name || emailAddress?.address || ""}
              secondary={type}
            />
          </ListItem>)}
        </List>
      </div>}
    </Grid>
    <input
      accept={"application/pdf"}
      hidden
      type="file"
      multiple
      ref={inputRef}
      onChange={handleUploadConfirm}
    />
  </div>
}

export default withStyles(styles)(OrganizerAppointmentForm);
