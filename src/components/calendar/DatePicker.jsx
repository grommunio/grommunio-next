import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import SmallCalendarDay from "./SmallCalendar";


const DatePicker = ({ events }) => {
  return <LocalizationProvider dateAdapter={AdapterMoment}>
    <DateCalendar
      slots={{ day: SmallCalendarDay }}
      slotProps={{
        day: {
          appointments: events,
        },
      }}
    />
  </LocalizationProvider>;
}

export default DatePicker;