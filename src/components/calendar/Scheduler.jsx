/* eslint-disable max-classes-per-file */
import * as React from "react";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import Grid from "@mui/material/Grid";
import { ViewState, EditingState } from "@devexpress/dx-react-scheduler";
import {
  Scheduler,
  Toolbar,
  DayView,
  MonthView,
  WeekView,
  Appointments,
  AppointmentTooltip,
  AppointmentForm,
  DragDropProvider,
  EditRecurrenceMenu,
  AllDayPanel,
  DateNavigator,
} from "@devexpress/dx-react-scheduler-material-ui";
import { connectProps } from "@devexpress/dx-react-core";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { BsCalendarPlus } from "react-icons/bs";
import { connect } from "react-redux";
import {
  deleteEventData,
  patchEventData,
  postEventData,
  fetchUserCalenders,
  fetchEventsData,
  deleteCalendarData,
} from "../../actions/calendar";
import {
  Box,
  ListItemButton,
  ListItemText,
  List,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import SmallCalendarDay from "./SmallCalendar";
import AddandEditCalendar from "./AddandEditCalendar";
import AppointmentFormContainerBasic from "./AppointmentFormContainerBasic";
import { useTypeDispatch } from "../../store";
import { useAppContext } from "../../azure/AppContext";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";

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
};

const StyledFab = styled(Fab)(({ theme }) => ({
  [`&.${classes.addButton}`]: {
    position: "absolute",
    bottom: theme.spacing(3),
    right: theme.spacing(4),
  },
}));

const StyledTable = styled(MonthView)(({ theme }) => ({}));

