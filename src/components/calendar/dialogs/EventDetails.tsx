import { Dialog } from "@mui/material";
import { ExtendedEvent } from "../../../types/calendar";
import AttendeeAppointmentForm from "../AttendeeAppointmentForm";
import OrganizerAppointmentForm from "../OrganizerAppointmentForm";

type EventDetailsT = {
  event: ExtendedEvent;
  onClose: () => void;
}

const EventDetails = ({ event, onClose }: EventDetailsT) => {
  const { isOrganizer, id } = event;
  return <Dialog open maxWidth="lg" onClose={onClose}>
    {isOrganizer || !id ? <OrganizerAppointmentForm event={event} onClose={onClose}/>
      : <AttendeeAppointmentForm event={event} onClose={onClose}/>}
  </Dialog>
}

export default EventDetails;
