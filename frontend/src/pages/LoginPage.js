import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { loginRequest } from '../config/msalConfig';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const { login, loginWithEntraId } = useAuth();
  const { instance } = useMsal();
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

  const handleMicrosoftLogin = async () => {
    setError('');
    setMsLoading(true);
    console.log('Starting Microsoft login...');

    try {
      console.log('Calling loginPopup with:', loginRequest);
      const response = await instance.loginPopup(loginRequest);
      console.log('MSAL response:', response);
      await loginWithEntraId(response.accessToken, response.account);
      navigate('/');
    } catch (err) {
      console.error('Microsoft login error:', err);
      if (err.errorCode !== 'user_cancelled') {
        setError(
          err.response?.data?.error ||
          err.message ||
          (language === 'sv' ? 'Microsoft-inloggning misslyckades' : 'Microsoft login failed')
        );
      }
    } finally {
      setMsLoading(false);
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
            disabled={loading || msLoading}
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

        <div className="auth-divider">
          <span>{language === 'sv' ? 'eller' : 'or'}</span>
        </div>

        <button
          type="button"
          className="btn btn-microsoft btn-lg"
          onClick={handleMicrosoftLogin}
          disabled={loading || msLoading}
        >
          {msLoading ? (
            <>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
              {language === 'sv' ? 'Loggar in...' : 'Signing in...'}
            </>
          ) : (
            <>
              <svg className="microsoft-icon" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              {language === 'sv' ? 'Logga in med Microsoft' : 'Sign in with Microsoft'}
            </>
          )}
        </button>

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
