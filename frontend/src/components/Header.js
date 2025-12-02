import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
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
          <span className="logo-icon">💪</span>
          FitBook
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
            Träningspass
          </Link>
          <Link
            to="/my-bookings"
            className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Mina Bokningar
          </Link>
          {isAdmin() && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className={`user-section ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="user-info">
            <div className="user-avatar">
              {getInitials()}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              {isAdmin() && <span className="user-role">Administratör</span>}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logga ut
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
