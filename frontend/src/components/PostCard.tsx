import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleLikePost, createComment, deletePost } from '../api/posts';
import type { Post, Comment } from '../api/posts';
import { useAuth } from '../context/useAuth';
import { HeartIcon, CommentIcon, MessageIcon, SaveIcon, MoreIcon } from './Icons';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
}

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

export const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [saved, setSaved] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [burst, setBurst] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Sync with live updates from the feed by adjusting state during render (React's recommended pattern)
  const [prevLikes, setPrevLikes] = useState(post.likes);
  if (post.likes !== prevLikes) {
    setPrevLikes(post.likes);
    setLikes(post.likes || []);
  }

  const [prevComments, setPrevComments] = useState(post.comments);
  if (post.comments !== prevComments) {
    setPrevComments(post.comments);
    setComments(post.comments || []);
  }

  const isLiked = likes.some((like) => like.userId === user?.id);
  const isOwner = user?.id === post.author.id;

  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        setLikes((prev) => prev.filter((l) => l.userId !== user?.id));
      } else if (user) {
        setLikes((prev) => [...prev, { userId: user.id }]);
      }
      await toggleLikePost(post.id);
    } catch (err) {
      console.error('Failed to toggle like', err);
      onPostUpdated();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post.id);
        setShowMenu(false);
        onPostUpdated(); // Reloads feed/profile posts
      } catch (err) {
        console.error('Failed to delete post:', err);
        alert('Could not delete post. Ensure you are the author.');
      }
    }
  };

  const handleDoubleClick = () => {
    setBurst(true);
    window.setTimeout(() => setBurst(false), 700);
    if (!isLiked) handleLikeToggle();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    try {
      setSubmittingComment(true);
      const newComment = await createComment(post.id, text);
      setComments((prev) =>
        prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]
      );
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment', err);
      alert('Could not post your comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const visibleComments = showAllComments ? comments : comments.slice(-2);
  const hiddenCount = comments.length - visibleComments.length;

  return (
    <article className="post" style={{ position: 'relative' }}>
      <header className="post-header">
        <Link to={`/profile/${post.author.username}`} className="post-author">
          <span className="story-ring small">
            <span className="avatar-fallback sm">{post.author.username[0].toUpperCase()}</span>
          </span>
          <span className="post-username">{post.author.username}</span>
        </Link>
        <span className="post-dot">•</span>
        <span className="post-time">{timeAgo(post.createdAt)}</span>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            type="button"
            className="icon-btn post-more"
            aria-label="More options"
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <MoreIcon size={20} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '30px',
                right: '0',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '120px',
              }}
            >
              {isOwner ? (
                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#ed4956',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="post-media" onDoubleClick={handleDoubleClick}>
        <img src={post.imageUrl} alt={`Post by ${post.author.username}`} className="post-image" />
        {burst && (
          <span className="like-burst" aria-hidden="true">
            <HeartIcon size={96} filled />
          </span>
        )}
      </div>

      <div className="post-body">
        <div className="post-actions">
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`icon-btn ${isLiked ? 'liked' : ''}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
            aria-pressed={isLiked}
          >
            <HeartIcon size={26} filled={isLiked} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Comment"
            onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}
          >
            <CommentIcon size={26} />
          </button>

          <Link
            to={`/direct/${post.author.id}`}
            className="icon-btn"
            aria-label={`Message @${post.author.username}`}
            title={`Message @${post.author.username}`}
            style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center' }}
          >
            <MessageIcon size={24} />
          </Link>

          <button
            type="button"
            className="icon-btn push-right"
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? 'Remove from saved' : 'Save'}
            aria-pressed={saved}
          >
            <SaveIcon size={26} filled={saved} />
          </button>
        </div>

        <div className="post-likes">
          {likes.length} {likes.length === 1 ? 'like' : 'likes'}
        </div>

        {post.caption && (
          <p className="post-caption">
            <Link to={`/profile/${post.author.username}`} className="inline-user">
              {post.author.username}
            </Link>{' '}
            {post.caption}
          </p>
        )}

        {hiddenCount > 0 && (
          <button type="button" className="view-comments" onClick={() => setShowAllComments(true)}>
            View all {comments.length} comments
          </button>
        )}

        {visibleComments.map((comment) => (
          <p key={comment.id} className="post-comment">
            <Link to={`/profile/${comment.user.username}`} className="inline-user">
              {comment.user.username}
            </Link>{' '}
            {comment.content}
          </p>
        ))}
      </div>

      <form onSubmit={handleCommentSubmit} className="comment-form">
        <input
          id={`comment-${post.id}`}
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        {commentText.trim() && (
          <button type="submit" disabled={submittingComment}>
            Post
          </button>
        )}
      </form>
    </article>
  );
};