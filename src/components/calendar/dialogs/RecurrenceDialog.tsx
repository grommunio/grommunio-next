import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { withStyles } from "@mui/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Event } from "microsoft-graph";
import moment, { Moment } from "moment";
import { useState } from "react";


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
  {value: "thursay", label: "T"},
  {value: "friday", label: "F"},
  {value: "saturday", label: "S"},
  {value: "sunday", label: "S"},
];

const RecurrenceDialog = ({ classes, open, handleClose, setEvent }: RecurrenceDialogT) => {
  const [interval, setInterval] = useState<number>(1);
  const [type, setType] = useState<string>("day");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
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
          daysOfWeek,
        }
      }
    }));
    handleClose();
  }

  return <Dialog open={open} maxWidth="xs">
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
          onChange={e => setInterval(parseInt(e.target.value))}
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
          onChange={e => setType(e.target.value)}
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
