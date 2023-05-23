import { useState, useEffect } from 'react';
import { useAppContext} from '../../azure/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTypeDispatch } from '../../store';
import { fetchAvailableCalendars } from '../../actions/calendar';
import Button from '@mui/material/Button';
import "./calender.css"; 
import { faChevronRight, faChevronDown, faCalendarPlus } from '@fortawesome/free-solid-svg-icons';


interface Calendar {
  id: string;
  name: string;
  color: string;
  hexColor: string;
  isDefaultCalendar: boolean;
  changeKey: string;
  canShare: boolean;
  canViewPrivateItems: boolean;
  canEdit: boolean;
  allowedOnlineMeetingProviders: string[];
  defaultOnlineMeetingProvider: string;
  isTallyingResponses: boolean;
  isRemovable: boolean;
  owner: {
    name: string;
    address: string;
  };
}

export default function CalendarView() {
  const app = useAppContext();
  const dispatch = useTypeDispatch();
  const [data, setData ] = useState<Array<Calendar>>();
  // eslint-disable-next-line
  const [selectedCalendar, setSelectedCalendar] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchAvailableCalendars(app))
      .then((result) => {
        const ourData = result.payload;
        setData(ourData as Array<Calendar>);
      })   
  }, [app.authProvider]);

  function arrayColumn(arr: any[], columnName: string | number) {
    return arr.map(function(row) {
      return row[columnName];
    });
  }

  const toggleCalendar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCalendarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    if (checked) {
      setSelectedCalendar((prevSelectedCalendar) => [...prevSelectedCalendar, value]);
    } else {
      setSelectedCalendar((prevSelectedCalendar) =>
        prevSelectedCalendar.filter((calendar) => calendar !== value)
      );
    }
  };

  function renderCalendarsDropdown() {
    if (data != null) {
      const calendarNames = arrayColumn(data, 'name');
      return (
        <>
          <div className='toggle-button myCalenders' onClick={toggleCalendar}>
            <FontAwesomeIcon  icon={isExpanded ? faChevronRight : faChevronDown}  className='toggle-icon'
            />
            <div>My Calenders</div>          
          </div>
          <div className={`names ${isExpanded ? 'expanded' : ''}`} >
            <ul style={{ listStyleType: 'none' }}>
              {calendarNames.map((name) => (
                <li key={name} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    value={name}
                    onChange={handleCalendarChange}
                    style={{ marginRight: '5px' }}
                  />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </>
      );
    }
    return null;
  }

  function handleAddCalendar() {
    return (<></>)
  }

  return (
    <>
      <Button onClick={handleAddCalendar} className="addCalendar">
        <FontAwesomeIcon icon={faCalendarPlus} />
        Add Calendar
      </Button>
      {renderCalendarsDropdown()}
    </>
  );
}