import { Scheduler as ReactSchedular } from "@aldabil/react-scheduler";
import type { ProcessedEvent, SchedulerRef } from "@aldabil/react-scheduler/types";
import { Event } from "microsoft-graph";
import { ForwardedRef, forwardRef, useMemo } from "react";
import AppointmentForm from "./AppointmentForm";
import { useTypeDispatch } from "../../store";
import { deleteEventData } from "../../actions/calendar";


type SchedularType = {
  events: Array<Event>;
}

const Schedular = forwardRef(({ events }: SchedularType, ref ) => {
  const dispatch = useTypeDispatch();

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

  return <div>
    <ReactSchedular
      events={processedEvents as Array<ProcessedEvent>}
      height={1000}
      onDelete={handleDelete}
      view="month"
      disableViewNavigator
      ref={ref as ForwardedRef<SchedulerRef>}
      editable={true}
      customEditor={(scheduler) => <AppointmentForm schedular={scheduler}/>}
      fields={[
        { name: "id", type: "hidden" },
        { name: "subject", type: "input" },
        { name: "webLink", type: "input" },
        { name: "body", type: "input" },
        { name: "location", type: "input" },
        { name: "isAllDay", type: "hidden" },
        { name: "attendees", type: "hidden" }
      ]}
    />
  </div>;
});

export default Schedular;