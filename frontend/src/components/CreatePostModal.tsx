import React, { useState } from 'react';
import { createPost } from '../api/posts';

interface CreatePostProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePostModal: React.FC<CreatePostProps> = ({ onClose, onSuccess }) => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('image', file);
      if (caption.trim()) formData.append('caption', caption.trim());

      await createPost(formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          padding: '20px',
          borderRadius: '12px',
          width: '420px',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <strong>Create new post</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {previewUrl ? (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                style={{
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#0095f6',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Choose a different image
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              style={{ marginBottom: '16px', color: 'var(--text)' }}
            />
          )}

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              outline: 'none',
              resize: 'none',
              marginBottom: '16px',
            }}
          />

          <button
            type="submit"
            disabled={!file || submitting}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#0095f6',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: !file || submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
};