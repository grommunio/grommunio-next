import { Grid, Paper } from "@mui/material";
import { useTypeDispatch, useTypeSelector } from "../../store";
import UserCalenders from "./UserCalendars";
import { forwardRef, useEffect } from "react";
import DatePicker from "./DatePicker";
import Scheduler from "./Scheduler";
import { fetchUserCalendars } from "../../actions/calendar";
import ListView from "./ListView";

type SchedularViewType = {
  showSideBar: boolean;
  listViewActive: boolean;
}

const SchedularView = forwardRef(({ showSideBar, listViewActive }: SchedularViewType, ref) => {
  const { events } = useTypeSelector(state => state.calendar);
  const dispatch = useTypeDispatch();
  
  useEffect(() => {
    dispatch(fetchUserCalendars());
  }, []);

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
  </Paper>;
});

export default SchedularView;
