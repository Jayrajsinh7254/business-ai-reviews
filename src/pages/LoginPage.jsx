import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login, user, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // If already logged in, redirect directly to dashboard (or admin)
  React.useEffect(() => {
    if (user) {
      if (role === ROLES.SUPER_ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, role, navigate]);

  const isSubmitDisabled = !email.trim() || !password || loading;

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError('');

    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
      });

      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (loggedUser.role === ROLES.SUPER_ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotPassword(false);
    }, 3500);
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card-container">
        {/* Header Branding */}
        <div className="page-header text-center auth-header-wrap">
          <div className="auth-logo-badge">
            <span className="star-icon">★</span>
          </div>
          <h1 className="page-title">Welcome to ReviewAssist</h1>
          <p className="page-subtitle">
            Sign in to manage your AI review collector, team permissions, and subscription.
          </p>
        </div>

        <div className="card auth-card">
          <form onSubmit={handleLogin} className="form-layout">
            {error && <div className="alert-banner alert-error animate-fade-in">{error}</div>}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Work Email Address <span className="required-star">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourbusiness.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">
                  Password <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-row-remember">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me for 30 days</span>
              </label>

              <button
                type="button"
                className="btn-link-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary btn-block btn-lg"
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <span className="btn-loading-state">
                    <span className="spinner" /> Signing In...
                  </span>
                ) : (
                  'Sign In to Dashboard →'
                )}
              </button>
            </div>
          </form>

          {/* Footer Signup Link */}
          <div className="auth-footer-links text-center">
            <p>
              New to ReviewAssist?{' '}
              <Link to="/signup" className="auth-action-link font-semibold">
                Start 14-Day Free Trial &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-backdrop" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Reset Your Password</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowForgotPassword(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtext">
              Enter your account email address and we'll send a password recovery reset link.
            </p>

            {forgotSuccess ? (
              <div className="alert-banner alert-success animate-fade-in">
                ✓ Password reset link has been dispatched to <strong>{forgotEmail}</strong>. Check your inbox!
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="form-layout">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@yourbusiness.com"
                    required
                  />
                </div>
                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="btn-outline btn-md"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary btn-md">
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
