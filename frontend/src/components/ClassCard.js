import React, { useState } from 'react';
import { bookingsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ClassCard = ({
  classData,
  isBooked,
  onBookingChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const { language, t } = useLanguage();

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
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'sv' ? 'sv-SE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBook = async (e) => {
    e.stopPropagation();
    setLoading(true);
    setError('');
    try {
      await bookingsApi.book(classData.id);
      if (onBookingChange) onBookingChange();
      if (showParticipants) {
        fetchParticipants();
      }
    } catch (err) {
      setError(err.response?.data?.error || t('errors.bookingFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    setLoading(true);
    setError('');
    try {
      await bookingsApi.cancel(classData.id);
      if (onBookingChange) onBookingChange();
      if (showParticipants) {
        fetchParticipants();
      }
    } catch (err) {
      setError(err.response?.data?.error || t('errors.cancelFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const response = await bookingsApi.getClassParticipants(classData.id);
      setParticipants(response.data.participants);
    } catch (err) {
      console.error('Could not fetch participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const toggleParticipants = () => {
    if (!showParticipants && participants.length === 0) {
      fetchParticipants();
    }
    setShowParticipants(!showParticipants);
  };

  const isFull = classData.availableSpots <= 0;
  const isPast = new Date(classData.scheduledAt) < new Date();
  const bookedCount = classData.maxCapacity - classData.availableSpots;
  const spotsPercentage = (bookedCount / classData.maxCapacity) * 100;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className={`class-card ${isBooked ? 'booked' : ''} ${isPast ? 'past-class' : ''}`}>
      <div className="class-card-header">
        <h3 className="class-card-title">{classData.title}</h3>
        {classData.instructor && (
          <p className="class-card-instructor">
            <span>👤</span> {classData.instructor}
          </p>
        )}
      </div>

      <div className="class-card-body">
        {isBooked && (
          <div className="booked-badge">
            <span>✓</span> {t('classes.youAreBooked')}
          </div>
        )}

        {classData.description && (
          <p className="class-card-description">{classData.description}</p>
        )}

        <div className="class-card-meta">
          <div className="class-card-meta-item">
            <span>📅</span>
            <span>{formatDate(classData.scheduledAt)}</span>
          </div>
          <div className="class-card-meta-item">
            <span>🕐</span>
            <span>{formatTime(classData.scheduledAt)}</span>
          </div>
          <div className="class-card-meta-item">
            <span>⏱️</span>
            <span>{classData.durationMinutes} {t('classes.minutes')}</span>
          </div>
        </div>

        <div
          className="class-card-spots clickable"
          onClick={toggleParticipants}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleParticipants()}
        >
          <div className="spots-info">
            <span className="spots-label">
              <span>👥</span> {bookedCount} {t('classes.spotsBooked')}
            </span>
            <span className={`spots-count ${isFull ? 'full' : 'available'}`}>
              {classData.availableSpots} {t('classes.spotsAvailable')}
            </span>
          </div>
          <div className="spots-bar">
            <div
              className="spots-bar-fill"
              style={{
                width: `${spotsPercentage}%`,
                background: isFull
                  ? 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)'
                  : spotsPercentage > 70
                    ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
              }}
            ></div>
          </div>
          <div className="spots-expand-hint">
            <span>{showParticipants ? `▲ ${t('classes.hideParticipants')}` : `▼ ${t('classes.showParticipants')}`}</span>
          </div>
        </div>

        {showParticipants && (
          <div className="participants-list">
            {loadingParticipants ? (
              <div className="participants-loading">
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                <span>{t('classes.loadingParticipants')}</span>
              </div>
            ) : participants.length === 0 ? (
              <p className="participants-empty">{t('classes.noParticipants')}</p>
            ) : (
              <>
                <p className="participants-header">
                  {t('classes.participants')} ({participants.length})
                </p>
                <div className="participants-grid">
                  {participants.map((p) => (
                    <div key={p.id} className="participant-item">
                      <div className="participant-avatar">
                        {getInitials(p.firstName, p.lastName)}
                      </div>
                      <span className="participant-name">
                        {p.firstName} {p.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-2">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      <div className="class-card-footer">
        {isPast ? (
          <button
            disabled
            className="btn btn-ghost"
          >
            <span>⏱️</span>
            {t('classes.classPassed')}
          </button>
        ) : isBooked ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? (
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
        ) : (
          <button
            onClick={handleBook}
            disabled={loading || isFull}
            className="btn btn-success"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                {t('classes.booking')}
              </>
            ) : isFull ? (
              <>
                <span>🚫</span>
                {t('classes.fullyBooked')}
              </>
            ) : (
              <>
                <span>✓</span>
                {t('classes.bookButton')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
