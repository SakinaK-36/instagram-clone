import React, { useEffect, useState, useMemo } from 'react';
import { createPost } from '../api/posts';
import { CloseIcon, ImageIcon } from './Icons';

interface CreatePostProps {
  onPostCreated: () => void;
  onClose: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, onClose }) => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clean object URL generation derived directly from state without sync setState in useEffect
  const preview = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Clean up object URL memory when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Close on Escape key press
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }

    try {
      setLoading(true);
      setError('');
      await createPost(formData);
      setCaption('');
      setFile(null);
      onPostCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to upload post'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Create new post"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <CloseIcon size={22} />
            </button>
            <h3>Create new post</h3>
            <button type="submit" className="link-btn" disabled={loading || !file}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>

          <div className="modal-body">
            <label className={`dropzone ${preview ? 'has-preview' : ''}`}>
              {preview ? (
                <img src={preview} alt="Selected preview" />
              ) : (
                <div className="dropzone-empty">
                  <ImageIcon size={64} />
                  <p>Select a photo to share</p>
                  <span className="dropzone-btn">Select from device</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                hidden
              />
            </label>

            <div className="modal-side">
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
                maxLength={2200}
              />
              <small className="muted">{caption.length}/2,200</small>
              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};