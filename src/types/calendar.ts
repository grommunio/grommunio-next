import { DateTimeTimeZone, Event, NullableOption } from "microsoft-graph";
import { Moment } from "moment";

export enum EventReponseType {
  accept = "accept",
  tentatively = "tentativelyAccept",
  decline = "decline",
}

export type ExtendedEvent = Event & {
  endDate: NullableOption<DateTimeTimeZone> | undefined;
  startDate: NullableOption<DateTimeTimeZone> | undefined;
  event_id: string | undefined;
  color: string | undefined;
  title: string | undefined;
  notes: string | undefined;
  allDay: boolean;
  calendarId: string;
};


export type NewEvent = Event & {
  start?: Moment;
  end?: Moment;
  location?: string;
}
