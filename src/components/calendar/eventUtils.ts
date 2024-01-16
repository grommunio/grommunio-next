import moment from "moment";
import { ExtendedEvent } from "../../types/calendar";
import { capitalizeFirstLetter, utcTimeToUserTimezone } from "../../utils";


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
      calculateAbsoluteRecurrence("days", cur, outputArray);
      break;
    }
    case "absoluteMonthly": {
      calculateAbsoluteRecurrence("months", cur, outputArray);
      break;
    }
    case "absoluteYearly": {
      calculateAbsoluteRecurrence("years", cur, outputArray);
      break;
    }
    case "relativeMonthly": {
      calculateRelativeMonthlyRecurrence(cur, outputArray);
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
  const originalStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  // Can't copy because pointers
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();
  // Get date of event day of current week
  // TODO: Consider weekday of recurring event: const currentWeekdayIndex = getWeekdayIndex(pattern.daysOfWeek?.[0]) // TODO: Support multiple days
  while(!currentStartDate?.isAfter(recurringEndDate)) {

    pattern?.daysOfWeek?.forEach(weekday => {
      const dayOfCurrentWeek = moment(currentStartDate).day(capitalizeFirstLetter(weekday));

      if(!dayOfCurrentWeek.isSame(originalStartDate, 'day')) {
        const isoStart = dayOfCurrentWeek.toISOString();
        const isoEnd = dayOfCurrentWeek.toISOString();
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
    });

    // Go to next week
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "week");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "week");
    
  }
}


function calculateAbsoluteRecurrence(type: any, cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const { pattern, range } = cur.recurrence || {};
  const recurringEndDate = moment(range?.endDate);
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();
  while(!currentStartDate?.isAfter(recurringEndDate)) {

    // Go to next interval
    currentStartDate = currentStartDate.add(pattern?.interval || 1, type);
    currentEndDate = currentEndDate.add(pattern?.interval || 1, type);

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


function calculateRelativeMonthlyRecurrence(cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const { pattern, range } = cur.recurrence || {};
  const recurringEndDate = moment(range?.endDate);
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();

  const eventDuration = currentEndDate.diff(currentStartDate, "minutes");

  while(!currentStartDate?.isAfter(recurringEndDate)) {
    // Go to next interval
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "months");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "months");

    const firstDayOfCurrentMonth = currentStartDate.date(1);
    const firstWeekdayOfMonth = currentStartDate.format("dddd").toLowerCase();
    // const weekNumberOfFirstDay = firstDayOfCurrentMonth.week();

    const expectedWeekday = pattern?.daysOfWeek?.[0] || "monday" // TODO: Support multiple

    const dayDifferenceBetweenFirstAndDesiredWeekday = weekdayDifference(firstWeekdayOfMonth, expectedWeekday);

    let expectedDay = firstDayOfCurrentMonth.add(dayDifferenceBetweenFirstAndDesiredWeekday, "days");
    switch (pattern?.index) {
    case "first": {
      break;
    }
    case "second": {
      expectedDay = expectedDay.add(1, "week");
      break;
    }
    case "third": {
      expectedDay = expectedDay.add(2, "week");
      break;
    }
    default:
      break;
    }

    const isoStart = expectedDay.toISOString();
    const isoEnd = expectedDay.add(eventDuration, "minutes").toISOString();
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


function weekdayDifference(a: string, b: string) {
  const days: any = {
    "sunday": 0,
    "monday": 1,
    "tuesday": 2, 
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6,
  };
  return days[b] - days[b];
}
