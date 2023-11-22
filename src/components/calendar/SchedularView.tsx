import { Grid, Paper } from "@mui/material";
import { useTypeDispatch, useTypeSelector } from "../../store";
import UserCalenders from "./UserCalendars";
import ConfirmAppointmentDelete from "./dialogs/ConfirmAppointmentDelete";
import { forwardRef, useEffect, useState } from "react";
import { Event } from "microsoft-graph";
import DatePicker from "./DatePicker";
import Scheduler from "./Scheduler";
import { deleteCalendarData, fetchEventsData, fetchUserCalenders } from "../../actions/calendar";
import { useAppContext } from "../../azure/AppContext";

type SchedularViewType = {
  showSideBar: boolean;
}

const SchedularView = forwardRef(({ showSideBar }: SchedularViewType, ref) => {
  const app = useAppContext();
  const { events } = useTypeSelector(state => state.calendar);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const dispatch = useTypeDispatch();
  
  useEffect(() => {
    dispatch(fetchUserCalenders());
    dispatch(fetchEventsData({ app }));
  }, []);

  const handleAppointmentDelete = () => {
    deleteCalendarData(deleting?.id || "");
  }

  return <Paper sx={{ flex: 1 }}>
    <Grid container spacing={2} height="100%">
      {showSideBar && (
        <Grid item xs={3}>
          <DatePicker events={events} />
          <hr />
          <UserCalenders />
        </Grid>
      )}
      <Grid item xs={showSideBar ? 9 : 12}>
        <div>
          <Scheduler
            events={events}
            ref={ref}
          />
        </div>
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