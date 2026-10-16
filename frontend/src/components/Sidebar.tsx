import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { connectSocket } from '../socket';
import { fetchUnreadCount } from '../api/notifications';import { useTheme } from '../context/useTheme';
import { SearchModal } from './SearchModal';
import {
  HomeIcon,
  SearchIcon,
  MessageIcon,
  PlusSquareIcon,
  LogoutIcon,
  NotificationIcon,
} from './Icons';

interface SidebarProps {
  onCreateClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  const isNotificationsPage = location.pathname === '/notifications';
  const profilePath = user ? `/profile/${user.username}` : '/';

  // Load the unread count on every route change, so it is correct after leaving Notifications
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    fetchUnreadCount()
      .then((count) => {
        if (active) setUnreadCount(count);
      })
      .catch((err) => console.error('Failed to load unread count', err));

    return () => {
      active = false;
    };
  }, [user?.id, location.pathname]);

  // Live notifications (uses the shared, authenticated socket, so no disconnect here)
  useEffect(() => {
    if (!user?.id) return;
    const socket = connectSocket();
    if (!socket) return;

    const onNew = () => {
      if (window.location.pathname !== '/notifications') {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('new_notification', onNew);
    return () => {
      socket.off('new_notification', onNew);
    };
  }, [user?.id]);

  const showBadge = unreadCount > 0 && !isNotificationsPage;

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-text">Instagram</span>
          <span className="sidebar-logo-mark">
            <HomeIcon size={24} />
          </span>
        </Link>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link">
            <HomeIcon size={26} />
            <span>Home</span>
          </NavLink>

          <button type="button" className="sidebar-link" onClick={() => setShowSearch(true)}>
            <SearchIcon size={26} />
            <span>Search</span>
          </button>

          <NavLink
            to="/notifications"
            className="sidebar-link"
            onClick={() => setUnreadCount(0)}
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <NotificationIcon size={26} />
              {showBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ed4956',
                    borderRadius: '50%',
                  }}
                />
              )}
            </span>
            <span>Notifications</span>
          </NavLink>

          <NavLink to="/direct" className="sidebar-link">
            <MessageIcon size={26} />
            <span>Messages</span>
          </NavLink>

          <button type="button" className="sidebar-link" onClick={onCreateClick}>
            <PlusSquareIcon size={26} />
            <span>Create</span>
          </button>

          <NavLink to={profilePath} className="sidebar-link">
            <span className="avatar-fallback sm">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-link" onClick={toggleTheme}>
            <span className="sidebar-emoji">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button type="button" className="sidebar-link" onClick={logout}>
            <LogoutIcon size={26} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile navigation */}
      <header className="mobile-top">
        <span className="mobile-logo">Instagram</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button type="button" className="icon-btn" onClick={() => setShowSearch(true)}>
            <SearchIcon size={22} />
          </button>
          <NavLink
            to="/notifications"
            onClick={() => setUnreadCount(0)}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', color: 'inherit' }}
          >
            <NotificationIcon size={24} />
            {showBadge && (
              <span
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: '#ed4956',
                  borderRadius: '50%',
                }}
              />
            )}
          </NavLink>
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <nav className="mobile-bottom" aria-label="Primary">
        <NavLink to="/" end className="mobile-link" aria-label="Home">
          <HomeIcon size={26} />
        </NavLink>
        <button type="button" className="mobile-link" onClick={() => setShowSearch(true)}>
          <SearchIcon size={26} />
        </button>
        <button type="button" className="mobile-link" onClick={onCreateClick} aria-label="Create post">
          <PlusSquareIcon size={26} />
        </button>
        <NavLink to="/direct" className="mobile-link" aria-label="Messages">
          <MessageIcon size={26} />
        </NavLink>
        <NavLink to={profilePath} className="mobile-link" aria-label="Profile">
          <span className="avatar-fallback sm">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </span>
        </NavLink>
      </nav>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
};