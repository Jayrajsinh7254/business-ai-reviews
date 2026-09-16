import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSubmitDisabled = !email.trim() || !password || loading;

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.login({
        email: email.trim(),
        password,
      });

      const bizId = result.businessId || result.business?.id || 'demo-1';
      navigate(`/dashboard/${bizId}`, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card-container">
        <div className="page-header text-center">
          <div className="auth-logo-badge">
            <span className="star-icon">★</span>
          </div>
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-subtitle">
            Sign in to manage your AI review collector and view customer insights.
          </p>
        </div>

        <div className="card auth-card">
          <form onSubmit={handleLogin} className="form-layout">
            {error && <div className="alert-banner alert-error">{error}</div>}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address <span className="required-star">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
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
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
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
                    <span className="spinner"></span> Signing In...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>

            {/* Demo Accounts Quick-Select */}
            <div className="demo-accounts-box">
              <div className="demo-header-label">Quick Demo Accounts:</div>
              <div className="demo-buttons-group">
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => handleQuickDemo('admin@apexauto.com', 'password123')}
                >
                  🔧 Apex Auto Care
                </button>
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => handleQuickDemo('admin@lumina.com', 'password123')}
                >
                  ✨ Lumina Studio
                </button>
              </div>
            </div>
          </form>

          <div className="auth-footer-links text-center">
            <p>
              Don't have an account yet?{' '}
              <Link to="/signup" className="auth-action-link">
                Register your business &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
