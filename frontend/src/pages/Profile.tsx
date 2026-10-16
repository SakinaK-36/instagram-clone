import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUserProfile, toggleFollowUser } from '../api/users';
import type { UserProfile } from '../api/users';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/useAuth';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refreshProfile = useCallback(() => setReloadKey((k) => k + 1), []);

  // Load the profile (on mount, when the username changes, or after refreshProfile)
  useEffect(() => {
    if (!username) return;
    let active = true;

    fetchUserProfile(username)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
        if (!active) return;
        setProfile(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [username, reloadKey]);

  // Reload when a post is created from the sidebar
  useEffect(() => {
    window.addEventListener('post:created', refreshProfile);
    return () => window.removeEventListener('post:created', refreshProfile);
  }, [refreshProfile]);

  const handleFollowToggle = async () => {
    if (!profile) return;

    // Optimistic update
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !prev.isFollowing,
            followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
          }
        : null
    );

    try {
      await toggleFollowUser(profile.id);
    } catch (err) {
      console.error('Failed to toggle follow', err);
      alert('Could not update follow. Please try again.');
    } finally {
      refreshProfile(); // sync with the server's real state either way
    }
  };

  if (loading) {
    return <p className="muted" style={{ textAlign: 'center', marginTop: '40px' }}>Loading profile...</p>;
  }
  if (!profile) {
    return <p className="muted" style={{ textAlign: 'center', marginTop: '40px' }}>User not found.</p>;
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <main className="feed-layout" style={{ maxWidth: '600px', margin: '30px auto' }}>
      <header style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <div className="avatar-fallback" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>@{profile.username}</h2>

            {!isOwnProfile && (
              <>
                <button
                  onClick={handleFollowToggle}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: profile.isFollowing ? '1px solid var(--border)' : 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: profile.isFollowing ? 'var(--surface-2)' : 'var(--accent)',
                    color: profile.isFollowing ? 'var(--text)' : '#ffffff',
                  }}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </button>

                <Link
                  to={`/direct/${profile.id}`}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Message
                </Link>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '8px', color: 'var(--text)' }}>
            <span><strong>{profile.posts.length}</strong> posts</span>
            <span><strong>{profile.followersCount}</strong> followers</span>
            <span><strong>{profile.followingCount}</strong> following</span>
          </div>

          {profile.fullName && <p style={{ margin: 0, fontWeight: 'bold' }}>{profile.fullName}</p>}
          {profile.bio && <p style={{ margin: 0, color: 'var(--text)' }}>{profile.bio}</p>}
        </div>
      </header>

      <div>
        <h3 style={{ marginBottom: '16px' }}>Posts</h3>
        {profile.posts.length === 0 ? (
          <p className="muted">No posts shared yet.</p>
        ) : (
          profile.posts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdated={refreshProfile} />
          ))
        )}
      </div>
    </main>
  );
};