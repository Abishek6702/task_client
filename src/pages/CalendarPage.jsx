import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Badge } from '../components/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/calendar');
        setEvents(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getEventsForDay = (day) => {
    return events.filter(e => {
      if (!e.date) return false;
      if (!isSameDay(new Date(e.date), day)) return false;
      if (filterType !== 'all' && e.type !== filterType) return false;
      return true;
    });
  };

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-500 mt-0.5">View project and task deadlines.</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field py-1 text-sm w-auto">
          <option value="all">All Events</option>
          <option value="project">Projects Only</option>
          <option value="task">Tasks Only</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-md overflow-hidden border border-slate-100">
              {/* Padding cells */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-white min-h-[80px]" />
              ))}
              {/* Day cells */}
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)}
                    className={`bg-white min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 ring-1 ring-inset ring-brand-300' : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                      isToday(day) ? 'bg-brand-600 text-white' : 'text-slate-700'
                    }`}>{format(day, 'd')}</p>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ev.type === 'project') navigate(`/projects/${ev.id}`);
                            else navigate(`/tasks/me`); // Or task detail modal
                          }}
                          className={`text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            ev.type === 'project' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel: selected date events or upcoming */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Upcoming Events'}
            </h3>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-slate-400">Loading events...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(selectedDate ? selectedEvents : events.filter(e => e.date && new Date(e.date) >= new Date()).slice(0, 10)).map(ev => (
                <div 
                  key={`${ev.id}-${ev.type}`} 
                  onClick={() => {
                    if (ev.type === 'project') navigate(`/projects/${ev.id}`);
                    else navigate(`/tasks/me`);
                  }}
                  className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${ev.type === 'project' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">{ev.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ev.type === 'project' ? '📁 Project' : '✓ Task'} · {ev.date && format(new Date(ev.date), 'MMM d')}
                      </p>
                    </div>
                    <Badge label={ev.status} />
                  </div>
                </div>
              ))}
              {!selectedDate && events.filter(e => e.date && new Date(e.date) >= new Date()).length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-400">No upcoming events.</div>
              )}
              {selectedDate && selectedEvents.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-400">No events on this date.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
