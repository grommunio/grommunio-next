import moment from "moment";
import { ExtendedEvent } from "../../types/calendar";
import { utcTimeToUserTimezone } from "../../utils";


export function calculateRecurringEvents(cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const rec = cur.recurrence;
  if(rec) {
    const { pattern } = rec || {};
    switch (pattern?.type) {
    case "weekly": {
      calculateWeeklyRecurrence(cur, outputArray);
      break;
    }
    case "daily": {
      calculateDailyRecurrence(cur, outputArray);
      break;
    }
    default:
      break;
    }
  }
}


function calculateWeeklyRecurrence(cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const { pattern, range } = cur.recurrence || {};
  const recurringEndDate = moment(range?.endDate);
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();
  // Get date of event day of current week
  // TODO: Consider weekday of recurring event: const currentWeekdayIndex = getWeekdayIndex(pattern.daysOfWeek?.[0]) // TODO: Support multiple days
  while(currentStartDate?.isBefore(recurringEndDate) && !currentStartDate.isSame(recurringEndDate)) {

    // Go to next week
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "week");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "week");

    const isoStart = currentStartDate.toISOString();
    const isoEnd = currentEndDate.toISOString();
    // Add this date to events
    outputArray.push({
      ...cur,
      startDate: {
        ...cur.startDate,
        dateTime: isoStart,
      },
      endDate: {
        ...cur.startDate,
        dateTime: isoEnd,
      },
      start: {
        ...cur.startDate,
        dateTime: isoStart,
      },
      end: {
        ...cur.startDate,
        dateTime: isoEnd,
      }
    });
  }
}


function calculateDailyRecurrence(cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const { pattern, range } = cur.recurrence || {};
  const recurringEndDate = moment(range?.endDate);
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();
  while(currentStartDate?.isBefore(recurringEndDate) && !currentStartDate.isSame(recurringEndDate)) {

    // Go to next week
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "days");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "days");

    const isoStart = currentStartDate.toISOString();
    const isoEnd = currentEndDate.toISOString();
    // Add this date to events
    outputArray.push({
      ...cur,
      startDate: {
        ...cur.startDate,
        dateTime: isoStart,
      },
      endDate: {
        ...cur.startDate,
        dateTime: isoEnd,
      },
      start: {
        ...cur.startDate,
        dateTime: isoStart,
      },
      end: {
        ...cur.startDate,
        dateTime: isoEnd,
      }
    });
  }
}