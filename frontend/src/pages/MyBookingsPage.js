import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MyBookingsPage = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'past'

  const { language, t } = useLanguage();

  const fetchBookings = useCallback(async () => {
    try {
      const response = await bookingsApi.getMyBookings();
      const confirmedBookings = response.data.bookings.filter(
        (b) => b.status === 'confirmed'
      );
      setAllBookings(confirmedBookings);
    } catch (err) {
      setError(t('errors.fetchBookings'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Filter bookings based on view mode
  const now = new Date();
  const upcomingBookings = allBookings.filter(
    (b) => new Date(b.class.scheduledAt) > now
  );
  const pastBookings = allBookings.filter(
    (b) => new Date(b.class.scheduledAt) <= now
  );
  const bookings = viewMode === 'upcoming' ? upcomingBookings : pastBookings;

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (classId) => {
    setCancellingId(classId);
    try {
      await bookingsApi.cancel(classId);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || t('errors.cancelFailed'));
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
      return t('classes.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('classes.tomorrow');
    }

    return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Stockholm',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'sv' ? 'sv-SE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language !== 'sv',
      timeZone: 'Europe/Stockholm',
    });
  };

  const getTimeUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;

    // Handle past dates
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days > 0) {
        if (language === 'sv') {
          return `${days} ${days === 1 ? 'dag' : 'dagar'} sedan`;
        } else {
          return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }
      } else if (hours > 0) {
        if (language === 'sv') {
          return `${hours} ${hours === 1 ? 'timme' : 'timmar'} sedan`;
        } else {
          return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
      } else {
        const minutes = Math.floor(absDiff / (1000 * 60));
        if (language === 'sv') {
          return `${minutes} min sedan`;
        } else {
          return `${minutes} min ago`;
        }
      }
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      if (language === 'sv') {
        return `om ${days} ${days === 1 ? 'dag' : 'dagar'}`;
      } else {
        return `in ${days} ${days === 1 ? 'day' : 'days'}`;
      }
    } else if (hours > 0) {
      if (language === 'sv') {
        return `om ${hours} ${hours === 1 ? 'timme' : 'timmar'}`;
      } else {
        return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      }
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      if (language === 'sv') {
        return `om ${minutes} min`;
      } else {
        return `in ${minutes} min`;
      }
    }
  };

  const isPastBooking = (dateString) => new Date(dateString) < new Date();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">{t('myBookings.loadingBookings')}</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-header">
        <div className="flex-between flex-wrap gap-2">
          <div>
            <h1 className="page-title">{t('myBookings.title')}</h1>
            <p className="page-subtitle">
              {viewMode === 'upcoming'
                ? (upcomingBookings.length > 0
                    ? `${t('myBookings.youHave')} ${upcomingBookings.length} ${t('myBookings.upcoming')} ${upcomingBookings.length === 1 ? t('myBookings.bookingSingular') : t('myBookings.bookingPlural')}`
                    : t('myBookings.noUpcoming'))
                : (pastBookings.length > 0
                    ? `${pastBookings.length} ${t('myBookings.pastBookings')}`
                    : t('myBookings.noPastBookings'))}
            </p>
          </div>
          <div className="display-mode-toggle">
            <button
              className={`display-mode-btn ${viewMode === 'upcoming' ? 'active' : ''}`}
              onClick={() => setViewMode('upcoming')}
            >
              <span>📅</span> {t('myBookings.upcomingTab')} ({upcomingBookings.length})
            </button>
            <button
              className={`display-mode-btn ${viewMode === 'past' ? 'active' : ''}`}
              onClick={() => setViewMode('past')}
            >
              <span>📜</span> {t('myBookings.pastTab')} ({pastBookings.length})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-3">
          <span>⚠️</span> {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">{t('myBookings.noBookings')}</h2>
          <p className="empty-state-text">
            {t('myBookings.noBookingsText')}
          </p>
          <Link to="/" className="btn btn-primary btn-lg mt-3">
            {t('myBookings.browseClasses')}
          </Link>
        </div>
      ) : (
        <div className="classes-grid">
          {bookings.map((booking) => {
            const isPast = isPastBooking(booking.class.scheduledAt);
            return (
            <div key={booking.bookingId} className={`class-card ${isPast ? 'past-class' : ''}`}>
              <div className="class-card-header">
                <h3 className="class-card-title">{booking.class.title}</h3>
                {booking.class.instructor && (
                  <p className="class-card-instructor">
                    <span>👤</span> {booking.class.instructor}
                  </p>
                )}
              </div>

              <div className="class-card-body">
                <div className={`booked-badge ${isPast ? 'past' : ''}`}>
                  <span>{isPast ? '✓' : '✓'}</span> {isPast ? t('myBookings.attended') : t('myBookings.booked')} {getTimeUntil(booking.class.scheduledAt)}
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
                    <span>{booking.class.durationMinutes} {t('classes.minutes')}</span>
                  </div>
                </div>
              </div>

              <div className="class-card-footer">
                {isPast ? (
                  <button disabled className="btn btn-ghost">
                    <span>✓</span>
                    {t('myBookings.completed')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancel(booking.class.id)}
                    disabled={cancellingId === booking.class.id}
                    className="btn btn-danger"
                  >
                    {cancellingId === booking.class.id ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                        {t('classes.cancelling')}
                      </>
                    ) : (
                      <>
                        <span>✕</span>
                        {t('classes.cancelButton')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
