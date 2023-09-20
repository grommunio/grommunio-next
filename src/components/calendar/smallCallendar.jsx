import * as React from "react";
import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import { styled } from "@mui/material/styles";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";

dayjs.extend(isBetweenPlugin);

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    !["dayIsBetween", "isFirstDay", "isLastDay"].includes(prop),
})(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && !isFirstDay && !isLastDay &&{
    borderRadius:  "0" ,
    backgroundColor: "#64B5F6",
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: "#2196F3",
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: "50% !important",
    borderBottomLeftRadius: "50% !important",
    backgroundColor: "#64B5F6",
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: "#2196F3",
    },
  }),
  ...(isLastDay && {
    borderTopRightRadius: "50% !important",
    borderBottomRightRadius: "50% !important",
    backgroundColor: "#64B5F6",
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: "#2196F3",
    },
  }),
}));

function isDayBetween(day, startDate, endDate) {
  return (
    dayjs(day).isBetween(startDate, endDate, null, "[]") ||
    (dayjs(day).isSame(startDate, "day") &&
      dayjs(day).isBefore(endDate, "day")) ||
    (dayjs(day).isSame(endDate, "day") && dayjs(day).isAfter(startDate, "day"))
  );
}

export default function smallCallendarDay(props) {
  const { day, appointments, ...other } = props;

  if (appointments == null) {
    return <PickersDay day={day} {...other} />;
  }

  const dayIsBetween = appointments.some((element) =>
    isDayBetween(day, element.startDate, element.endDate)
  );

  const isFirstDay = appointments.some((element) =>
    dayjs(day).isSame(element.startDate, "day")
  );

  const isLastDay = appointments.some((element) =>
    dayjs(day).isSame(element.endDate, "day")
  );

  // const isOneDayAppointment = appointments.some((element) =>
  //   dayjs(element.startDate).isSame(element.endDate, "day")
  // );

  // const isSameDay = appointments.some((element) =>
  //   dayjs(day).isSame(element.startDate, 'day') &&
  //   dayjs(day).isSame(element.endDate, 'day')
  // );

  const customStyles = dayIsBetween ? { px: 2.5, mx: 0 } : {};

  return (
    <CustomPickersDay
      {...other}
      day={day}
      sx={customStyles}
      dayIsBetween={dayIsBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
      // isOneDayAppointment={isOneDayAppointment}
      // isSameDay={isSameDay}
    />
  );
}
