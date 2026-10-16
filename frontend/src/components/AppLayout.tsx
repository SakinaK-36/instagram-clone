import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CreatePost } from './CreatePost';

interface AppLayoutProps {
  children: React.ReactNode;
  onPostCreated?: () => void;
}

/** Wraps any page with the sidebar / bottom nav and the create-post modal. */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, onPostCreated }) => {
  const [creating, setCreating] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar onCreateClick={() => setCreating(true)} />
      <div className="app-content">{children}</div>
      {creating && (
        <CreatePost
          onClose={() => setCreating(false)}
          onPostCreated={() => {
            setCreating(false);
            window.dispatchEvent(new Event('post:created'));
            onPostCreated?.();
          }}
        />
      )}
    </div>
  );
};
