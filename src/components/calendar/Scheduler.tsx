import { Scheduler as ReactSchedular } from "@aldabil/react-scheduler";
import type { FieldProps, ProcessedEvent, SchedulerRef } from "@aldabil/react-scheduler/types";
import { Event } from "microsoft-graph";
import { ForwardedRef, forwardRef, useMemo, useState } from "react";
import { useTypeDispatch } from "../../store";
import { deleteEventData } from "../../actions/calendar";
import EventDetails from "./dialogs/EventDetails";
import EventPopper from "./EventPopper";
import { ExtendedEvent } from "../../types/calendar";
import AddEvent from "./dialogs/AddEvent";
import EventRenderer from "./EventRenderer";
import { View } from "@aldabil/react-scheduler/components/nav/Navigation";


const eventFields: FieldProps[] = [
  { name: "id", type: "hidden" },
  { name: "subject", type: "input" },
  { name: "startDate", type: "hidden" },
  { name: "endDate", type: "hidden" },
  { name: "webLink", type: "input" },
  { name: "body", type: "input" },
  { name: "location", type: "input" },
  { name: "isAllDay", type: "hidden" },
  { name: "attendees", type: "hidden" },
  { name: "isOrganizer", type: "hidden" },
  { name: "organizer", type: "hidden" },
  { name: "reminderMinutesBeforeStart", type: "hidden" },
  { name: "isReminderOn", type: "hidden" },
  { name: "showAs", type: "hidden" },
  { name: "responseRequested", type: "hidden" },
  { name: "hideAttendees", type: "hidden" },
];


type SchedularType = {
  events: Array<ExtendedEvent>;
}

const Schedular = forwardRef(({ events }: SchedularType, ref ) => {
  const dispatch = useTypeDispatch();
  const [dialogOpen, setDialogOpen] = useState<ExtendedEvent | null>(null);

  const processedEvents = useMemo(() => {
    return events.map((event: Event) => ({
      ...event,
      start: new Date(event.start?.dateTime || ""),
      end: new Date(event.end?.dateTime || ""),
    }));
  }, [events]);

  const handleDelete = async (id: string): Promise<string | number | void> => {
    const success = await dispatch(deleteEventData(id));
    if (success) return id;
  }

  const handleDialog = (event: ExtendedEvent | null) => () => setDialogOpen(event);

  return <div id="schedular-container">
    <ReactSchedular
      events={processedEvents as Array<ProcessedEvent>}
      height={window.innerHeight - 303}
      onDelete={handleDelete}
      view={localStorage.getItem("calendarView") as View || "month"}
      week={{ 
        weekDays: [0, 1, 2, 3, 4, 5, 6], 
        weekStartOn: 0, 
        startHour: 0, 
        endHour: 24,
        step: 60,
        navigation: true,
        disableGoToDay: false
      }}
      day={{
        startHour: 0, 
        endHour: 24, 
        step: 60,
        navigation: true
      }}
      month={{
        weekDays: [0, 1, 2, 3, 4, 5, 6], 
        weekStartOn: 0, 
        startHour: 6,
        endHour: 24,
        navigation: true,
        disableGoToDay: false
      }}
      disableViewNavigator
      ref={ref as ForwardedRef<SchedulerRef>}
      editable={true}
      customViewer={(event, onClose) => <EventPopper
        event={event as unknown as ExtendedEvent}
        onClose={onClose}
        handleDialog={handleDialog}
      />}
      eventRenderer={({ event, ...props }) => <EventRenderer event={event} {...props}/>}
      customEditor={(scheduler) => <AddEvent scheduler={scheduler}/>}
      fields={eventFields}
    />
    {dialogOpen && <EventDetails event={dialogOpen} onClose={handleDialog(null)}/>}
  </div>;
});

export default Schedular;