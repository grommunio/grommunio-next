// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH]
import { Event } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_EVENTS_DATA,
  FETCH_USER_CALENDER_DATA,
  POST_CALENDAR_DATA,
  DELETE_CALENDAR_DATA,
  PATCH_CALENDAR_DATA,
  PATCH_EVENT_DATA,
  POST_EVENT_DATA,
  DELETE_EVENT_DATA
} from '../actions/types';
import { addItem, editItem } from '../utils';
import { ExtendedEvent } from '../types/calendar';

interface IUserCalender {
  id: string;
  name: string;
  isDisabled:boolean;
}

type CalendarState = {
  events: Array<ExtendedEvent>;
  calendars: Array<IUserCalender>;
}

const defaultState = {
  events: [],
  calendars: [],
};

const disableCondition = (calendar: IUserCalender) => {
  return !(calendar.name === "Calendar" || calendar.name === "Birthdays");
};

function formatEvent(rawEvent: Event, color=undefined): ExtendedEvent {
  return {
    color,
    ...rawEvent,
    // `start` and `end` are overwritten by schedular component
    startDate: rawEvent.start,
    endDate: rawEvent.end,
    // Add schedular properties
    id: rawEvent.id,
    event_id: rawEvent.id,
    title: rawEvent.subject || "",
    notes: rawEvent.body?.content || '',
    allDay: rawEvent.isAllDay || false,
  };
}

function formatEvents(rawEvents: Array<Event>, color=undefined): Array<ExtendedEvent> {
  return rawEvents.map((rawEvent: Event) => (formatEvent(rawEvent, color)))
}

// Modify your reducer to use these types
function calendarReducer(state: CalendarState = defaultState, action: AnyAction): CalendarState {
  switch (action.type) {

  case FETCH_EVENTS_DATA:
    return {
      ...state,
      events: action.payload ? formatEvents(action.payload, action.calendar?.color) : [],
    };

  case FETCH_USER_CALENDER_DATA:
    return {
      ...state,
      calendars: action.payload ? action.payload.map((calendar: IUserCalender) => ({
        ...calendar,
        isDisabled: disableCondition(calendar)})) : [],
    };

  case POST_CALENDAR_DATA: {
    const newItemWithIsDisabled = { ...action.payload, isDisabled: true,};
    return { ...state, calendars: addItem(state.calendars, newItemWithIsDisabled),};
  }

  case PATCH_CALENDAR_DATA: {
    // Find the index of the calendar item to be updated in the calendars array
    const updatedIndex = state.calendars.findIndex((calendar: IUserCalender) => calendar.id === action.payload.id);

    if (updatedIndex === -1) {
      // If the calendar item is not found, return the current state
      return state;
    }

    // Create a new array with the updated calendar item
    const updatedCalendars: any = [...state.calendars];
    const updatedItem: IUserCalender = {
      ...(state.calendars[updatedIndex] as IUserCalender),
      ...(action.payload as IUserCalender),
    };

    updatedCalendars[updatedIndex] = updatedItem;
    
    return { ...state, calendars: updatedCalendars};
  }

  case PATCH_EVENT_DATA:
    return {
      ...state,
      events: editItem(state.events, formatEvent(action.payload)),
    }

  case POST_EVENT_DATA:
    return {
      ...state,
      events: addItem(state.events, formatEvent(action.payload)),
    }

  case DELETE_EVENT_DATA:
    return {
      ...state,
      events: action.payload ? state.events.filter((event: Event) => event.id !== action.payload) : state.events,
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