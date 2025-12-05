import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { loginRequest } from '../config/msalConfig';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [msLoading, setMsLoading] = useState(false);

  const { loginWithEntraId } = useAuth();
  const { instance } = useMsal();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

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
        <p className="auth-subtitle">{language === 'sv' ? 'Logga in med ditt företagskonto' : 'Sign in with your work account'}</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default LoginPage;
