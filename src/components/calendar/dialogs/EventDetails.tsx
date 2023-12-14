import AttendeeAppointmentForm from "../AttendeeAppointmentForm";
import OrganizerAppointmentForm from "../OrganizerAppointmentForm";
import { SchedulerHelpers } from "@aldabil/react-scheduler/types";

type EventDetailsT = {
  scheduler: SchedulerHelpers;
}

const EventDetails = ({ scheduler }: EventDetailsT) => {
  const { isOrganizer, id } = scheduler.state;
  return isOrganizer.value || !id.value ? <OrganizerAppointmentForm scheduler={scheduler} />
    : <AttendeeAppointmentForm scheduler={scheduler} />
}

export default EventDetails;
