import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { Post } from '../api/posts';

interface StoriesProps {
  posts: Post[];
}

/**
 * Stories row. Your backend has no stories yet, so this builds the row from
 * the unique authors of recent posts. Swap `authors` for a real stories API later.
 */
export const Stories: React.FC<StoriesProps> = ({ posts }) => {
  const { user } = useAuth();

  const authors = Array.from(
    new Map(posts.map((p) => [p.author.username, p.author.username])).values()
  ).filter((name) => name !== user?.username);

  if (!user && authors.length === 0) return null;

  return (
    <div className="stories" role="list">
      {user && (
        <Link to={`/profile/${user.username}`} className="story" role="listitem">
          <div className="story-ring seen">
            <span className="avatar-fallback story-avatar">{user.username[0].toUpperCase()}</span>
          </div>
          <span className="story-name">Your story</span>
        </Link>
      )}
      {authors.map((name) => (
        <Link to={`/profile/${name}`} key={name} className="story" role="listitem">
          <div className="story-ring">
            <span className="avatar-fallback story-avatar">{name[0].toUpperCase()}</span>
          </div>
          <span className="story-name">{name}</span>
        </Link>
      ))}
    </div>
  );
};
