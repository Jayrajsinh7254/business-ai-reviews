import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const isSubmitDisabled = !email.trim() || !password || loading;

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError('');

    try {
      const user = await login({
        email: email.trim(),
        password,
      });

      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (user.role === ROLES.SUPER_ADMIN) {
        navigate('/admin', { replace: true });
      } else {
        const bizId = user.businessId || 'demo-1';
        navigate(`/dashboard/${bizId}`, { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    setError('');
    try {
      // Simulate fast Google OAuth flow
      const user = await login({
        email: 'owner@apexauto.com',
        password: 'password123',
      });
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else {
        navigate(`/dashboard/${user.businessId || 'demo-1'}`, { replace: true });
      }
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
          {/* Google 1-Click Fast Auth */}
          <button
            type="button"
            className="btn-google-auth btn-block"
            onClick={handleGoogleLogin}
            disabled={socialLoading || loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{socialLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

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

            {/* Fast RBAC Demo Account Buttons */}
            <div className="demo-accounts-box">
              <div className="demo-header-label">⚡ 1-Click Role Logins (Demo Sandbox):</div>
              <div className="demo-buttons-group">
                <button
                  type="button"
                  className="demo-pill-btn role-owner"
                  onClick={() => handleQuickDemo('owner@apexauto.com', 'password123')}
                  title="Log in as Business Owner"
                >
                  👑 Business Owner
                </button>
                <button
                  type="button"
                  className="demo-pill-btn role-staff"
                  onClick={() => handleQuickDemo('staff@apexauto.com', 'password123')}
                  title="Log in as Front Desk Staff"
                >
                  👔 Staff Member
                </button>
                <button
                  type="button"
                  className="demo-pill-btn role-admin"
                  onClick={() => handleQuickDemo('admin@reviewassist.ai', 'password123')}
                  title="Log in as Super Admin"
                >
                  ⚡ Super Admin
                </button>
              </div>
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
