import { Scheduler as ReactSchedular } from "@aldabil/react-scheduler";
import type { ProcessedEvent, SchedulerRef } from "@aldabil/react-scheduler/types";
import { Event } from "microsoft-graph";
import { ForwardedRef, forwardRef, useMemo, useState } from "react";
import { useTypeDispatch } from "../../store";
import { deleteEventData } from "../../actions/calendar";
import EventDetails from "./dialogs/EventDetails";
import EventPopper from "./EventPopper";
import { ExtendedEvent } from "../../types/calendar";
import AddEvent from "./dialogs/AddEvent";
import moment from "moment";


type SchedularType = {
  events: Array<ExtendedEvent>;
}

const Schedular = forwardRef(({ events }: SchedularType, ref ) => {
  const dispatch = useTypeDispatch();
  const [dialogOpen, setDialogOpen] = useState<ExtendedEvent | null>(null);

  const processedEvents = useMemo(() => {
    const eventsWithRecurrences = events.reduce((acc: Array<ExtendedEvent>, cur: ExtendedEvent) => {
      const newArray = acc.concat(cur);
      const rec = cur.recurrence;
      const recurringDates = [];
      if(cur.recurrence) {
        const { pattern, range } = rec || {};
        // Calculate recurring event dates
        // TODO: Currently only implemented for weekly events. This will be a ton of work to get to work completely.
        const recurringEndDate = moment(range?.endDate);
        if(pattern?.type === "weekly") {
          let currentStartDate = moment(cur.startDate?.dateTime);
          let currentEndDate = moment(cur.endDate?.dateTime);
          // Get date of event day of current week
          // TODO: Consider weekday of recurring event: const currentWeekdayIndex = getWeekdayIndex(pattern.daysOfWeek?.[0]) // TODO: Support multiple days
          while(currentStartDate.isBefore(recurringEndDate) && !currentStartDate.isSame(recurringEndDate)) {

            // Go to next week
            currentStartDate = currentStartDate.add(pattern.interval, "week");
            currentEndDate = currentEndDate.add(pattern.interval, "week");

            // Add this date to events
            recurringDates.push({
              ...cur,
              startDate: {
                ...cur.startDate,
                dateTime: currentStartDate.toISOString(),
              },
              endDate: {
                ...cur.startDate,
                dateTime: currentEndDate.toISOString(),
              },
              start: {
                ...cur.startDate,
                dateTime: currentStartDate.toISOString(),
              },
              end: {
                ...cur.startDate,
                dateTime: currentEndDate.toISOString(),
              }
            });
          }
        }
      }

      return [...newArray, ...recurringDates];
    }, []);

    return eventsWithRecurrences.map((event: Event) => ({
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

  return <div>
    <ReactSchedular
      events={processedEvents as Array<ProcessedEvent>}
      height={1000}
      onDelete={handleDelete}
      view="month"
      disableViewNavigator
      ref={ref as ForwardedRef<SchedulerRef>}
      editable={true}
      customViewer={(event, onClose) => <EventPopper
        event={event as unknown as ExtendedEvent}
        onClose={onClose}
        handleDialog={handleDialog}
      />}
      customEditor={(scheduler) => <AddEvent scheduler={scheduler}/>}
      fields={[
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
        { name: "organizer", type: "hidden" }
      ]}
    />
    {dialogOpen && <EventDetails event={dialogOpen} onClose={handleDialog(null)}/>}
  </div>;
});

export default Schedular;