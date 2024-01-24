import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { withStyles } from "@mui/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Event } from "microsoft-graph";
import moment, { Moment } from "moment";
import { ChangeEvent, useEffect, useState } from "react";
import { NewEvent } from "../../../types/calendar";
import { getWeekday, getMonth } from "../eventUtils";


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
  },
  radioContainer: {
    paddingTop: 8,
    paddingBottom: 16,
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
  case "month": return "Monthly";
  case "year": return "Yearly";
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
  const [endDate, setEndDate] = useState<Moment | null>(event.start?.clone().add(3, "months") || null);
  const [absRel, setAbsRel] = useState(0);

  useEffect(() => {
    updateEndDate(type);
  }, [event])

  const handleDaysOfWeek = (
    _e: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setDaysOfWeek(newFormats);
  };

  const handleSave = () => {
    const fullType = getRecurrenceTypeFromSelection(type)
    setEvent((state: Event) => ({
      ...state,
      recurrence: {
        range: {
          startDate: moment(state.start?.dateTime).format("YYYY-MM-DD"),
          endDate: endDate?.format("YYYY-MM-DD"),
          type: "endDate"
        },
        pattern: {
          interval: type === "year" ? 1 : interval,
          type: type === "day" || type === "week" ? fullType : ((absRel === 0 ? "absolute" : "relative") + fullType),
          daysOfWeek: ((type === "day" && interval === 1) || type === "week") ?
            daysOfWeek : [getWeekday(event.start || moment())?.toLocaleLowerCase()],
          index: absRel === 0 ? undefined : absRel === 2 ? "last" : getNthWeekday(),
          month: (event.start?.month() || 0) + 1,
          dayOfMonth: absRel === 0 ? (event.start?.date() || 0) : undefined,
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

    // Update weekdays
    if(interval === 1 && value === "day") {
      setDaysOfWeek(weekDays.map(d => d.value));
    } else if (value === "week") {
      const weekdayIndex = event.start?.day() || 0;
      setDaysOfWeek([weekDays[(weekdayIndex + 6) % 7].value]);
    }

    // Update endDate
    updateEndDate(value);

    // Reset radio buttons
    setAbsRel(0);
  }

  const updateEndDate = (value: string) => {
    const date = moment(event.start).clone();
    if(value === "day") {
      setEndDate(date.clone().add(3, "months"));
    } else if(value === "week") {
      setEndDate(date.clone().add(25, "weeks"));
    } else if(value === "month") {
      setEndDate(date.clone().add(1, "years"));
    } else {
      // TODO: Find a better way
      setEndDate(date.clone().add(10, "years"));
    }
  }

  const handleDelete = () => {
    setEvent({
      ...event,
      recurrence: null,
    });
    handleClose();
  }

  const handleRadio = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAbsRel(parseInt((event.target as HTMLInputElement).value));
  };

  const getNthWeekday = () => {
    const date = event.start?.date() || 0;
    const n = Math.ceil(date / 7);

    switch(n) {
    case 1: return "first";
    case 2: return "second";
    case 3: return "third";
    case 4: return "fourth";
    default: return "last";
    }
  }

  const startDate = event.start || moment();
  const nthWeekday = getNthWeekday();
  return <Dialog open={open} maxWidth="xs" onClose={handleClose}>
    <DialogTitle>
      Repeat
    </DialogTitle>
    <DialogContent style={{ minHeight: 200 }}>
      <div className={classes.flexRow}>
        <Typography variant="body1" style={{ marginRight: 8 }}>Repeat every</Typography>
        {type !== "year" && <TextField
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
        </TextField>}
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
      {(type === "month"  || type === "year") && <div className={classes.radioContainer}>
        <FormControl>
          <RadioGroup
            value={absRel}
            onChange={handleRadio}
          >
            <FormControlLabel
              value={0}
              control={<Radio />}
              label={`On day ${event.start?.date()}`}
            />
            {nthWeekday !== "last" && <FormControlLabel
              value={1}
              control={<Radio />}
              label={`On the ${nthWeekday} ${getWeekday(startDate)}`}
            />}
            {(nthWeekday === "fourth" || nthWeekday === "last") && <FormControlLabel
              value={2}
              control={<Radio />}
              label={`On the last ${getWeekday(startDate)} ${type === "year" ? "in " + getMonth(startDate) : ""}`}
            />}
          </RadioGroup>
        </FormControl>
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
        onClick={handleDelete}
      >
        Delete recurrence
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
