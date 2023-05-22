// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
<<<<<<< HEAD
  FETCH_EVENTS_DATA, FETCH_USER_CALENDER,
=======
  FETCH_EVENTS_DATA,
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
} from '../actions/types';

const defaultState = {
  events: [],
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
<<<<<<< HEAD
  case FETCH_USER_CALENDER + "/fulfilled":
    return {
      ...state,
      mails: action.payload ?? [],
    };
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15

  default:
    return state;
  }
}

export default calendarReducer;