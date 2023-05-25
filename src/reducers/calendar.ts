// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_EVENTS_DATA,
  FETCH_CALENDARS_REQUEST,
  FETCH_CALENDARS_SUCCESS,
  FETCH_CALENDARS_FAILURE,
} from '../actions/types';

const defaultState = {
  events: [],
  calendars: [],
  loading: false,
  error: null,
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
  case FETCH_CALENDARS_REQUEST:
    return {
      ...state,
      loading: true,
      error: null,
    };
  case FETCH_CALENDARS_SUCCESS:
    return {
      ...state,
      loading: false,
      calendars: action.payload,
    };
  case FETCH_CALENDARS_FAILURE:
    return {
      ...state,
      loading: false,
      error: action.error,
    };
  default:
    return state;
  }
}

export default calendarReducer;