import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { loginRequest } from '../config/msalConfig';

const AUTH_MODE = process.env.REACT_APP_AUTH_MODE || 'local';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const { login, loginWithEntraId } = useAuth();
  const { instance } = useMsal();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error ||
        (language === 'sv' ? 'Inloggningen misslyckades' : 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    setMsLoading(true);

    try {
      const response = await instance.loginPopup(loginRequest);
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

        <h2 className="auth-title">{language === 'sv' ? 'Välkommen' : 'Welcome'}</h2>
        <p className="auth-subtitle">
          {AUTH_MODE === 'entra'
            ? (language === 'sv' ? 'Logga in med ditt företagskonto' : 'Sign in with your work account')
            : (language === 'sv' ? 'Logga in för att fortsätta' : 'Sign in to continue')
          }
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {AUTH_MODE === 'local' && (
          <>
            <form onSubmit={handleLocalLogin}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {language === 'sv' ? 'E-postadress' : 'Email address'}
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'sv' ? 'namn@exempel.se' : 'name@example.com'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  {language === 'sv' ? 'Lösenord' : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                    {language === 'sv' ? 'Loggar in...' : 'Signing in...'}
                  </>
                ) : (
                  language === 'sv' ? 'Logga in' : 'Sign in'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--gray-600)' }}>
              {language === 'sv' ? 'Har du inget konto?' : "Don't have an account?"}{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {language === 'sv' ? 'Registrera dig' : 'Register'}
              </Link>
            </p>
          </>
        )}

        {AUTH_MODE === 'entra' && (
          <button
            type="button"
            className="btn btn-microsoft btn-lg"
            onClick={handleMicrosoftLogin}
            disabled={msLoading}
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
        )}
      </div>
    </div>
  );
};

export default LoginPage;
