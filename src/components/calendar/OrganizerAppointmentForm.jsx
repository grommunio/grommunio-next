import { useEffect, useRef, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { withStyles } from '@mui/styles';
import { Close, EventAvailable, EventBusy, FiberManualRecord, Mic, PendingOutlined, QuestionMark } from "@mui/icons-material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { deleteEventData, patchEventData, postEventData } from "../../actions/calendar";
import { gabSelectionToRequestFormat, purify, utcTimeToUserTimezone } from "../../utils";
import { useAppContext } from "../../azure/AppContext";
import { useTypeSelector } from "../../store";
import AttendeeAutocomplete from "../AttendeeAutocomplete";

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

function getResponseStatusIcon(status) {
  const response = status.response;
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

const OrganizerAppointmentForm = ({ classes, event: storeEvent, onClose }) => {
  const editorRef = useRef(null);
  const [event, setEvent] = useState({});
  const { calendars } = useSelector(state => state.calendar);
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const dispatch = useDispatch();
  const app = useAppContext();
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const { contacts } = useTypeSelector(state => state.contacts);
  const [dirty, setDirty]= useState(false);

  useEffect(() => {
    const { id, startDate, endDate, subject, location, body, isAllDay, attendees, organizer } = storeEvent;
    setEvent({
      id: id,
      start: utcTimeToUserTimezone(startDate),
      end: utcTimeToUserTimezone(endDate),
      subject: subject,
      location: location?.displayName,
      body: body?.content,
      isAllDay: Boolean(isAllDay),
      attendees: attendees,
      organizer: organizer,
      // TODO: Implement recurrence
    });
    if(attendees) {
      /*const contactAttendees = attendees.value.reduce((prev, attendee) => {
        const contact = contacts.find(contact =>
          contact.emailAddresses.find(addr => addr.address === attendee.emailAddress.address));
        return contact ? [...prev, contact] : prev;
      }, []);*/

      const contactAttendees = attendees.map((attendee) => {
        const contact = contacts.find(contact =>
          contact.emailAddresses.find(addr => addr.address === attendee.emailAddress.address));
        return contact || { displayName: attendee.emailAddress.address };
      });
      setSelectedAttendees(contactAttendees);
    }
  }, [storeEvent]);

  useEffect(() => {
    if(!selectedCalendar) {
      setSelectedCalendar(calendars[0]?.id || "");
    }
  }, [calendars]);

  const formatEventForRequest = (event) => {
    const { start, end, location } = event;
    return {
      ...event,
      attendees: gabSelectionToRequestFormat(selectedAttendees) || [], // TODO: Implement non-contact mails
      start: {
        timeZone: app.user?.timeZone,
        dateTime: start.toISOString()
      },
      end: {
        timeZone: app.user?.timeZone,
        dateTime: end.toISOString()
      },
      location: location ? {
        displayName: location,
      } : undefined,
      body: {
        contentType: 'html',
        content: editorRef.current ? purify(editorRef.current.getContent()) : '',
      }
    };
  }

  const handleCalendarChange = (e) => {
    setSelectedCalendar(e.target.value);
  }

  const handleInput = (field, value) => {
    setEvent({
      ...event,
      [field]: value,
    });
    if(!dirty) setDirty(true);
  };

  const handleSwitch = field => (e) => {
    setEvent({
      ...event,
      [field]: e.target.checked,
    });
    if(!dirty) setDirty(true);
  };

  const textEditorProps = (field) => ({
    onChange: e => handleInput(field, e.target.value),
    value: event[field] || "",
    className: classes.textField,
  });

  const handleDateChange = field => (newVal) => {
    setEvent({
      ...event,
      [field]: newVal,
      end: field === "start" && newVal.isAfter(event.end) ? newVal.clone().add(30, "minutes") : event.end,
    });
    if(!dirty) setDirty(true);
  }

  const handleEdit = () => {
    const data = formatEventForRequest(event);
    dispatch(patchEventData(data))
      .catch(() => /*TODO: Error handling */ null);
  }

  const handleAdd = () => {
    const data = formatEventForRequest(event);
    dispatch(postEventData(data, selectedCalendar))
      .then(onClose);
  }

  const handleDelete = () => {
    dispatch(deleteEventData(event.id))
      .then(onClose);
  }

  const handleAutocomplete = (e, newVal) => {
    setSelectedAttendees(newVal);
    if(!dirty) setDirty(true);
  }

  const handleContactRemove = (index) => () => {
    const copy = [...selectedAttendees];
    copy.splice(index, 1);
    setSelectedAttendees(copy);
  }

  const isNewAppointment = !event.id;
  return <div className={classes.root}>
    <div className={classes.flexRow}>
      <div className={classes.flexRow}>
        {!isNewAppointment && <div>
          <Button
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleDelete}
          >
              Delete
          </Button>
        </div>}
        <div>
          <Button
            variant="contained"
            className={classes.button}
            style={{ marginLeft: "16px" }}
            onClick={isNewAppointment ? handleAdd : handleEdit}
            disabled={!dirty}
          >
            {selectedAttendees.length === 0 ? (isNewAppointment ? "Create" : "Save") : "Send"}
          </Button>
        </div>
        {isNewAppointment && <TextField
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
        </TextField>}
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
                  <DatePicker value={event.start || ""} onChange={handleDateChange("start")}/>
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
                toolbar,
                plugins: ["wordcount"],
              }}
              onInit={(evt, editor) => editorRef.current = editor}
            />
          </div>
        </div>
      </DialogContent>
      {event.attendees?.length > 0 && <div className={classes.attendees}>
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
              primary={event.organizer.emailAddress.name}
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
          {event.attendees.map(({ emailAddress, status, type }, key) => <ListItem
            disablePadding
            key={key}
            divider
          >
            <ListItemIcon style={{ minWidth: 40 }}>
              {getResponseStatusIcon(status)}
            </ListItemIcon>
            <ListItemText
              primary={emailAddress.name || emailAddress.address}
              secondary={type}
            />
          </ListItem>)}
        </List>
      </div>}
    </Grid>
  </div>
}

export default withStyles(styles)(OrganizerAppointmentForm);
