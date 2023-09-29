import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Switch,
  Menu,
  MenuItem,
} from "@mui/material";
import LocationOn from "@mui/icons-material/LocationOn";
import Notes from "@mui/icons-material/Notes";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Create from "@mui/icons-material/Create";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Skypeicon } from "./svgicon";
import moment from "moment";
import LanguageIcon from "@mui/icons-material/Language";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import RepeatIcon from "@mui/icons-material/Repeat";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import 'moment-timezone';

const PREFIX = "Demo";
const classes = {
  content: `${PREFIX}-content`,
  header: `${PREFIX}-header`,
  closeButton: `${PREFIX}-closeButton`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  button: `${PREFIX}-button`,
  picker: `${PREFIX}-picker`,
  wrapper: `${PREFIX}-wrapper`,
  icon: `${PREFIX}-icon`,
  textField: `${PREFIX}-textField`,
  addButton: `${PREFIX}-addButton`,
  circleFilled: `${PREFIX}-circleFilled`,
  dropdown: `${PREFIX}-dropdown`,
  smallcircle: `${PREFIX}-smallcircle`,
  flexRow: `${PREFIX}-flexRow`,
  customSelect: `${PREFIX}-customSelect`,
  attachmentDropdown: `${PREFIX}-attachmentDropdown`,
  attachmentDropdownlist: `${PREFIX}-attachmentDropdownlist`,
};

let pickerSize = false;
const StyledDiv = styled("div")(({ theme }) => ({
  [`& .${classes.icon}`]: {
    marginRight: theme.spacing(2),
  },
  [`& .${classes.header}`]: {
    overflow: "hidden",
    paddingTop: theme.spacing(0.5),
  },
  [`& .${classes.textField}`]: {
    width: "100%",
  },
  [`& .${classes.content}`]: {
    padding: theme.spacing(2),
    paddingTop: 0,
  },
  [`& .${classes.picker}`]: {
    width: pickerSize ? "400px" : "200px",
  },
  [`& .${classes.wrapper}`]: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  [`& .${classes.buttonGroup}`]: {
    display: "flex",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 2),
  },
  [`& .${classes.button}`]: {
    background: "#1976D2",
    marginRight: "30px",
  },
  [`& .${classes.flexRow}`]: {
    display: "flex",
    marginTop: theme.spacing(2),
    gap: "14px",
  },
  [`& .${classes.circleFilled}`]: {
    background: "#1976D2",
    height: "15px",
    width: "15px",
    borderRadius: "100px",
  },
  [`& .${classes.dropdown}`]: {
    position: "absolute",
  },
  [`& .${classes.smallcircle}`]: {
    width: "15px",
    height: "15px",
    backgroundColor: "#1976D2",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  [`& .${classes.customSelect}`]: {
    border: "none",
    backgroundColor: "transparent",
    padding: "10px 5px",
    fontSize: "17px",
    cursor: "pointer",
    outline: 'none',
    fontWeight: "500"
  },
  [`& .${classes.attachmentDropdown}`]: {
    position: "absolute",
    background: "white",
    listStyle: "none",
    border: "2px solid rgba(0, 0, 0, 0.04)",
    borderRadius: "3px",
    marginTop: "-240px",
    padding: "10px",
    zIndex: 1000,
  },
  [`& .${classes.attachmentDropdownlist}`]: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.04)",
    },
    padding: "10px 10px",
  },
}));

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
        backgroundColor: theme.palette.mode === "dark" ? "#177ddc" : "#1890ff",
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

