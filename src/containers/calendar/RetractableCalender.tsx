import { useState } from 'react';
import Calendar from 'react-calendar';
import { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "./calender.css"; 

// Add the icons to the library
export const ourLibrary = library.add(faChevronRight, faChevronDown);

export function RetractableCalendar (){
  const [date, setDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  // eslint-disable-next-line
  const handleDateChange = (value: Value | null, event: React. MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (value !== null) {
      const date = value instanceof Date ? value : value[0];
      setDate(date as Date);
    }
  };


  const renderTileContent = ({ date }: { date: Date }) => {
    const isSelected = date && date.toDateString() === date.toDateString();

    const handleClick = () => {
      if (isSelected) {
        setDate(date); // Select the date if it's not already selected
      }
    };

    const classNames = ['calendar-day'];
    if (!isSelected) {
      classNames.push('selected');
    }

    return (
      <div className={classNames.join(' ')} onClick={handleClick}>
      </div>
    );
  };

  const toggleCalendar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className='calendar-container'>
        <div className='toggle-button' onClick={toggleCalendar}>
          <FontAwesomeIcon  icon={isExpanded ? faChevronRight : faChevronDown}  className='toggle-icon'
          />
        </div>
        <div className={`app ${isExpanded ? 'expanded' : ''}`}>
          <Calendar onChange={handleDateChange} value={date} tileContent={renderTileContent}  />
        </div>  
      </div>
    </>
  );
}


