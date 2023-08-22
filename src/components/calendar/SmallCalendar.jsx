import * as React from "react";
import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import { styled } from "@mui/material/styles";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";

dayjs.extend(isBetweenPlugin);
// Illd make this code more readable

const addStyleToComponent = ({ theme, colorStyle, day }) => {
  const styling = {
    backgroundColor: "#64B5F6",
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: "#2196F3",
    }
  }
  if (colorStyle === "box" ){
    styling["borderRadius"] = 0
  }
  else if (colorStyle === "circle-box"){
    styling["borderRadius"] = "50% 0 0 50%"
  }
  else if (colorStyle === "box-circle"){
    styling["borderRadius"] = "0 50% 50% 0"
  }
  return colorStyle && styling

}
const shouldForwardCustomPickerProp = (prop) => !["colorStyle"].includes(prop)
const CustomPickersDayV2 = styled(PickersDay, { shouldForwardProp: shouldForwardCustomPickerProp })(addStyleToComponent)



export default function SmallCalendarDay(props) {
  const { day, appointments, ...other } = props;

  if (appointments == null) {
    return <PickersDay day={day} {...other} />;
  }

  const dayIsBetween = appointments.some((element) =>
    dayjs(day).isBetween(element.startDate, element.endDate, "day")
  );

  const isFirstDay = appointments.some((element) => {
    const isSameDay =  dayjs(element.startDate).isSame(element.endDate, "day")
    return !isSameDay && dayjs(day).isSame(element.startDate, "day")
  });

  const isLastDay = appointments.some((element) =>{
    const isSameDay =  dayjs(element.startDate).isSame(element.endDate, "day")
    return !isSameDay && dayjs(day).isSame(element.endDate, "day")
  });

  const isOnlyDay = appointments.some((element) => {
    const isSameDay =  dayjs(element.startDate).isSame(element.endDate, "day")
    return isSameDay && dayjs(day).isSame(element.startDate, "day")
  })

  let colorStyle = null
  if (dayIsBetween){
    colorStyle = "box"
  }
  else if (isFirstDay) {
    colorStyle = "circle-box"
  }
  else if (isLastDay) {
    colorStyle = "box-circle"
  }
  else if (isOnlyDay) {
    colorStyle = "circle"
  }

  const customStyles = dayIsBetween || isFirstDay || isLastDay ? { px: 2.5, mx: 0 } : {};

  return (
    <CustomPickersDayV2
      {...other}
      day={day}
      sx={customStyles}
      colorStyle={colorStyle}
    />
  );
}
