import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registreringen misslyckades. Försök igen.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💪 FitBook</h1>
          <p>Boka dina träningspass enkelt</p>
        </div>

        <h2 className="auth-title">Skapa konto</h2>
        <p className="auth-subtitle">Kom igång på några sekunder</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                Förnamn
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Anna"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Efternamn
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Andersson"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-postadress
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="din@email.se"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Lösenord
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minst 6 tecken"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Upprepa lösenordet"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                Skapar konto...
              </>
            ) : (
              'Skapa konto'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Har du redan ett konto?{' '}
            <Link to="/login">Logga in här</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
