import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { language, toggleLanguage, t } = useLanguage();
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
      setError(language === 'sv' ? 'Lösenorden matchar inte.' : 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'sv' ? 'Lösenordet måste vara minst 6 tecken.' : 'Password must be at least 6 characters.');
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
        t('errors.registerFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          className="language-toggle auth-language-toggle"
          onClick={toggleLanguage}
          title={language === 'sv' ? 'Switch to English' : 'Byt till svenska'}
        >
          {language === 'sv' ? '🇬🇧 EN' : '🇸🇪 SV'}
        </button>

        <div className="auth-logo">
          <img src="/Lynx_Logo_Color.svg" alt="Lynx" className="auth-logo-image" />
          <p>{language === 'sv' ? 'Boka dina träningspass enkelt' : 'Book your fitness classes easily'}</p>
        </div>

        <h2 className="auth-title">{t('auth.registerTitle')}</h2>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                {t('auth.firstName')}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder={language === 'sv' ? 'Anna' : 'John'}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                {t('auth.lastName')}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder={language === 'sv' ? 'Andersson' : 'Doe'}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder={language === 'sv' ? 'din@email.se' : 'your@email.com'}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('admin.passwordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {language === 'sv' ? 'Bekräfta lösenord' : 'Confirm password'}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={language === 'sv' ? 'Upprepa lösenordet' : 'Repeat password'}
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
                {t('auth.registering')}
              </>
            ) : (
              t('auth.registerButton')
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.hasAccount')}{' '}
            <Link to="/login">{t('auth.loginHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
