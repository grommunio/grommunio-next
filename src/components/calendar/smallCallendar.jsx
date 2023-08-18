import * as React from 'react';
import dayjs from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import { styled } from '@mui/material/styles';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

dayjs.extend(isBetweenPlugin);

const CustomPickersDay = styled(PickersDay, {
  
  shouldForwardProp: (prop) =>
    prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: '#64B5F6',
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: '#2196F3',
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(isLastDay && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}));

export default function smallCallendarDay(props) {

  const { day, appointments, ...other } = props;

  if (appointments == null) {
    return <PickersDay day={day} {...other} />;
  }

  const dayIsBetween = appointments.some((element)=> day.isBetween(element.startDate, element.endDate, null, '[]')) ;
  const isFirstDay = appointments.some((element)=> day.isSame(element.startDate, 'day')) ;
  const isLastDay = appointments.some((element)=> day.isSame(element.endDate, 'day')) ;

  return (
    <CustomPickersDay
      {...other}
      day={day}
      sx={dayIsBetween ? { px: 2.5, mx: 0 } : {}}
      dayIsBetween={dayIsBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
    />
  );
}

