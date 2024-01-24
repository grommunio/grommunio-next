import moment, { Moment } from "moment";
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
    case "relativeYearly": {
      calculateRelativeYearlyRecurrence(cur, outputArray);
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
  while(currentStartDate && !currentStartDate.isAfter(recurringEndDate)) {

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
  while(currentStartDate && !currentStartDate.isAfter(recurringEndDate)) {

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

  while(currentStartDate && !currentStartDate.isAfter(recurringEndDate)) {
    // Go to next interval
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "months");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "months");

    const firstDayOfCurrentMonth = currentStartDate.date(1);
    const firstWeekdayOfMonth = firstDayOfCurrentMonth.format("dddd").toLowerCase();

    // For each weekday in recurrence
    pattern?.daysOfWeek?.forEach(expectedWeekday => {
      const dayDifferenceBetweenFirstAndDesiredWeekday = weekdayDifference(firstWeekdayOfMonth, expectedWeekday);
  
      let expectedDay = firstDayOfCurrentMonth.add(dayDifferenceBetweenFirstAndDesiredWeekday, "days");
      switch (pattern?.index) {
      case "first": {
        break;
      }
      case "second": {
        expectedDay = expectedDay.add(1, "weeks");
        break;
      }
      case "third": {
        expectedDay = expectedDay.add(2, "weeks");
        break;
      }
      case "fourth": {
        expectedDay = expectedDay.add(3, "weeks");
        break;
      }
      case "last": {
        let nextWeek = expectedDay.add(3, "weeks").clone();
        while(expectedDay.month() === nextWeek.month()) {
          nextWeek = nextWeek.add(1, "weeks");
        }
        expectedDay = nextWeek.subtract(1, "week");
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
    });

  }
}


function calculateRelativeYearlyRecurrence(cur: ExtendedEvent, outputArray: Array<ExtendedEvent>) {
  const { pattern, range } = cur.recurrence || {};
  const recurringEndDate = moment(range?.endDate);
  let currentStartDate = utcTimeToUserTimezone(cur.startDate) || moment();
  let currentEndDate = utcTimeToUserTimezone(cur.endDate) || moment();

  const eventDuration = currentEndDate.diff(currentStartDate, "minutes");

  while(currentStartDate && !currentStartDate.isAfter(recurringEndDate)) {
    // Go to next interval
    currentStartDate = currentStartDate.add(pattern?.interval || 1, "years");
    currentEndDate = currentEndDate.add(pattern?.interval || 1, "years");

    const firstDayOfCurrentMonth = currentStartDate.date(1);
    const firstWeekdayOfMonth = firstDayOfCurrentMonth.format("dddd").toLowerCase();

    // For each weekday in recurrence
    pattern?.daysOfWeek?.forEach(expectedWeekday => {
      const dayDifferenceBetweenFirstAndDesiredWeekday = weekdayDifference(firstWeekdayOfMonth, expectedWeekday);
  
      let expectedDay = firstDayOfCurrentMonth.add(dayDifferenceBetweenFirstAndDesiredWeekday, "days");
      switch (pattern?.index) {
      case "first": {
        break;
      }
      case "second": {
        expectedDay = expectedDay.add(1, "weeks");
        break;
      }
      case "third": {
        expectedDay = expectedDay.add(2, "weeks");
        break;
      }
      case "fourth": {
        expectedDay = expectedDay.add(3, "weeks");
        break;
      }
      case "last": {
        let nextWeek = expectedDay.add(3, "weeks").clone();
        while(expectedDay.month() === nextWeek.month()) {
          nextWeek = nextWeek.add(1, "weeks");
        }
        expectedDay = nextWeek.subtract(1, "week");
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
  const diff = days[b] - days[a];
  // Because there is no modulo in JS >:(
  return diff < 0 ? 7 + diff : diff;
}


export function getWeekday(moment: Moment) {
  const weekday = moment.day();

  return {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
  }[weekday];
}


export function getMonth(moment: Moment) {
  const weekday = moment.month();

  return {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  }[weekday];
}
