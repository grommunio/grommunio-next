// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_EVENTS_DATA,
} from '../actions/types';

const defaultState = {
  events: [],
};

//TODO: Properly implement this function
function calculateEventtimeInTimezone(event: string, tz: string) {
  return event;
}

function formatEvents(rawEvents: Array<Event>) {
  return rawEvents.map((rawEvent: Event) => ({
    ...rawEvent,
    startDate: calculateEventtimeInTimezone(rawEvent.start?.dateTime || '', rawEvent.start?.timeZone || ''),
    endDate: calculateEventtimeInTimezone(rawEvent.end?.dateTime || '', rawEvent.end?.timeZone || ''),
    title: rawEvent.subject,
  }))
}

function calendarReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_EVENTS_DATA + "/fulfilled":
    return {
      ...state,
      events: action.payload ? formatEvents(action.payload) : [],
    };

  default:
    return state;
  }
}

export default calendarReducer;