import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, markNotificationsRead } from '../api/notifications';
import type { NotificationItem } from '../api/notifications';
import { connectSocket } from '../socket';

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const renderText = (type: NotificationItem['type']) => {
  switch (type) {
    case 'LIKE':
      return 'liked your post.';
    case 'COMMENT':
      return 'commented on your post.';
    case 'FOLLOW':
      return 'started following you.';
    default:
      return 'interacted with your profile.';
  }
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notifications, then mark them read (only if something was unread)
  useEffect(() => {
    let active = true;

    fetchNotifications()
      .then((data) => {
        if (!active) return;
        setNotifications(data);
        setLoading(false);
        if (data.some((n) => !n.read)) {
          markNotificationsRead().catch((err) =>
            console.error('Failed to mark notifications as read', err)
          );
        }
      })
      .catch((err) => {
        console.error('Error fetching notifications:', err);
        if (!active) return;
        setError('Could not load notifications.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // New notifications appear live while the page is open
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const onNew = (n: NotificationItem) => {
      setNotifications((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
      // The user is looking at this page, so keep the unread count at zero
      markNotificationsRead().catch((err) =>
        console.error('Failed to mark notifications as read', err)
      );
    };

    socket.on('new_notification', onNew);
    return () => {
      socket.off('new_notification', onNew);
    };
  }, []);

  return (
    <main style={{ maxWidth: '500px', margin: '30px auto', padding: '0 16px', textAlign: 'left' }}>
      <h2 style={{ marginBottom: '20px', color: 'var(--text)' }}>Notifications</h2>

      {loading ? (
        <p className="muted">Loading activity...</p>
      ) : error ? (
        <p style={{ color: '#ed4956' }}>{error}</p>
      ) : notifications.length === 0 ? (
        <p className="muted">No recent notifications.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => {
            const username = n.issuer?.username || 'user';
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: n.read ? 'var(--surface)' : 'var(--surface-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--border)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 'bold',
                      color: 'var(--text)',
                      flexShrink: 0,
                    }}
                  >
                    {username[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                    <Link
                      to={`/profile/${username}`}
                      style={{ color: 'var(--text)', fontWeight: 'bold' }}
                    >
                      @{username}
                    </Link>{' '}
                    {renderText(n.type)}{' '}
                    <span className="muted" style={{ fontSize: '12px' }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </div>

                {n.post && (
                  <img
                    src={n.post.imageUrl}
                    alt="post preview"
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};