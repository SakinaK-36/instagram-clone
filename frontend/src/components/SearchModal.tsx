import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers } from '../api/users';
import type { BasicUser } from '../api/users';

export const SearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BasicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | undefined>(undefined);
  const requestIdRef = useRef(0);

  // Stop any pending search when the modal closes
  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    window.clearTimeout(timerRef.current);

    const term = value.trim();
    const requestId = ++requestIdRef.current; // lets us ignore out-of-date responses

    if (!term) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    // Wait 300ms after the last keystroke before calling the API
    timerRef.current = window.setTimeout(async () => {
      try {
        const data = await searchUsers(term);
        if (requestId !== requestIdRef.current) return;
        setResults(data);
        setError(null);
      } catch (err) {
        console.error('User search failed', err);
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setError('Search failed. Please try again.');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          padding: '20px',
          borderRadius: '12px',
          width: '380px',
          border: '1px solid var(--border, #dbdbdb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <strong>Search Users</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search username..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border, #dbdbdb)',
            background: 'var(--surface-2, #fafafa)',
            color: 'var(--text, #262626)',
            outline: 'none',
            marginBottom: '16px',
          }}
        />

        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
          {error ? (
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#ed4956' }}>{error}</p>
          ) : loading && results.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center', fontSize: '14px', color: '#8e8e8e' }}>
              Searching...
            </p>
          ) : results.length === 0 && query.trim() !== '' ? (
            <p className="muted" style={{ textAlign: 'center', fontSize: '14px', color: '#8e8e8e' }}>
              No users found.
            </p>
          ) : (
            results.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.username}`}
                onClick={onClose}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '8px 12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--border, #dbdbdb)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {u.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>@{u.username}</div>
                  {u.fullName && (
                    <div className="muted" style={{ fontSize: '12px' }}>{u.fullName}</div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};