import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../api/posts';
import type { Post } from '../api/posts';
import { PostCard } from '../components/PostCard';
import { Stories } from '../components/Stories';
import { useAuth } from '../context/useAuth';
import { connectSocket } from '../socket';

const PostSkeleton: React.FC = () => (
  <div className="post skeleton">
    <div className="sk-row">
      <span className="sk-circle" />
      <span className="sk-line" style={{ width: 120 }} />
    </div>
    <div className="sk-image" />
    <span className="sk-line" style={{ width: '60%' }} />
  </div>
);

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { user } = useAuth();

  // Used by PostCard (after a delete) and by the Retry button
  const reload = useCallback(() => {
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  // Load the feed (runs on mount and whenever reloadKey changes)
  useEffect(() => {
    let active = true;

    fetchPosts()
      .then((data) => {
        if (!active) return;
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load posts', err);
        if (!active) return;
        setError('Could not load posts. Please try again.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

    // Reload the feed when a post is created from the sidebar
  useEffect(() => {
    window.addEventListener('post:created', reload);
    return () => window.removeEventListener('post:created', reload);
  }, [reload]);
  
  // Real-time likes and comments
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const onLiked = ({ postId, userId, liked }: { postId: string; userId: string; liked: boolean }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const without = post.likes.filter((l) => l.userId !== userId);
          return { ...post, likes: liked ? [...without, { userId }] : without };
        })
      );
    };

    const onComment = ({ postId, comment }: { postId: string; comment: Post['comments'][number] }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          if (post.comments.some((c) => c.id === comment.id)) return post;
          return { ...post, comments: [...post.comments, comment] };
        })
      );
    };

    socket.on('post_liked', onLiked);
    socket.on('new_comment', onComment);

    return () => {
      socket.off('post_liked', onLiked);
      socket.off('new_comment', onComment);
    };
  }, []);

  const suggestions = Array.from(new Set(posts.map((p) => p.author.username)))
    .filter((name) => name !== user?.username)
    .slice(0, 5);

  return (
    <div className="home-grid">
      <main className="feed-layout">
        <Stories posts={posts} />

        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : error ? (
          <div className="empty-state">
            <h3>Something went wrong</h3>
            <p className="muted">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                reload();
              }}
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p className="muted">Tap the + icon on the sidebar to share your first photo.</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onPostUpdated={reload} />)
        )}
      </main>

      <aside className="suggestions">
        {user && (
          <div className="suggestion-row me">
            <span className="avatar-fallback md">{user.username[0].toUpperCase()}</span>
            <div className="suggestion-info">
              <strong>{user.username}</strong>
            </div>
          </div>
        )}
        {suggestions.length > 0 && (
          <>
            <div className="suggestions-title">
              <span className="muted">Suggested for you</span>
            </div>
            {suggestions.map((name) => (
              <div className="suggestion-row" key={name}>
                <span className="avatar-fallback md">{name[0].toUpperCase()}</span>
                <div className="suggestion-info">
                  <Link to={`/profile/${name}`}>{name}</Link>
                  <span className="muted small">Suggested for you</span>
                </div>
              </div>
            ))}
          </>
        )}
        <p className="muted small footer-note">© 2026 INSTAGRAM CLONE</p>
      </aside>
    </div>
  );
};