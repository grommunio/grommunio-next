import { DateTimeTimeZone, Event, NullableOption } from "microsoft-graph";

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
};