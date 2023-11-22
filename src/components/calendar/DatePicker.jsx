import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
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