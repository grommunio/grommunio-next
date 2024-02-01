import { Dialog } from "@mui/material";
import { ExtendedEvent } from "../../../types/calendar";
import AttendeeAppointmentForm from "../AttendeeAppointmentForm";
import OrganizerAppointmentForm from "../OrganizerAppointmentForm";

type EventDetailsT = {
  event: ExtendedEvent;
  onClose: () => void;
}

const EventDetails = ({ event, onClose }: EventDetailsT) => {
  return <Dialog open maxWidth="lg" onClose={onClose}>
    {event.isOrganizer ? <OrganizerAppointmentForm event={event} onClose={onClose}/>
      : <AttendeeAppointmentForm event={event} onClose={onClose}/>}
  </Dialog>
}

export default EventDetails;