class AppointmentFormContainerBasic extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      appointmentChanges: {},
      anchorEl: null,
      selectedOption: "",
      attachment: null,
      selectedTimezone: moment.tz.guess(),
      timezones: moment.tz.names(),
      ButtonSwitch: true,
      showCustomItem: true,
      selectedStartDate: null,
    };


    this.getAppointmentData = () => {
      const { appointmentData } = this.props;
      return appointmentData;
    };
    this.getAppointmentChanges = () => {
      const { appointmentChanges } = this.state;
      return appointmentChanges;
    };

    this.changeAppointment = this.changeAppointment.bind(this);
    this.commitAppointment = this.commitAppointment.bind(this);

    this.editorRef = React.createRef();
  }

  changeAppointment({ field, changes }) {
    const nextChanges = { ...this.getAppointmentChanges(), [field]: changes };
    this.setState({ appointmentChanges: nextChanges });
  }

  commitAppointment(type) {
    const { commitChanges } = this.props;
    const appointment = {
      ...this.getAppointmentData(),
      ...this.getAppointmentChanges(),
    };
    if (type === "deleted") {
      commitChanges({ [type]: appointment.id });
    } else if (type === "changed") {
      commitChanges({ [type]: { [appointment.id]: appointment } });
    } else {
      commitChanges({ [type]: appointment });
    }
    this.setState({
      appointmentChanges: {},
    });
  }
  render() {
    const {
      visible,
      visibleChange,
      appointmentData,
      cancelAppointment,
      onHide,
    } = this.props;
    const { appointmentChanges, anchorEl, selectedOption, selectedTimezone, timezones, ButtonSwitch, selectedStartDate } =
      this.state;

    const displayAppointmentData = {
      ...appointmentData,
      ...appointmentChanges,
    };
    const isNewAppointment = appointmentData.id === undefined;
    const applyChanges = () =>
      this.commitAppointment(isNewAppointment ? "added" : "changed");

    const textEditorProps = (field) => ({
      variant: "outlined",
      onChange: (event) => {
        const newValue = event.target.value;
        this.changeAppointment({
          field: [field],
          changes: newValue,
        });
      },
      value: displayAppointmentData[field] || "",
      placeholder: field[0].toUpperCase() + field.slice(1),
      className: classes.textField,
    });

    const handleClick = (event) => {
      this.setState({ anchorEl: event.currentTarget });
    };

    const handleOptionClick = (option) => () => {
      this.setState({ selectedOption: option, anchorEl: null });
    };

    const getDateOrTime = (date, field_name, get_for_field_name) => {
      if (field_name === get_for_field_name) {
        return date;
      }
      let currentDate = displayAppointmentData[get_for_field_name] || undefined;
      return moment(currentDate);
    };

    const dateDefaultValue = !ButtonSwitch ? moment() : null
    const pickerEditorProps = (field) => {
      return {
        onChange: (date) => {
          let currentDate;
          let currentTime;
          if (field == "endDate" || field == "endTime") {
            currentDate = getDateOrTime(date, field, "endDate");
            currentTime = getDateOrTime(date, field, "endTime");
          } else {
            currentDate = getDateOrTime(date, field, "startDate");
            currentTime = getDateOrTime(date, field, "startTime");
            this.setState({ selectedStartDate: date });

          }
          let newDateTime = moment(
            currentDate.format("YYYYMMDD") + currentTime.format("hhmm"),
            "YYYYMMDDhhmm"
          ).tz(selectedTimezone)

          this.changeAppointment({
            field: [field],
            changes: newDateTime.toDate(),
          });
        },
        ampm: false,
        onError: () => null,
        className: classes.picker,
        minDate: field === "endDate" ? selectedStartDate : undefined,
      };
    };
    const startTimePickerProps = pickerEditorProps("startTime");
    const endTimePickerProps = pickerEditorProps("endTime");
    const startDatePickerProps = pickerEditorProps("startDate");
    const endDatePickerProps = pickerEditorProps("endDate");

    const cancelChanges = () => {
      this.setState({
        appointmentChanges: {},
      });
      visibleChange();
      cancelAppointment();
    };

    const timezoneHandlechange = (event) => {
      this.setState({ selectedTimezone: event.target.value })
    }

    const handleSwitch = () => {
      this.setState({ ButtonSwitch: !ButtonSwitch });
      pickerSize = !pickerSize

      this.changeAppointment({
        "startDate":"startDate",
        changes: dateDefaultValue,
      });

      this.changeAppointment({
        "endDate": "endDate",
        changes: dateDefaultValue,
      });

    }

    return (
      <Dialog open={visible} onClose={onHide} maxWidth="md" fullWidth={true}>
        <StyledDiv>
          <DialogTitle style={{ height: "70px" }} className={classes.wrapper}>
            <div className={classes.flexRow}>
              {!isNewAppointment && (
                <Button
                  variant="outlined"
                  color="secondary"
                  className={classes.button}
                  onClick={() => {
                    visibleChange();
                    this.commitAppointment("deleted");
                  }}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="contained"
                className={classes.button}
                style={{ marginLeft: "15px" }}
                onClick={() => {
                  visibleChange();
                  applyChanges();
                }}
              >
                {isNewAppointment ? "Create" : "Save"}
              </Button>
              <div>
                <Button
                  aria-controls="outlook-dropdown"
                  aria-haspopup="true"
                  onClick={handleClick}
                  endIcon={<KeyboardArrowDownIcon />}
                  startIcon={<span className={classes.smallcircle} />}
                  style={{ color: "black" }}
                >
                  {selectedOption ? selectedOption : "Calender"}
                </Button>
                <Menu
                  id="outlook-dropdown"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                >
                  <MenuItem onClick={handleOptionClick("Calender")}>
                    <span className={classes.smallcircle} />
                    Calender
                  </MenuItem>
                </Menu>
              </div>
            </div>
            <IconButton
              className={classes.closeButton}
              onClick={cancelChanges}
              size="large"
            >
              <Close color="action" />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{ paddingBottom: '70px' }}>
            <div className={classes.content}>
              <div className={classes.flexRow}>
                <Create className={classes.icon} color="action" />
                <TextField
                  {...textEditorProps("Add a title")}
                  variant="standard"
                />
              </div>
              <div className={classes.flexRow}>
                <PersonAddAltIcon className={classes.icon} color="action" />
                <TextField
                  {...textEditorProps("Invite attendees")}
                  variant="standard"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">Optional</InputAdornment>
                    ),
                  }}
                />
              </div>
              <div className={classes.flexRow}>
                <CalendarToday className={classes.icon} color="action" />
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <div>
                    <div
                      className={classes.flexRow}
                    >
                      <DatePicker {...startDatePickerProps} defaultValue={dateDefaultValue}/>
                      {ButtonSwitch && <TimePicker {...startTimePickerProps} />}
                      <span style={{ marginTop: '15px', display: "flex", gap: "15px", fontWeight: "500" }}><AntSwitch inputProps={{ "aria-label": "ant design" }} onClick={handleSwitch} /> <span>All day</span></span>
                      {ButtonSwitch && <div className={classes.wrapper}>
                        <label htmlFor="Timezone">
                          <LanguageIcon style={{ color: "#177ddc" }} />
                        </label>
                        <select
                          name="Timezone"
                          id="Timezone"
                          className={classes.customSelect}
                          style={{ width: '160px' }}
                          value={selectedTimezone}
                          onChange={timezoneHandlechange}
                        >
                          <option value={moment.tz.guess()}>{moment.tz.guess()}</option>
                          {timezones && timezones.map((timezone, index) => (
                            <option key={index} value={timezone}>
                              {timezone}
                            </option>
                          ))}
                        </select>
                      </div>}
                    </div>
                    <div className={classes.flexRow}>
                      <DatePicker {...endDatePickerProps} defaultValue={dateDefaultValue}/>
                      {ButtonSwitch && <TimePicker {...endTimePickerProps} />}
                      <div className={classes.wrapper}>
                        <label htmlFor="Repeat">
                          <RepeatIcon style={{ color: "#177ddc" }} />
                        </label>
                        <select
                          name="Repeat"
                          id="Repeat"
                          className={classes.customSelect}
                        >
                          {[
                            "Don't repeat",
                            "Daily",
                            "Weekly",
                            "Monthly",
                            "Yearly",
                            "Custom",
                          ].map((x, index) => (
                            <option value={x} key={index}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </LocalizationProvider>
              </div>
              <div className={classes.flexRow}>
                <LocationOn className={classes.icon} color="action" />
                <TextField
                  {...textEditorProps("location")}
                  variant="standard"
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
              <div className={classes.flexRow}>
                <Notes className={classes.icon} color="action" />
                <div>
                  <ReactQuill {...textEditorProps("notes")} theme="snow" style={{ height: '200px' }} modules={{
                    toolbar: [
                      [{ font: [] }],
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ color: [] }, { background: [] }],
                      [{ script: "sub" }, { script: "super" }],
                      ["blockquote", "code-block"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image", "video"],
                    ],
                  }} />
                </div>
              </div>
            </div>
          </DialogContent>
        </StyledDiv>
      </Dialog>
    );
  }
}


export default AppointmentFormContainerBasic;
