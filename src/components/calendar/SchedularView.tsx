import { Grid, Paper } from "@mui/material";
import { useTypeDispatch, useTypeSelector } from "../../store";
import UserCalenders from "./UserCalendars";
import ConfirmAppointmentDelete from "./dialogs/ConfirmAppointmentDelete";
import { forwardRef, useEffect, useState } from "react";
import { Event } from "microsoft-graph";
import DatePicker from "./DatePicker";
import Scheduler from "./Scheduler";
import { deleteCalendarData, fetchEventsData, fetchUserCalenders } from "../../actions/calendar";
import ListView from "./ListView";

type SchedularViewType = {
  showSideBar: boolean;
  listViewActive: boolean;
}

const SchedularView = forwardRef(({ showSideBar, listViewActive }: SchedularViewType, ref) => {
  const { events } = useTypeSelector(state => state.calendar);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const dispatch = useTypeDispatch();
  
  useEffect(() => {
    dispatch(fetchUserCalenders());
    dispatch(fetchEventsData());
  }, []);

  const handleAppointmentDelete = () => {
    deleteCalendarData(deleting?.id || "");
  }

  return <Paper sx={{ flex: 1 }}>
    <Grid container height="100%">
      {showSideBar && (
        <Grid item>
          <DatePicker events={events} />
          <hr />
          <UserCalenders />
        </Grid> 
      )}
      <Grid item flex={1}>
        {listViewActive ?
          <ListView events={events}/> :
          <div>
            <Scheduler
              events={events}
              ref={ref}
            />
          </div>}
      </Grid>
    </Grid>
    <ConfirmAppointmentDelete
      open={Boolean(deleting)}
      onClose={() => setDeleting(null)}
      onConfirm={handleAppointmentDelete}
    />
  </Paper>;
});

export default SchedularView;