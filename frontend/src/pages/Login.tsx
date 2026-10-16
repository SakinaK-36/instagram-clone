import React, { useState } from 'react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '../components/Icons';

export const Login: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await loginUser(form);
      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed'
      );
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-logo">Instagram</h1>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        
        {/* Password input wrapper with visibility toggle icon */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={{ width: '100%', paddingRight: '36px' }}
          />
          {form.password && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #8e8e8e)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          )}
        </div>

        <button type="submit">Log In</button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <div className="auth-switch">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </div>
  );
};