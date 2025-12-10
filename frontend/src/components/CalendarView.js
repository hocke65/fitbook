import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const CalendarView = ({ classes, onClassClick, isClassBooked }) => {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState('week'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    if (language === 'sv') {
      return ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [language]);

  const weekDaysFull = useMemo(() => {
    if (language === 'sv') {
      return ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
    }
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }, [language]);

  const months = useMemo(() => {
    if (language === 'sv') {
      return ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
              'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
    }
    return ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
  }, [language]);

  // Get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Get days for the current view
  const getDaysForView = () => {
    const days = [];

    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);

      // Get the Monday of the first week
      let start = getStartOfWeek(firstDay);

      // Generate 6 weeks (42 days) to cover all possible month layouts
      for (let i = 0; i < 42; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
    } else if (viewMode === 'week') {
      const start = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
    } else {
      days.push(new Date(currentDate));
    }

    return days;
  };

  // Get classes for a specific day
  const getClassesForDay = (day) => {
    return classes.filter(c => {
      const classDate = new Date(c.scheduledAt);
      return classDate.toDateString() === day.toDateString();
    }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  };

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'sv' ? 'sv-SE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language !== 'sv',
      timeZone: 'Europe/Stockholm',
    });
  };

  // Get header text
  const getHeaderText = () => {
    if (viewMode === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
      } else {
        return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${start.getFullYear()}`;
      }
    } else {
      return `${weekDaysFull[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]} ${currentDate.getDate()} ${months[currentDate.getMonth()]}`;
    }
  };

  const days = getDaysForView();
  const today = new Date();

  const isToday = (date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth();
  const isPastDay = (date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateStart < todayStart;
  };
  const isPastClass = (classData) => new Date(classData.scheduledAt) < new Date();

  // Check if booking deadline has passed
  const isDeadlinePassed = (classData) => {
    const deadlineHours = classData.bookingDeadlineHours || 0;
    if (deadlineHours <= 0) return false;
    const deadline = new Date(classData.scheduledAt);
    deadline.setHours(deadline.getHours() - deadlineHours);
    return new Date() > deadline;
  };

  // Hours for day view
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 - 20:00

  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ←
          </button>
          <button className="btn btn-ghost btn-sm" onClick={goToToday}>
            {t('calendar.today')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(1)}>
            →
          </button>
        </div>

        <h2 className="calendar-title">{getHeaderText()}</h2>

        <div className="calendar-view-toggle">
          <button
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            {t('calendar.month')}
          </button>
          <button
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            {t('calendar.week')}
          </button>
          <button
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            {t('calendar.day')}
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="calendar-month">
          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((day, index) => {
              const dayClasses = getClassesForDay(day);
              return (
                <div
                  key={index}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${!isCurrentMonth(day) ? 'other-month' : ''} ${isPastDay(day) ? 'past-day' : ''}`}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                >
                  <span className="day-number">{day.getDate()}</span>
                  <div className="day-classes">
                    {dayClasses.slice(0, 3).map(c => (
                      <div
                        key={c.id}
                        className={`day-class-dot ${isClassBooked(c.id) ? 'booked' : ''}`}
                        title={`${formatTime(c.scheduledAt)} - ${c.title}`}
                      />
                    ))}
                    {dayClasses.length > 3 && (
                      <span className="more-classes">+{dayClasses.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="calendar-week">
          <div className="week-header">
            {days.map((day, index) => (
              <div
                key={index}
                className={`week-day-header ${isToday(day) ? 'today' : ''} ${isPastDay(day) ? 'past-day' : ''}`}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
              >
                <span className="week-day-name">{weekDays[index]}</span>
                <span className="week-day-number">{day.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="week-body">
            {days.map((day, index) => {
              const dayClasses = getClassesForDay(day);
              return (
                <div key={index} className={`week-day-column ${isToday(day) ? 'today' : ''} ${isPastDay(day) ? 'past-day' : ''}`}>
                  {dayClasses.length === 0 ? (
                    <div className="no-classes-indicator">-</div>
                  ) : (
                    dayClasses.map(c => (
                      <div
                        key={c.id}
                        className={`week-class-card ${isClassBooked(c.id) ? 'booked' : ''} ${c.availableSpots <= 0 ? 'full' : ''} ${isPastClass(c) ? 'past-class' : ''} ${isDeadlinePassed(c) ? 'deadline-passed' : ''}`}
                        onClick={() => onClassClick(c)}
                      >
                        <span className="week-class-time">{formatTime(c.scheduledAt)}</span>
                        <span className="week-class-title">{c.title}</span>
                        <span className="week-class-spots">
                          {isPastClass(c) ? t('classes.classPassed') :
                           isDeadlinePassed(c) ? `🔒 ${t('classes.deadlinePassed')}` :
                           c.availableSpots > 0 ? `${c.availableSpots} ${t('calendar.spotsLeft')}` :
                           t('classes.fullyBooked')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="calendar-day-view">
          <div className="day-timeline">
            {hours.map(hour => {
              const hourClasses = classes.filter(c => {
                const classDate = new Date(c.scheduledAt);
                return classDate.toDateString() === currentDate.toDateString() &&
                       classDate.getHours() === hour;
              });

              return (
                <div key={hour} className="day-hour-row">
                  <div className="day-hour-label">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="day-hour-content">
                    {hourClasses.map(c => (
                      <div
                        key={c.id}
                        className={`day-class-card ${isClassBooked(c.id) ? 'booked' : ''} ${c.availableSpots <= 0 ? 'full' : ''} ${isPastClass(c) ? 'past-class' : ''} ${isDeadlinePassed(c) ? 'deadline-passed' : ''}`}
                        onClick={() => onClassClick(c)}
                      >
                        <div className="day-class-header">
                          <span className="day-class-time">{formatTime(c.scheduledAt)}</span>
                          <span className="day-class-duration">{c.durationMinutes} {t('classes.minutes')}</span>
                        </div>
                        <h4 className="day-class-title">{c.title}</h4>
                        {c.instructor && (
                          <p className="day-class-instructor">
                            <span>👤</span> {c.instructor}
                          </p>
                        )}
                        <div className="day-class-footer">
                          <span className={`day-class-spots ${c.availableSpots <= 0 ? 'full' : c.availableSpots <= 3 ? 'low' : ''} ${isDeadlinePassed(c) ? 'deadline-passed' : ''}`}>
                            {isPastClass(c) ? t('classes.classPassed') :
                             isDeadlinePassed(c) ? `🔒 ${t('classes.deadlinePassed')}` :
                             c.availableSpots > 0 ? `${c.availableSpots} ${t('calendar.spotsLeft')}` :
                             t('classes.fullyBooked')
                            }
                          </span>
                          {isClassBooked(c.id) && (
                            <span className="day-class-booked-badge">✓ {t('classes.youAreBooked')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
