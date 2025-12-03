import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo" onClick={closeMobileMenu}>
          <img src="/Lynx_Logo_Color.svg" alt="Lynx" className="logo-image" />
        </Link>

        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <nav className={`nav ${mobileMenuOpen ? 'active' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            {t('nav.classes')}
          </Link>
          <Link
            to="/my-bookings"
            className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            {t('nav.myBookings')}
          </Link>
          {isAdmin() && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {t('nav.admin')}
            </Link>
          )}
        </nav>

        <div className={`user-section ${mobileMenuOpen ? 'active' : ''}`}>
          <button
            className="language-toggle"
            onClick={toggleLanguage}
            title={language === 'sv' ? 'Switch to English' : 'Byt till svenska'}
          >
            {language === 'sv' ? '🇬🇧 EN' : '🇸🇪 SV'}
          </button>
          <div className="user-info">
            <div className="user-avatar">
              {getInitials()}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              {isAdmin() && <span className="user-role">{t('admin.roleAdmin')}</span>}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
