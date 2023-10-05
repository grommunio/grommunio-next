// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH]
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_EVENTS_DATA,
  FETCH_USER_CALENDER_DATA,
  POST_CALENDAR_DATA,
  DELETE_CALENDAR_DATA,
} from '../actions/types';
import { addItem } from '../utils';

interface IUserCalender {
  id: string;
  name: string;
  isDisabled:boolean;
}

const defaultState = {
  events: [],
  calendars: [],
};

//TODO: Properly implement this function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateEventtimeInTimezone(event: string, tz: string) {
  return event;
}
const disableCondition = (calendar: IUserCalender) => {
  return !(calendar.name === "Calendar" || calendar.name === "Birthdays");
};

function formatEvents(rawEvents: Array<Event>) {
  return rawEvents.map((rawEvent: Event) => ({
    id: rawEvent.id,
    startDate: calculateEventtimeInTimezone(rawEvent.start?.dateTime || '', rawEvent.start?.timeZone || ''),
    endDate: calculateEventtimeInTimezone(rawEvent.end?.dateTime || '', rawEvent.end?.timeZone || ''),
    subject: rawEvent.subject,
    title: rawEvent.subject,
    location: rawEvent.location?.displayName || '',
    notes: rawEvent.body?.content || '',
  }))
}

// Modify your reducer to use these types
function calendarReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_EVENTS_DATA + "/fulfilled":
    return {
      ...state,
      events: action.payload ? formatEvents(action.payload) : [],
    };

  case FETCH_USER_CALENDER_DATA:
    return {
      ...state,
      calendars: action.payload ? action.payload.map((calendar: IUserCalender) => ({
        id: calendar.id,
        name: calendar.name,
        isDisabled: disableCondition(calendar)})) : [],
    };

  case POST_CALENDAR_DATA: {
    const newItemWithIsDisabled = { ...action.payload, isDisabled: true,};
    return { ...state, calendars: addItem(state.calendars, newItemWithIsDisabled),};
  }

  case DELETE_CALENDAR_DATA:
    return {
      ...state,
      calendars: action.payload ? state.calendars.filter((calender: IUserCalender) => calender.id !== action.payload) : state.calendars,
    };
    
  default:
    return state;
  }
}

export default calendarReducer;