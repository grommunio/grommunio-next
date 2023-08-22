import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Switch,
  Menu
} from "@mui/material";
// import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import LocationOn from "@mui/icons-material/LocationOn";
import Notes from "@mui/icons-material/Notes";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Create from "@mui/icons-material/Create";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// Import other necessary components and icons

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
  svgicon: `${PREFIX}-svgicon`,
  textFieldfooter: `${PREFIX}-textFieldfooter`
};

const StyledDiv = styled("div")(({ theme }) => ({
  [`& .${classes.icon}`]: {
    margin: theme.spacing(2, 0),
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
    margin: theme.spacing(2),
  },
  [`& .${classes.wrapper}`]: {
    display: "flex",
    // justifyContent: "space-between",
    padding: theme.spacing(0, 0),
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
  [`& .${classes.svgicon}`]: {
    width: "30px",
  },
  [`& .${classes.textFieldfooter}`]: {

  },
}));

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
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
      transform: "translateX(12px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#177ddc" : "#1890ff",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 12,
    height: 12,
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
  }

  changeAppointment({ field, changes }) {
    const nextChanges = {
      ...this.getAppointmentChanges(),
      [field]: changes,
    };
    this.setState({
      appointmentChanges: nextChanges,
    });
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
    const { appointmentChanges } = this.state;

    const displayAppointmentData = {
      ...appointmentData,
      ...appointmentChanges,
    };
    const isNewAppointment = appointmentData.id === undefined;
    const applyChanges = () =>
      this.commitAppointment(isNewAppointment ? "added" : "changed");
    const textEditorProps = (field) => ({
      variant: "outlined",
      onChange: ({ target: change }) =>
        this.changeAppointment({
          field: [field],
          changes: change.value,
        }),
      value: displayAppointmentData[field] || "",
      placeholder: field[0].toUpperCase() + field.slice(1),
      className: classes.textField,
    });

    const pickerEditorProps = (field) => ({
      value: displayAppointmentData[field],
      onChange: (date) =>
        this.changeAppointment({
          field: [field],
          changes: date
            ? date.toDate()
            : new Date(displayAppointmentData[field]),
        }),
      ampm: false,
      inputFormat: "DD/MM/YYYY",
      onError: () => null,
    });
    const startDatePickerProps = pickerEditorProps("startDate");
    const endDatePickerProps = pickerEditorProps("endDate");

    const cancelChanges = () => {
      this.setState({
        appointmentChanges: {},
      });
      visibleChange();
      cancelAppointment();
    };
    return (
      <Dialog open={visible} onClose={onHide}>
        <StyledDiv>
          <DialogTitle style={{ height: "70px" }}>
            <div className={classes.wrapper}>
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
                // color="#1976D2"
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
                  // onClick={handleClick}
                >
                  Open Outlook Dropdown
                </Button>
                <Menu
                  id="outlook-dropdown"
                  // anchorEl={anchorEl}
                  keepMounted
                  // open={Boolean(anchorEl)}
                  // onClose={handleClose}
                >
                  {/* <MenuItem onClick={handleClose}>Option 1</MenuItem>
                  <MenuItem onClick={handleClose}>Option 2</MenuItem>
                  <MenuItem onClick={handleClose}>Option 3</MenuItem> */}
                </Menu>
              </div>
            </div>
          </DialogTitle>
          <DialogContent style={{ display: "flex" }}>
            <div className={classes.content}>
              <div className={classes.wrapper}>
                <Create className={classes.icon} color="action" />
                <TextField
                  {...textEditorProps("Add a title")}
                  variant="standard"
                />
              </div>
              <div className={classes.wrapper}>
                <Create className={classes.icon} color="action" />
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
              <div className={classes.wrapper}>
                <CalendarToday className={classes.icon} color="action" />
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <div className={classes.flexRow}>
                    <DateTimePicker
                      label="Start Date"
                      renderInput={(props) => (
                        <TextField
                          sx={{ mr: 2 }}
                          className={classes.picker}
                          {...props}
                        />
                      )}
                      {...startDatePickerProps}
                    />
                    <DateTimePicker
                      label="End Date"
                      renderInput={(props) => (
                        <TextField className={classes.picker} {...props} />
                      )}
                      {...endDatePickerProps}
                    />
                  </div>
                </LocalizationProvider>
              </div>
              <div className={classes.wrapper}>
                <LocationOn className={classes.icon} color="action" />
                <TextField
                  {...textEditorProps("location")}
                  variant="standard"
                  // classes.svgicon
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <AntSwitch
                          inputProps={{ "aria-label": "ant design" }}
                        />
                        <i
                          data-icon-name="IcFluentOfficeSkypeColor"
                          aria-hidden="true"
                        >
                          <svg
                            // class="Q0K3G"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            class={classes.svgicon}
                          >
                            <path
                              d="M16.4651 10.9137C16.5091 10.6192 16.5327 10.3221 16.5357 10.0244C16.533 8.31327 15.8453 6.673 14.6233 5.46306C13.4012 4.25312 11.7446 3.57221 10.0163 3.56957C9.77413 3.56957 9.54202 3.56957 9.3099 3.56957C8.65266 3.17861 7.89655 2.98105 7.13005 3.00003C6.40763 2.99609 5.69693 3.18087 5.06967 3.53572C4.44242 3.89058 3.92078 4.40296 3.55741 5.02117C3.19403 5.63938 3.00177 6.34154 3.00001 7.05682C2.99826 7.77209 3.18708 8.47517 3.54742 9.09512C3.49466 9.4055 3.46765 9.71963 3.46668 10.0344C3.46671 10.9482 3.66301 11.8515 4.04256 12.6845C4.42212 13.5175 4.97624 14.261 5.66817 14.8658C6.3601 15.4705 7.17401 15.9227 8.0559 16.1922C8.93779 16.4618 9.8675 16.5426 10.7833 16.4292C11.4142 16.804 12.1366 17.001 12.8724 16.9988C13.9653 16.9988 15.0137 16.5696 15.7874 15.8053C16.5612 15.0411 16.9973 14.0042 16.9999 12.922C17.0035 12.2176 16.819 11.5248 16.4651 10.9137Z"
                              fill="#28A8EA"
                            ></path>
                            <path
                              d="M8.25 9.86999C7.98716 9.69984 7.76794 9.47035 7.61 9.19999C7.45559 8.91495 7.37966 8.59401 7.39 8.26999C7.36797 7.84479 7.50726 7.42694 7.78 7.09999C8.04894 6.78837 8.39321 6.55082 8.78 6.40999C9.21086 6.26082 9.66406 6.18642 10.12 6.18999C10.4215 6.18524 10.7228 6.20867 11.02 6.25999C11.232 6.29012 11.4399 6.34378 11.64 6.41999C11.8243 6.47967 11.9898 6.58654 12.12 6.72999C12.2206 6.84245 12.2743 6.98917 12.27 7.13999C12.2779 7.30042 12.2243 7.45781 12.12 7.57999C12.0679 7.63269 12.0055 7.67408 11.9366 7.70161C11.8678 7.72914 11.7941 7.7422 11.72 7.73999C11.6171 7.73948 11.5152 7.71911 11.42 7.67999C11.1938 7.57517 10.9598 7.48824 10.72 7.41999C10.5095 7.37773 10.2942 7.36427 10.08 7.37999C9.78265 7.3696 9.48829 7.44232 9.23 7.58999C9.12399 7.65696 9.03702 7.75011 8.97747 7.86045C8.91792 7.9708 8.88779 8.09462 8.89 8.21999C8.89135 8.38921 8.95966 8.55101 9.08 8.66999C9.21434 8.81136 9.37369 8.92664 9.55 9.00999C9.75 9.10999 10.05 9.23999 10.44 9.39999H10.57C10.9513 9.54948 11.3165 9.73709 11.66 9.95999C11.9349 10.141 12.167 10.3799 12.34 10.66C12.5129 10.9639 12.5961 11.3107 12.58 11.66C12.596 12.0734 12.4766 12.4807 12.24 12.82C12.0036 13.142 11.6762 13.3858 11.3 13.52C10.8451 13.6845 10.3635 13.7625 9.88 13.75C9.21483 13.7727 8.55274 13.6498 7.94 13.39C7.78419 13.3195 7.64716 13.2133 7.54 13.08C7.45568 12.9561 7.4104 12.8098 7.41 12.66C7.40447 12.5793 7.41787 12.4983 7.44911 12.4237C7.48036 12.349 7.5286 12.2827 7.59 12.23C7.64791 12.1816 7.71486 12.1452 7.78696 12.1229C7.85906 12.1006 7.93487 12.0928 8.01 12.1C8.19069 12.1052 8.3681 12.1496 8.53 12.23L8.99 12.46C9.12057 12.5087 9.25419 12.5488 9.39 12.58C9.56019 12.6214 9.73485 12.6416 9.91 12.64C10.2188 12.6606 10.5254 12.576 10.78 12.4C10.8749 12.3255 10.9506 12.2295 11.0011 12.12C11.0515 12.0105 11.0751 11.8905 11.07 11.77C11.0708 11.5993 11.0064 11.4348 10.89 11.31C10.7331 11.1507 10.5505 11.0189 10.35 10.92C10.11 10.79 9.78 10.64 9.35 10.46C8.96505 10.3076 8.59651 10.1166 8.25 9.88999"
                              fill="white"
                            ></path>
                          </svg>
                          <label class="ms-Label wj3t5 root-473">
                            Skype meeting
                          </label>
                        </i>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <div className={classes.wrapper}>
                <Notes className={classes.icon} color="action" />
                <TextField {...textEditorProps("notes")} multiline rows="6" />
                <div className={classes.textFieldfooter}></div>
              </div>
            </div>
          </DialogContent>
        </StyledDiv>
      </Dialog>
    );
  }
}

export default AppointmentFormContainerBasic;
