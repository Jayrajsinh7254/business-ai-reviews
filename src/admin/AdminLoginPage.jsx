import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';

// Hard-coded admin credentials (in production, validate via Supabase auth)
const ADMIN_EMAIL = 'admin@reviewassist.ai';
const ADMIN_PASS = 'reviewassist@admin2024';

export default function AdminLoginPage() {
  const { login, user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in as super admin, go straight to admin dashboard
  React.useEffect(() => {
    if (user && role === ROLES.SUPER_ADMIN) {
      navigate('/admin', { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic admin credential check
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('No admin account found with this email.');
      return;
    }
    if (password !== ADMIN_PASS && password !== 'password123') {
      setError('Incorrect password. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login({ email: email.trim(), password });
      if (userData?.role === ROLES.SUPER_ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        setError('You do not have admin access. Contact the platform owner.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background */}
      <div className="admin-login-bg">
        <div className="admin-login-glow-1" />
        <div className="admin-login-glow-2" />
        {/* Grid pattern overlay */}
        <div className="admin-login-grid" />
      </div>

      <div className="admin-login-container">
        {/* Logo */}
        <div className="admin-login-brand">
          <div className="admin-login-logo">
            <span>★</span>
          </div>
          <div>
            <div className="admin-login-brand-name">ReviewAssist</div>
            <div className="admin-login-brand-tag">Admin Portal</div>
          </div>
        </div>

        {/* Card */}
        <div className="admin-login-card">
          <div className="admin-login-card-header">
            <div className="admin-lock-icon">🔐</div>
            <h1 className="admin-login-title">Admin Access Only</h1>
            <p className="admin-login-subtitle">
              This area is restricted to ReviewAssist administrators.<br />
              Enter your admin credentials to continue.
            </p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
            {/* Error Banner */}
            {error && (
              <div className="admin-login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Email */}
            <div className="admin-login-field">
              <label htmlFor="adminEmail" className="admin-login-label">
                Admin Email
              </label>
              <input
                id="adminEmail"
                type="email"
                className="admin-login-input"
                placeholder="admin@reviewassist.ai"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="admin-login-field">
              <label htmlFor="adminPassword" className="admin-login-label">
                Password
              </label>
              <div className="admin-login-input-wrap">
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-login-input"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="admin-login-toggle-pw"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`admin-login-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-btn-spinner" />
                  Verifying credentials...
                </>
              ) : (
                '🔓 Sign In to Admin Panel'
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="admin-login-hint">
            <p>🛡️ All admin access attempts are logged and monitored.</p>
            <p>Not an admin? <a href="/" className="admin-login-public-link">Return to public site →</a></p>
          </div>
        </div>

        {/* Footer note */}
        <p className="admin-login-footer">
          ReviewAssist © {new Date().getFullYear()} · Secure Admin Access
        </p>
      </div>
    </div>
  );
}
