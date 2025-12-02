import React, { useState, useEffect, useCallback } from 'react';
import { classesApi, bookingsApi } from '../services/api';
import ClassCard from '../components/ClassCard';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [classesRes, bookingsRes] = await Promise.all([
        classesApi.getAll(),
        bookingsApi.getMyBookings(),
      ]);
      setClasses(classesRes.data.classes);
      setMyBookings(bookingsRes.data.bookings);
    } catch (err) {
      setError('Kunde inte hämta träningspass.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isClassBooked = (classId) => {
    return myBookings.some(
      (b) => b.class.id === classId && b.status === 'confirmed'
    );
  };

  const bookedClassesCount = myBookings.filter(b => b.status === 'confirmed').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">Laddar träningspass...</p>
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
            <h1 className="page-title">Träningspass</h1>
            <p className="page-subtitle">
              {classes.length} pass tillgängliga
              {bookedClassesCount > 0 && ` • ${bookedClassesCount} bokade`}
            </p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h2 className="empty-state-title">Inga pass tillgängliga</h2>
          <p className="empty-state-text">
            Just nu finns inga kommande träningspass schemalagda. Kom tillbaka senare!
          </p>
        </div>
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
    </div>
  );
};

export default ClassesPage;