class ScheduleCalendar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.events,
      eventProps: this.props.events,
      confirmationVisible: false,
      editingFormVisible: false,
      deletedAppointmentId: undefined,
      editingAppointment: undefined,
      previousAppointment: undefined,
      addedAppointment: {},
      startDayHour: 8,
      endDayHour: 22,
      isNewAppointment: false,
      smallcallendarvalue: new Date(),
    };

    this.componentRef = React.createRef();
    this.toggleConfirmationVisible = this.toggleConfirmationVisible.bind(this);
    this.commitDeletedAppointment = this.commitDeletedAppointment.bind(this);
    this.toggleEditingFormVisibility =
      this.toggleEditingFormVisibility.bind(this);

    this.commitChanges = this.commitChanges.bind(this);
    this.onEditingAppointmentChange =
      this.onEditingAppointmentChange.bind(this);
    this.onAddedAppointmentChange = this.onAddedAppointmentChange.bind(this);
    this.appointmentForm = connectProps(AppointmentFormContainerBasic, () => {
      const {
        editingFormVisible,
        editingAppointment,
        data,
        addedAppointment,
        isNewAppointment,
        previousAppointment,
      } = this.state;

      const currentAppointment =
        data.filter(
          (appointment) =>
            editingAppointment && appointment.id === editingAppointment.id
        )[0] || addedAppointment;
      const cancelAppointment = () => {
        if (isNewAppointment) {
          this.setState({
            editingAppointment: previousAppointment,
            isNewAppointment: false,
          });
        }
      };

      return {
        visible: editingFormVisible,
        appointmentData: currentAppointment,
        commitChanges: this.commitChanges,
        visibleChange: this.toggleEditingFormVisibility,
        onEditingAppointmentChange: this.onEditingAppointmentChange,
        cancelAppointment,
      };
    });
  }

  componentDidUpdate() {
    if (this.props.events !== this.state.eventProps) {
      this.setState({ eventProps: this.props.events, data: this.props.events });
    }
    this.appointmentForm.update();
  }

  componentDidMount() {
    const { fetchUserCalenders, app } = this.props;
    fetchUserCalenders(app);
  }

  onEditingAppointmentChange(editingAppointment) {
    this.setState({ editingAppointment });
  }

  onAddedAppointmentChange(addedAppointment) {
    this.setState({ addedAppointment });
    const { editingAppointment } = this.state;
    if (editingAppointment !== undefined) {
      this.setState({
        previousAppointment: editingAppointment,
      });
    }
    this.setState({ editingAppointment: undefined, isNewAppointment: true });
  }

  setDeletedAppointmentId(id) {
    this.setState({ deletedAppointmentId: id });
  }

  toggleEditingFormVisibility() {
    const { editingFormVisible } = this.state;
    this.setState({
      editingFormVisible: !editingFormVisible,
    });
  }

  toggleConfirmationVisible() {
    const { confirmationVisible } = this.state;
    this.setState({ confirmationVisible: !confirmationVisible });
  }

  commitDeletedAppointment() {
    this.setState((state) => {
      const { data, deletedAppointmentId } = state;
      const nextData = data.filter(
        (appointment) => appointment.id !== deletedAppointmentId
      );
      const { deleteEvent, app } = this.props;
      deleteEvent({ eventId: deletedAppointmentId, app });
      return { data: nextData, deletedAppointmentId: null };
    });
    this.toggleConfirmationVisible();
  }

  commitChanges({ added, changed, deleted }) {
    this.setState((state) => {
      const { postEvent, patchEvent, app } = this.props;
      let { data } = state;
      if (added) {
        postEvent({ event: added, app: app });
        const startingAddedId =
          data.length > 0 ? data[data.length - 1].id + 1 : 0;
        data = [...data, { id: startingAddedId, ...added }];
      }
      if (changed) {
        data = data.map((appointment) => {
          if (changed[appointment.id]) {
            const event = { ...appointment, ...changed[appointment.id] };
            patchEvent({ event, app: app });
            return event;
          }
          return appointment;
        });
      }
      if (deleted !== undefined) {
        this.setDeletedAppointmentId(deleted);
        this.toggleConfirmationVisible();
      }

      return { data, addedAppointment: {} };
    });
  }

  excludedDays = (numberOfDays) => {
    const dayMappings = {
      1: [0, 2, 3, 4, 5, 6],
      2: [0, 3, 4, 5, 6],
      3: [0, 4, 5, 6],
      4: [0, 5, 6],
      5: [0, 6],
      6: [0],
      7: [],
      workWeek: [0, 6],
    };

    return dayMappings[numberOfDays] || [];
  };

  render() {
    const {
      currentDate,
      data,
      confirmationVisible,
      editingFormVisible,
      startDayHour,
      endDayHour,
    } = this.state;

    return (
      <Paper sx={{ flex: 1 }}>
        <Grid container spacing={2} height="100%">
          {this.props.showSideBar && (
            <Grid item xs={3}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateCalendar
                  slots={{ day: SmallCalendarDay }}
                  slotProps={{
                    day: {
                      appointments: data,
                    },
                  }}
                />
              </LocalizationProvider>
              <hr />
              <UserCalenders data={this.props.calendar} />
            </Grid>
          )}

          <Grid item xs={this.props.showSideBar ? 9 : 12}>
            <div ref={this.props.componentRef}>
              <Scheduler data={data}>
                <ViewState
                  currentDate={currentDate}
                  currentViewName={this.props.calenderView}
                />
                <EditingState
                  onCommitChanges={this.commitChanges}
                  onEditingAppointmentChange={this.onEditingAppointmentChange}
                  onAddedAppointmentChange={this.onAddedAppointmentChange}
                />
                <DayView />
                <WeekView
                  startDayHour={startDayHour}
                  endDayHour={endDayHour}
                  excludedDays={this.excludedDays(this.props.selectDays)}
                />
                <StyledTable>
                  <MonthView />
                </StyledTable>
                <AllDayPanel />
                <EditRecurrenceMenu />
                <Appointments />
                <AppointmentTooltip
                  showOpenButton
                  showCloseButton
                  showDeleteButton
                />
                <Toolbar />
                <DateNavigator />
                <AppointmentForm
                  overlayComponent={this.appointmentForm}
                  visible={editingFormVisible}
                  onVisibilityChange={this.toggleEditingFormVisibility}
                />
                <DragDropProvider />
              </Scheduler>
            </div>
          </Grid>
        </Grid>

        <Dialog open={confirmationVisible} onClose={this.cancelDelete}>
          <DialogTitle>Delete Appointment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this appointment?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.toggleConfirmationVisible}
              color="primary"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={this.commitDeletedAppointment}
              color="secondary"
              variant="outlined"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <StyledFab
          color="primary"
          className={classes.addButton}
          onClick={() => {
            this.setState({ editingFormVisible: true });
            this.onEditingAppointmentChange(undefined);
            this.onAddedAppointmentChange({
              startDate: new Date(currentDate).setHours(startDayHour),
              endDate: new Date(currentDate).setHours(startDayHour + 1),
            });
          }}
        >
          <AddIcon />
        </StyledFab>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => {
  const { calendar } = state;
  return {
    events: calendar.events,
    calendar: calendar.calendar,
  };
};
deleteCalendarData;
const mapDispatchToProps = (dispatch) => {
  return {
    postEvent: async (params) => await dispatch(postEventData(params)),
    patchEvent: async (params) => await dispatch(patchEventData(params)),
    deleteEvent: async (params) => await dispatch(deleteEventData(params)),
    fetchUserCalenders: async (params) =>
      await dispatch(fetchUserCalenders(params)),
  };
};

const UserCalenders = ({ data }) => {
  const [open, setOpen] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState(0);
  const dispatch = useTypeDispatch();
  const app = useAppContext();
  const [visible, setVisible] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [switchside, setSwitchside] = React.useState(null);
  const [calendar, setCalendarId] = React.useState({ id: "", name: "" });

  const open2 = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onHide = () => {
    setVisible(false);
  };

  const handleClickOpen = () => {
    setVisible(true);
    setSwitchside(true);
  };

  const handleClickOpen2 = (id, name) => {
    setVisible(true);
    setSwitchside(false);
    handleClose();
    setCalendarId({ id, name });
  };

  const { id, name } = calendar;

  return (
    <Box sx={{ pb: open ? 2 : 0 }}>
      <AddandEditCalendar
        onHide={onHide}
        visible={visible}
        switchside={switchside}
        id={id}
        name={name}
      />
      <ListItemButton alignItems="flex-start" onClick={() => handleClickOpen()}>
        <BsCalendarPlus />
        <ListItemText primary="Add calendar" sx={{ my: 0, pl: 2 }} />
      </ListItemButton>
      <ListItemButton alignItems="flex-start" onClick={() => setOpen(!open)}>
        <KeyboardArrowDown
          sx={{
            mr: -1,
            transform: open ? "rotate(0)" : "rotate(-90deg)",
            transition: "0.2s",
          }}
        />
        <ListItemText primary="My Calenders" sx={{ my: 0, pl: 2 }} />
      </ListItemButton>
      <List>
        {open &&
          data?.map((item, index) => (
            <ListItemButton
              key={item.id}
              selected={selectedItem === index}
              onClick={() => {
                setSelectedItem(index);
                dispatch(fetchEventsData({ app, id: item.id }));
              }}
              style={{
                height: 38,
              }}
            >

              <ListItemText
                primary={item.name}
                primaryTypographyProps={{ ml: 2 }}
              />
              {
                selectedItem === index &&
                item.isDisabled && (
                  <span>
                    <IconButton
                      aria-label="more"
                      id="long-button"
                      aria-controls={open ? "long-menu" : undefined}
                      aria-expanded={open ? "true" : undefined}
                      aria-haspopup="true"
                      onClick={handleClick}
                      edge="end"
                      style={{ color: "white" }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      MenuListProps={{
                        "aria-labelledby": "long-button",
                      }}
                      anchorEl={anchorEl}
                      open={open2}
                      onClose={handleClose}
                      id="account-menu"
                      transformOrigin={{
                        horizontal: "left",
                        vertical: "bottom",
                      }}
                      anchorOrigin={{ horizontal: "left", vertical: "top" }}
                      PaperProps={{
                        elevation: 0,
                        sx: {
                          overflow: "visible",
                          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                          mt: 1.5,
                          "& .MuiAvatar-root": {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                          },
                          "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                          },
                        },
                      }}
                    >
                      <MenuItem onClick={handleClose}>
                        <span
                          onClick={() =>
                            dispatch(deleteCalendarData(item.id))
                          }
                        >
                          <IconButton>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          Delete
                        </span>
                      </MenuItem>
                      <MenuItem onClick={() => handleClickOpen2(item.id, item.name)}>
                        <ListItemIcon>
                          <EditIcon fontSize="small" />
                        </ListItemIcon>
                        Edit
                      </MenuItem>
                    </Menu>
                  </span>
                )
              }
            </ListItemButton>
          ))}
      </List>
    </Box>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleCalendar);
