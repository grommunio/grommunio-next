import { ExtendedEvent } from "../../../types/calendar";
import AttendeeAppointmentForm from "../AttendeeAppointmentForm";
import OrganizerAppointmentForm from "../OrganizerAppointmentForm";

type EventDetailsT = {
  event: ExtendedEvent;
  onClose: () => void;
}

const EventDetails = ({ event, onClose }: EventDetailsT) => {
  const { isOrganizer, id } = event;
  return isOrganizer || !id ? <OrganizerAppointmentForm event={event} onClose={onClose}/>
    : <AttendeeAppointmentForm event={event} onClose={onClose}/>
}

export default EventDetails;
