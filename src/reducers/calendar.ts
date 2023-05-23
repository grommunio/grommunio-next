// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_CALENDERS_DATA,
  FETCH_EVENTS_DATA,
} from '../actions/types';

const defaultState = {
  events: [],
  calendars: []
};

//TODO: Properly implement this function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateEventtimeInTimezone(event: string, tz: string) {
  return event;
}

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

function calendarReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_EVENTS_DATA + "/fulfilled":
    return {
      ...state,
      events: action.payload ? formatEvents(action.payload) : [],
    };

    case FETCH_CALENDERS_DATA + "/fulfilled":
    return {
      ...state,
      calendars: action.payload ? action.payload : [],
    };

  default:
    return state;
  }
}

export default calendarReducer;
