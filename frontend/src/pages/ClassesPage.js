import React, { useState, useEffect, useCallback } from 'react';
import { classesApi, bookingsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ClassCard from '../components/ClassCard';
import CalendarView from '../components/CalendarView';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayMode, setDisplayMode] = useState('calendar'); // 'calendar' or 'grid'
  const [selectedClass, setSelectedClass] = useState(null);

  const { t } = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const [classesRes, bookingsRes] = await Promise.all([
        classesApi.getAll(),
        bookingsApi.getMyBookings(),
      ]);
      setClasses(classesRes.data.classes);
      setMyBookings(bookingsRes.data.bookings);
    } catch (err) {
      setError(t('errors.fetchClasses'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isClassBooked = (classId) => {
    return myBookings.some(
      (b) => b.class.id === classId && b.status === 'confirmed'
    );
  };

  const bookedClassesCount = myBookings.filter(b => b.status === 'confirmed').length;

  const handleClassClick = (classData) => {
    setSelectedClass(classData);
  };

  const closeClassModal = () => {
    setSelectedClass(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-header">
        <div className="flex-between flex-wrap gap-2">
          <div>
            <h1 className="page-title">{t('classes.title')}</h1>
            <p className="page-subtitle">
              {classes.length} {t('classes.available')}
              {bookedClassesCount > 0 && ` • ${bookedClassesCount} ${t('classes.booked')}`}
            </p>
          </div>
          <div className="display-mode-toggle">
            <button
              className={`display-mode-btn ${displayMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setDisplayMode('calendar')}
              title={t('calendar.calendarView')}
            >
              <span>📅</span> {t('calendar.calendar')}
            </button>
            <button
              className={`display-mode-btn ${displayMode === 'grid' ? 'active' : ''}`}
              onClick={() => setDisplayMode('grid')}
              title={t('calendar.listView')}
            >
              <span>📋</span> {t('calendar.list')}
            </button>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h2 className="empty-state-title">{t('classes.noClasses')}</h2>
          <p className="empty-state-text">
            {t('classes.noClassesText')}
          </p>
        </div>
      ) : displayMode === 'calendar' ? (
        <CalendarView
          classes={classes}
          onClassClick={handleClassClick}
          isClassBooked={isClassBooked}
        />
      ) : (
        <div className="classes-grid">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classData={classItem}
              isBooked={isClassBooked(classItem.id)}
              onBookingChange={fetchData}
              showParticipants={false}
            />
          ))}
        </div>
      )}

      {/* Class Detail Modal */}
      {selectedClass && (
        <div className="modal-overlay" onClick={closeClassModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedClass.title}</h3>
              <button className="modal-close" onClick={closeClassModal}>×</button>
            </div>
            <div className="modal-body">
              <ClassCard
                classData={selectedClass}
                isBooked={isClassBooked(selectedClass.id)}
                onBookingChange={() => {
                  fetchData();
                  closeClassModal();
                }}
                showParticipants={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
