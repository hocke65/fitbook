import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/api';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingsApi.getMyBookings();
      const confirmedBookings = response.data.bookings.filter(
        (b) => b.status === 'confirmed' && new Date(b.class.scheduledAt) > new Date()
      );
      setBookings(confirmedBookings);
    } catch (err) {
      setError('Kunde inte hämta dina bokningar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (classId) => {
    setCancellingId(classId);
    try {
      await bookingsApi.cancel(classId);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Kunde inte avboka passet.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Idag';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Imorgon';
    }

    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `om ${days} ${days === 1 ? 'dag' : 'dagar'}`;
    } else if (hours > 0) {
      return `om ${hours} ${hours === 1 ? 'timme' : 'timmar'}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `om ${minutes} min`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">Laddar dina bokningar...</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-header">
        <h1 className="page-title">Mina Bokningar</h1>
        <p className="page-subtitle">
          {bookings.length > 0
            ? `Du har ${bookings.length} kommande ${bookings.length === 1 ? 'bokning' : 'bokningar'}`
            : 'Inga kommande bokningar'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-3">
          <span>⚠️</span> {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">Inga bokningar</h2>
          <p className="empty-state-text">
            Du har inga kommande bokade träningspass. Hitta ett pass som passar dig!
          </p>
          <Link to="/" className="btn btn-primary btn-lg mt-3">
            Bläddra bland pass
          </Link>
        </div>
      ) : (
        <div className="classes-grid">
          {bookings.map((booking) => (
            <div key={booking.bookingId} className="class-card">
              <div className="class-card-header">
                <h3 className="class-card-title">{booking.class.title}</h3>
                {booking.class.instructor && (
                  <p className="class-card-instructor">
                    <span>👤</span> {booking.class.instructor}
                  </p>
                )}
              </div>

              <div className="class-card-body">
                <div className="booked-badge">
                  <span>✓</span> Bokad {getTimeUntil(booking.class.scheduledAt)}
                </div>

                {booking.class.description && (
                  <p className="class-card-description">
                    {booking.class.description}
                  </p>
                )}

                <div className="class-card-meta">
                  <div className="class-card-meta-item">
                    <span>📅</span>
                    <span>{formatDate(booking.class.scheduledAt)}</span>
                  </div>
                  <div className="class-card-meta-item">
                    <span>🕐</span>
                    <span>{formatTime(booking.class.scheduledAt)}</span>
                  </div>
                  <div className="class-card-meta-item">
                    <span>⏱️</span>
                    <span>{booking.class.durationMinutes} min</span>
                  </div>
                </div>
              </div>

              <div className="class-card-footer">
                <button
                  onClick={() => handleCancel(booking.class.id)}
                  disabled={cancellingId === booking.class.id}
                  className="btn btn-danger"
                >
                  {cancellingId === booking.class.id ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                      Avbokar...
                    </>
                  ) : (
                    <>
                      <span>✕</span>
                      Avboka
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
