import React, { useState } from 'react';
import { bookingsApi } from '../services/api';

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

  const handleBook = async (e) => {
    e.stopPropagation();
    setLoading(true);
    setError('');
    try {
      await bookingsApi.book(classData.id);
      if (onBookingChange) onBookingChange();
      // Uppdatera deltagarlistan om den visas
      if (showParticipants) {
        fetchParticipants();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Kunde inte boka passet.');
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
      // Uppdatera deltagarlistan om den visas
      if (showParticipants) {
        fetchParticipants();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Kunde inte avboka passet.');
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
      console.error('Kunde inte hämta deltagare:', err);
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
  const bookedCount = classData.maxCapacity - classData.availableSpots;
  const spotsPercentage = (bookedCount / classData.maxCapacity) * 100;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className={`class-card ${isBooked ? 'booked' : ''}`}>
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
            <span>✓</span> Du är bokad
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
            <span>{classData.durationMinutes} min</span>
          </div>
        </div>

        {/* Klickbar plats-sektion för att visa deltagare */}
        <div
          className="class-card-spots clickable"
          onClick={toggleParticipants}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleParticipants()}
        >
          <div className="spots-info">
            <span className="spots-label">
              <span>👥</span> {bookedCount} bokade
            </span>
            <span className={`spots-count ${isFull ? 'full' : 'available'}`}>
              {classData.availableSpots} lediga
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
            <span>{showParticipants ? '▲ Dölj deltagare' : '▼ Visa deltagare'}</span>
          </div>
        </div>

        {/* Deltagarlista */}
        {showParticipants && (
          <div className="participants-list">
            {loadingParticipants ? (
              <div className="participants-loading">
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                <span>Laddar deltagare...</span>
              </div>
            ) : participants.length === 0 ? (
              <p className="participants-empty">Inga bokade deltagare ännu</p>
            ) : (
              <>
                <p className="participants-header">
                  Bokade deltagare ({participants.length})
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
        {isBooked ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? (
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
        ) : (
          <button
            onClick={handleBook}
            disabled={loading || isFull}
            className="btn btn-success"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                Bokar...
              </>
            ) : isFull ? (
              <>
                <span>🚫</span>
                Fullbokat
              </>
            ) : (
              <>
                <span>✓</span>
                Boka pass
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
