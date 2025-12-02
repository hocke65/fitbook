import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        t('errors.loginFailed')
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
          <h1>💪 FitBook</h1>
          <p>{language === 'sv' ? 'Boka dina träningspass enkelt' : 'Book your fitness classes easily'}</p>
        </div>

        <h2 className="auth-title">{t('auth.loginSubtitle')}</h2>
        <p className="auth-subtitle">{t('auth.loginTitle')}</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
                {t('auth.loggingIn')}
              </>
            ) : (
              t('auth.loginButton')
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/register">{t('auth.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
