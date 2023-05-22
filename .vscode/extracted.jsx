import { DayView, WeekView, MonthView } from '@devexpress/dx-react-scheduler-material-ui';

class dateCalendar extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
          startDayHour: 8,
          endDayHour: 22,
          isNewAppointment: false,
        };
    }

    onViewSwitched({ nextViewName }) {
        this.setState({ currentView: nextViewName });
    }
    
    renderView() {
        const { currentView} = this.state;
    
        switch (currentView) {
        case 'day':
          return <DayView />;
        case 'week':
          return <WeekView />;
        case 'month':
        default:
          return <MonthView />;
        }
    }
          
          render() {
            const {
              currentDate,
              data,
              startDayHour,
              endDayHour,
            } = this.state;

            return (
                    <>
                        <Scheduler data={data} >
                            <ViewState
                                currentDate={currentDate}
                                currentViewName={this.state.currentView}
                                onCurrentViewNameChange={this.onViewSwitched}
                            />
                            <DayView startDayHour={startDayHour} endDayHour={endDayHour} />
                            <WeekView startDayHour={startDayHour} endDayHour={endDayHour} />
                            <MonthView />
                        </Scheduler>
                    </>
            )
        }
}