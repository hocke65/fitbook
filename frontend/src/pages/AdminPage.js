import React, { useState, useEffect, useCallback } from 'react';
import { classesApi, bookingsApi, usersApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';

const AdminPage = () => {
  const { language, t } = useLanguage();

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
      setError(t('errors.fetchClasses'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await usersApi.getAll();
      setUsers(response.data.users);
    } catch (err) {
      setError(t('errors.fetchUsers'));
    } finally {
      setUsersLoading(false);
    }
  }, [t]);

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
    return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
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
        setSuccess(t('admin.classUpdated'));
      } else {
        await classesApi.create(formData);
        setSuccess(t('admin.classCreated'));
      }
      setShowModal(false);
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        t('errors.generic')
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (classId, title) => {
    if (!window.confirm(t('admin.confirmDeleteClass').replace('{title}', title))) {
      return;
    }

    try {
      await classesApi.delete(classId);
      setSuccess(t('admin.classDeleted'));
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('errors.deleteClass'));
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
      setError(t('errors.fetchParticipants'));
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
      // Remove empty password when editing
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await usersApi.update(editingUser.id, dataToSend);
        setSuccess(t('admin.userUpdated'));
      } else {
        await usersApi.create(dataToSend);
        setSuccess(t('admin.userCreated'));
      }
      setShowUserModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUserFormError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        t('errors.generic')
      );
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(t('admin.confirmDeleteUser').replace('{name}', name))) {
      return;
    }

    try {
      await usersApi.delete(userId);
      setSuccess(t('admin.userDeleted'));
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('errors.deleteUser'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const totalBookings = classes.reduce((acc, c) => acc + (c.bookedCount || 0), 0);
  const totalCapacity = classes.reduce((acc, c) => acc + c.maxCapacity, 0);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const superuserCount = users.filter(u => u.role === 'superuser').length;
  const userCount = users.filter(u => u.role === 'user').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">{t('admin.title')}</h1>
          <p className="page-subtitle">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <span>📅</span> {t('admin.tabClasses')}
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span>👥</span> {t('admin.tabUsers')}
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
              <div className="stat-label">{t('admin.activeClasses')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-label">{t('admin.totalBooked')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalCapacity}</div>
              <div className="stat-label">{t('admin.totalCapacity')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0}%
              </div>
              <div className="stat-label">{t('admin.occupancy')}</div>
            </div>
          </div>

          <div className="section-header">
            <h2>{t('admin.tabClasses')}</h2>
            <button onClick={openCreateModal} className="btn btn-primary">
              <span>+</span> {t('admin.createClass')}
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h2 className="empty-state-title">{t('admin.noClasses')}</h2>
              <p className="empty-state-text">
                {t('admin.noClassesText')}
              </p>
              <button onClick={openCreateModal} className="btn btn-primary btn-lg mt-3">
                {t('admin.createClassButton')}
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.tableClass')}</th>
                    <th>{t('admin.tableDateTime')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tableBooked')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tableCapacity')}</th>
                    <th style={{ textAlign: 'right' }}>{t('admin.tableActions')}</th>
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
                              title={t('admin.viewParticipants')}
                            >
                              👥
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              className="btn btn-ghost btn-sm"
                              title={t('common.edit')}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.title)}
                              className="btn btn-ghost btn-sm"
                              title={t('common.delete')}
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
              <div className="stat-label">{t('admin.totalUsers')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{adminCount}</div>
              <div className="stat-label">{t('admin.administrators')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{superuserCount}</div>
              <div className="stat-label">{t('admin.superusers')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userCount}</div>
              <div className="stat-label">{t('admin.regularUsers')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {users.reduce((acc, u) => acc + (u.bookingCount || 0), 0)}
              </div>
              <div className="stat-label">{t('admin.activeBookings')}</div>
            </div>
          </div>

          <div className="section-header">
            <h2>{t('admin.tabUsers')}</h2>
            <button onClick={openCreateUserModal} className="btn btn-primary">
              <span>+</span> {t('admin.createUser')}
            </button>
          </div>

          {usersLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p className="loading-text">{t('admin.loadingUsers')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h2 className="empty-state-title">{t('admin.noUsers')}</h2>
              <p className="empty-state-text">
                {t('admin.noUsersText')}
              </p>
              <button onClick={openCreateUserModal} className="btn btn-primary btn-lg mt-3">
                {t('admin.createUserButton')}
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.tableUser')}</th>
                    <th>{t('auth.email')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tableRole')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tableBookings')}</th>
                    <th style={{ textAlign: 'right' }}>{t('admin.tableActions')}</th>
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
                              {t('admin.memberSince')} {new Date(user.createdAt).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin'
                            ? `👑 ${t('admin.roleAdmin')}`
                            : user.role === 'superuser'
                              ? `⭐ ${t('admin.roleSuperuser')}`
                              : `👤 ${t('admin.roleUser')}`}
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
                            title={t('common.edit')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            className="btn btn-ghost btn-sm"
                            title={t('common.delete')}
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
        title={editingClass ? t('admin.editClass') : t('admin.createClass')}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="alert alert-error">
              <span>⚠️</span> {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t('admin.classTitle')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleFormChange}
              placeholder={t('admin.classTitlePlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              {t('admin.classDescription')}
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleFormChange}
              placeholder={t('admin.classDescriptionPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructor" className="form-label">
              {t('admin.instructor')}
            </label>
            <input
              type="text"
              id="instructor"
              name="instructor"
              className="form-input"
              value={formData.instructor}
              onChange={handleFormChange}
              placeholder={t('admin.instructorPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledAt" className="form-label">
              {t('admin.dateTime')} *
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
                {t('admin.maxCapacity')} *
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
                {t('admin.duration')} *
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  {t('common.saving')}
                </>
              ) : editingClass ? (
                t('common.update')
              ) : (
                t('admin.createClassButton')
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Participants Modal */}
      <Modal
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        title={`${t('admin.participants')} - ${selectedClassName}`}
      >
        {participants.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">👥</div>
            <p className="text-muted">{t('admin.noBookingsYet')}</p>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-muted">
              {participants.length} {t('admin.bookedParticipants')}
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
                    {t('admin.bookedAt')} {new Date(p.bookedAt).toLocaleString(language === 'sv' ? 'sv-SE' : 'en-US')}
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
        title={editingUser ? t('admin.editUser') : t('admin.createUser')}
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
                {t('auth.firstName')} *
              </label>
              <input
                type="text"
                id="userFirstName"
                name="firstName"
                className="form-input"
                value={userFormData.firstName}
                onChange={handleUserFormChange}
                placeholder={t('auth.firstName')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userLastName" className="form-label">
                {t('auth.lastName')} *
              </label>
              <input
                type="text"
                id="userLastName"
                name="lastName"
                className="form-input"
                value={userFormData.lastName}
                onChange={handleUserFormChange}
                placeholder={t('auth.lastName')}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userEmail" className="form-label">
              {t('auth.email')} *
            </label>
            <input
              type="email"
              id="userEmail"
              name="email"
              className="form-input"
              value={userFormData.email}
              onChange={handleUserFormChange}
              placeholder={t('admin.emailPlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userPassword" className="form-label">
              {editingUser ? t('admin.newPassword') : `${t('auth.password')} *`}
            </label>
            <input
              type="password"
              id="userPassword"
              name="password"
              className="form-input"
              value={userFormData.password}
              onChange={handleUserFormChange}
              placeholder={editingUser ? '••••••••' : t('admin.passwordPlaceholder')}
              required={!editingUser}
              minLength={editingUser ? 0 : 6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="userRole" className="form-label">
              {t('admin.tableRole')}
            </label>
            <select
              id="userRole"
              name="role"
              className="form-input"
              value={userFormData.role}
              onChange={handleUserFormChange}
            >
              <option value="user">{t('admin.roleUser')}</option>
              <option value="superuser">{t('admin.roleSuperuserOption')}</option>
              <option value="admin">{t('admin.roleAdminOption')}</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={userFormLoading}
            >
              {userFormLoading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  {t('common.saving')}
                </>
              ) : editingUser ? (
                t('common.update')
              ) : (
                t('admin.createUserButton')
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
