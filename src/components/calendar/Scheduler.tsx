import { Scheduler as ReactSchedular } from "@aldabil/react-scheduler";
import type { ProcessedEvent, SchedulerRef } from "@aldabil/react-scheduler/types";
import { Event } from "microsoft-graph";
import { ForwardedRef, forwardRef, useMemo, useState } from "react";
import { useTypeDispatch } from "../../store";
import { deleteEventData } from "../../actions/calendar";
import EventDetails from "./dialogs/EventDetails";
import EventPopper from "./EventPopper";
import { ExtendedEvent } from "../../types/calendar";


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