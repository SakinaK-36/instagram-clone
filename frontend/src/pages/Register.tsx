import React, { useState } from 'react';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export const Register: React.FC = () => {
  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const data = await registerUser(form);
      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-logo">Instagram</h1>
        <p className="auth-tagline">Sign up to see photos and videos from your friends.</p>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Full Name"
          autoComplete="name"
          maxLength={100}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <input
          placeholder="Username"
          autoComplete="username"
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9._]+"
          title="3-30 characters: letters, numbers, dots or underscores"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <div className="auth-switch">
        Have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
};