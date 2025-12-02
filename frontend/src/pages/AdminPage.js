import React, { useState, useEffect, useCallback } from 'react';
import { classesApi, bookingsApi, usersApi } from '../services/api';
import Modal from '../components/Modal';

const AdminPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('classes');

  // Classes state
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxCapacity: 20,
    scheduledAt: '',
    durationMinutes: 60,
    instructor: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedClassName, setSelectedClassName] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    password: '',
  });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const response = await classesApi.getAll();
      setClasses(response.data.classes);
    } catch (err) {
      setError('Kunde inte hämta träningspass.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await usersApi.getAll();
      setUsers(response.data.users);
    } catch (err) {
      setError('Kunde inte hämta användare.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, users.length, fetchUsers]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Classes functions
  const openCreateModal = () => {
    setEditingClass(null);
    setFormData({
      title: '',
      description: '',
      maxCapacity: 20,
      scheduledAt: '',
      durationMinutes: 60,
      instructor: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (classData) => {
    setEditingClass(classData);
    setFormData({
      title: classData.title,
      description: classData.description || '',
      maxCapacity: classData.maxCapacity,
      scheduledAt: formatDateForInput(classData.scheduledAt),
      durationMinutes: classData.durationMinutes,
      instructor: classData.instructor || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxCapacity' || name === 'durationMinutes'
        ? parseInt(value) || ''
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingClass) {
        await classesApi.update(editingClass.id, formData);
        setSuccess('Passet har uppdaterats!');
      } else {
        await classesApi.create(formData);
        setSuccess('Nytt pass har skapats!');
      }
      setShowModal(false);
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Något gick fel.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (classId, title) => {
    if (!window.confirm(`Är du säker på att du vill ta bort "${title}"?`)) {
      return;
    }

    try {
      await classesApi.delete(classId);
      setSuccess('Passet har tagits bort!');
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kunde inte ta bort passet.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const viewParticipants = async (classId, className) => {
    try {
      const response = await bookingsApi.getClassParticipants(classId);
      setParticipants(response.data.participants);
      setSelectedClassName(className);
      setShowParticipants(true);
    } catch (err) {
      setError('Kunde inte hämta deltagare.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Users functions
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'user',
      password: '',
    });
    setUserFormError('');
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '',
    });
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserFormLoading(true);
    setUserFormError('');

    try {
      const dataToSend = { ...userFormData };
      // Ta bort tomt lösenord vid redigering
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await usersApi.update(editingUser.id, dataToSend);
        setSuccess('Användaren har uppdaterats!');
      } else {
        await usersApi.create(dataToSend);
        setSuccess('Ny användare har skapats!');
      }
      setShowUserModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUserFormError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Något gick fel.'
      );
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Är du säker på att du vill ta bort "${name}"? Alla bokningar för användaren kommer också att tas bort.`)) {
      return;
    }

    try {
      await usersApi.delete(userId);
      setSuccess('Användaren har tagits bort!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kunde inte ta bort användaren.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const totalBookings = classes.reduce((acc, c) => acc + (c.bookedCount || 0), 0);
  const totalCapacity = classes.reduce((acc, c) => acc + c.maxCapacity, 0);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Hantera träningspass och användare</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <span>📅</span> Träningspass
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span>👥</span> Användare
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-3">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-3">
          <span>✓</span> {success}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <>
          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{classes.length}</div>
              <div className="stat-label">Aktiva pass</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-label">Totalt bokade</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalCapacity}</div>
              <div className="stat-label">Total kapacitet</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0}%
              </div>
              <div className="stat-label">Beläggning</div>
            </div>
          </div>

          <div className="section-header">
            <h2>Träningspass</h2>
            <button onClick={openCreateModal} className="btn btn-primary">
              <span>+</span> Skapa nytt pass
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h2 className="empty-state-title">Inga pass</h2>
              <p className="empty-state-text">
                Skapa ditt första träningspass!
              </p>
              <button onClick={openCreateModal} className="btn btn-primary btn-lg mt-3">
                Skapa pass
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pass</th>
                    <th>Datum/Tid</th>
                    <th style={{ textAlign: 'center' }}>Bokade</th>
                    <th style={{ textAlign: 'center' }}>Kapacitet</th>
                    <th style={{ textAlign: 'right' }}>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const bookingPercentage = (c.bookedCount / c.maxCapacity) * 100;
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.title}</div>
                          {c.instructor && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                              {c.instructor}
                            </div>
                          )}
                        </td>
                        <td>{formatDate(c.scheduledAt)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: bookingPercentage >= 100
                                ? 'rgba(239, 68, 68, 0.1)'
                                : bookingPercentage >= 70
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : 'rgba(16, 185, 129, 0.1)',
                              color: bookingPercentage >= 100
                                ? 'var(--danger)'
                                : bookingPercentage >= 70
                                  ? '#D97706'
                                  : 'var(--secondary)',
                            }}
                          >
                            {c.bookedCount} / {c.maxCapacity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: '60px', margin: '0 auto' }}>
                            <div style={{
                              height: '6px',
                              background: 'var(--gray-200)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(bookingPercentage, 100)}%`,
                                height: '100%',
                                background: bookingPercentage >= 100
                                  ? 'var(--danger)'
                                  : bookingPercentage >= 70
                                    ? '#F59E0B'
                                    : 'var(--secondary)',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => viewParticipants(c.id, c.title)}
                              className="btn btn-ghost btn-sm"
                              title="Visa deltagare"
                            >
                              👥
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              className="btn btn-ghost btn-sm"
                              title="Redigera"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.title)}
                              className="btn btn-ghost btn-sm"
                              title="Ta bort"
                              style={{ color: 'var(--danger)' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Totalt användare</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{adminCount}</div>
              <div className="stat-label">Administratörer</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userCount}</div>
              <div className="stat-label">Vanliga användare</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {users.reduce((acc, u) => acc + (u.bookingCount || 0), 0)}
              </div>
              <div className="stat-label">Aktiva bokningar</div>
            </div>
          </div>

          <div className="section-header">
            <h2>Användare</h2>
            <button onClick={openCreateUserModal} className="btn btn-primary">
              <span>+</span> Skapa ny användare
            </button>
          </div>

          {usersLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p className="loading-text">Laddar användare...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h2 className="empty-state-title">Inga användare</h2>
              <p className="empty-state-text">
                Skapa din första användare!
              </p>
              <button onClick={openCreateUserModal} className="btn btn-primary btn-lg mt-3">
                Skapa användare
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Användare</th>
                    <th>E-post</th>
                    <th style={{ textAlign: 'center' }}>Roll</th>
                    <th style={{ textAlign: 'center' }}>Bokningar</th>
                    <th style={{ textAlign: 'right' }}>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {user.firstName} {user.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                              Medlem sedan {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Användare'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--primary)',
                        }}>
                          {user.bookingCount || 0}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditUserModal(user)}
                            className="btn btn-ghost btn-sm"
                            title="Redigera"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            className="btn btn-ghost btn-sm"
                            title="Ta bort"
                            style={{ color: 'var(--danger)' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Class Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClass ? 'Redigera pass' : 'Skapa nytt pass'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="alert alert-error">
              <span>⚠️</span> {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Titel *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="T.ex. Yoga för nybörjare"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Beskrivning
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Beskriv passet..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructor" className="form-label">
              Instruktör
            </label>
            <input
              type="text"
              id="instructor"
              name="instructor"
              className="form-input"
              value={formData.instructor}
              onChange={handleFormChange}
              placeholder="Instruktörens namn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledAt" className="form-label">
              Datum och tid *
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              name="scheduledAt"
              className="form-input"
              value={formData.scheduledAt}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxCapacity" className="form-label">
                Max antal platser *
              </label>
              <input
                type="number"
                id="maxCapacity"
                name="maxCapacity"
                className="form-input"
                value={formData.maxCapacity}
                onChange={handleFormChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="durationMinutes" className="form-label">
                Längd (minuter) *
              </label>
              <input
                type="number"
                id="durationMinutes"
                name="durationMinutes"
                className="form-input"
                value={formData.durationMinutes}
                onChange={handleFormChange}
                min="15"
                step="5"
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Sparar...
                </>
              ) : editingClass ? (
                'Uppdatera'
              ) : (
                'Skapa pass'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Participants Modal */}
      <Modal
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        title={`Deltagare - ${selectedClassName}`}
      >
        {participants.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">👥</div>
            <p className="text-muted">Inga bokningar ännu.</p>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-muted">
              {participants.length} bokade {participants.length === 1 ? 'deltagare' : 'deltagare'}
            </p>
            {participants.map((p, index) => (
              <div
                key={p.id}
                className="participant-item"
                style={{
                  padding: '0.75rem 1rem',
                  background: index % 2 === 0 ? 'var(--gray-50)' : 'white',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.5rem',
                }}
              >
                <div className="participant-avatar">
                  {p.firstName?.[0]}{p.lastName?.[0]}
                </div>
                <div>
                  <div className="participant-name">
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    Bokad {new Date(p.bookedAt).toLocaleString('sv-SE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Redigera användare' : 'Skapa ny användare'}
      >
        <form onSubmit={handleUserSubmit}>
          {userFormError && (
            <div className="alert alert-error">
              <span>⚠️</span> {userFormError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userFirstName" className="form-label">
                Förnamn *
              </label>
              <input
                type="text"
                id="userFirstName"
                name="firstName"
                className="form-input"
                value={userFormData.firstName}
                onChange={handleUserFormChange}
                placeholder="Förnamn"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userLastName" className="form-label">
                Efternamn *
              </label>
              <input
                type="text"
                id="userLastName"
                name="lastName"
                className="form-input"
                value={userFormData.lastName}
                onChange={handleUserFormChange}
                placeholder="Efternamn"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userEmail" className="form-label">
              E-postadress *
            </label>
            <input
              type="email"
              id="userEmail"
              name="email"
              className="form-input"
              value={userFormData.email}
              onChange={handleUserFormChange}
              placeholder="namn@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userPassword" className="form-label">
              {editingUser ? 'Nytt lösenord (lämna tomt för att behålla)' : 'Lösenord *'}
            </label>
            <input
              type="password"
              id="userPassword"
              name="password"
              className="form-input"
              value={userFormData.password}
              onChange={handleUserFormChange}
              placeholder={editingUser ? '••••••••' : 'Minst 6 tecken'}
              required={!editingUser}
              minLength={editingUser ? 0 : 6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="userRole" className="form-label">
              Roll
            </label>
            <select
              id="userRole"
              name="role"
              className="form-input"
              value={userFormData.role}
              onChange={handleUserFormChange}
            >
              <option value="user">Användare</option>
              <option value="admin">Administratör</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="btn btn-secondary"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={userFormLoading}
            >
              {userFormLoading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Sparar...
                </>
              ) : editingUser ? (
                'Uppdatera'
              ) : (
                'Skapa användare'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
