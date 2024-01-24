import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { withStyles } from "@mui/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Event } from "microsoft-graph";
import moment, { Moment } from "moment";
import { ChangeEvent, useState } from "react";
import { NewEvent } from "../../../types/calendar";


const styles = {
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 50,
  },
  daySelector: {
    display: 'flex',
    justifyContent: 'center',
    padding: 16,
  }
}

type RecurrenceDialogT = {
  classes: any;
  open: boolean;
  handleClose: () => void;
  setEvent: (newState: any) => void;
  event: NewEvent;
}

function getRecurrenceTypeFromSelection(selection: string): string {
  switch(selection) {
  case "day": return "daily";
  case "week": return "weekly";
  case "month": return "absoluteMonthly"; // TODO: Implement relative
  case "year": return "absoluteYearly"; // TODO: Implement relative
  default: return "";
  }
}

const weekDays = [
  {value: "monday", label: "M"},
  {value: "tuesday", label: "T"},
  {value: "wednesday", label: "W"},
  {value: "thursday", label: "T"},
  {value: "friday", label: "F"},
  {value: "saturday", label: "S"},
  {value: "sunday", label: "S"},
];


const RecurrenceDialog = ({ classes, open, handleClose, setEvent, event }: RecurrenceDialogT) => {
  const [interval, setInterval] = useState<number>(1);
  const [type, setType] = useState<string>("day");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(weekDays.map(d => d.value));
  const [endDate, setEndDate] = useState<Moment | null>(null);

  const handleDaysOfWeek = (
    _e: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setDaysOfWeek(newFormats);
  };

  const handleSave = () => {
    setEvent((state: Event) => ({
      ...state,
      recurrence: {
        range: {
          startDate: moment(state.start?.dateTime).format("YYYY-MM-DD"),
          endDate: endDate?.format("YYYY-MM-DD"),
          type: "endDate"
        },
        pattern: {
          interval,
          type: getRecurrenceTypeFromSelection(type),
          daysOfWeek: ((type === "day" && interval === 1) || type === "week") ? daysOfWeek : [],
        }
      }
    }));
    handleClose();
  }

  const handleInterval = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setInterval(value);
    if(value === 1 && type === "day") {
      setDaysOfWeek(weekDays.map(d => d.value));
    }
  }

  const handleType = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setType(value);
    if(interval === 1 && value === "day") {
      setDaysOfWeek(weekDays.map(d => d.value));
    } else if (value === "week"){
      const weekdayIndex = event.start?.day() || 0;
      setDaysOfWeek([weekDays[(weekdayIndex + 6) % 7].value]);
    }
  }

  return <Dialog open={open} maxWidth="xs" onClose={handleClose}>
    <DialogTitle>
      Repeat
    </DialogTitle>
    <DialogContent style={{ minHeight: 200 }}>
      <div className={classes.flexRow}>
        <Typography variant="body1" style={{ marginRight: 8 }}>Repeat every</Typography>
        <TextField
          size="small"
          select
          style={{ width: 60, marginRight: 8 }}
          SelectProps={{
            MenuProps: {
              disablePortal: true,
              style: { maxHeight: 300 }
            }
          }}
          value={interval}
          onChange={handleInterval}
        >
          {Array.from(Array(99).keys()).map(n =>
            <MenuItem key={n} value={n + 1}>{n + 1}</MenuItem>
          )}
        </TextField>
        <TextField
          size="small"
          select
          style={{ width: 120 }}
          SelectProps={{
            MenuProps: {
              disablePortal: true,
              style: { maxHeight: 300 }
            }
          }}
          value={type}
          onChange={handleType}
        >
          {["day", "week", "month", "year"].map((type) => 
            <MenuItem key={type} value={type}>{type}{interval > 1 && "s"}</MenuItem>
          )}
        </TextField>
      </div>
      {((type === "day" && interval === 1) || type === "week") && <div className={classes.daySelector}>
        <ToggleButtonGroup
          value={daysOfWeek}
          onChange={handleDaysOfWeek}
          color="primary"
        >
          {weekDays.map((day, key) =>
            <ToggleButton key={key} value={day.value}>
              {day.label}
            </ToggleButton>
          )}
        </ToggleButtonGroup>
      </div>}
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DatePicker
          label="End date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
        />
      </LocalizationProvider>
    </DialogContent>
    <DialogActions>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
      >
        Save
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleClose}
      >
        Discard
      </Button>
    </DialogActions>
  </Dialog>
}

export default withStyles(styles)(RecurrenceDialog);
