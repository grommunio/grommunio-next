import { Scheduler as ReactSchedular } from "@aldabil/react-scheduler";
import type { ProcessedEvent, SchedulerRef } from "@aldabil/react-scheduler/types";
import { Event } from "microsoft-graph";
import { ForwardedRef, forwardRef, useMemo } from "react";
import AppointmentForm from "./AppointmentForm";


type SchedularType = {
  events: Array<Event>;
}

const Schedular = forwardRef(({ events }: SchedularType, ref ) => {

  const processedEvents = useMemo(() => {
    return events.map((event: Event) => ({
      ...event,
      start: new Date(event.start?.dateTime || ""),
      end: new Date(event.end?.dateTime || ""),
    }));
  }, [events]);

  return <div>
    <ReactSchedular
      events={processedEvents as Array<ProcessedEvent>}
      height={1000}
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
      ]}
    />
  </div>;
});

export default Schedular;