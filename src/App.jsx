import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ─── Core Layout & Context (Synchronous for fast hydration) ─
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './lib/rbac';
import './App.css';

// ─── Public / Visitor Pages (Code-split for mobile speed) ───
const HomePage = lazy(() => import('./pages/HomePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const GoogleGuidelinesPage = lazy(() => import('./pages/GoogleGuidelinesPage'));

// ─── Business Owner Dashboard (Protected, Isolated Chunk) ───
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// ─── Admin Console (Protected, Never Loaded by Regular Users) 
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminOverview = lazy(() => import('./admin/AdminOverview'));
const AdminInbox = lazy(() => import('./admin/AdminInbox'));
const AdminQRBuilder = lazy(() => import('./admin/AdminQRBuilder'));
const AdminClients = lazy(() => import('./admin/AdminClients'));
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminProtectedRoute = lazy(() => import('./admin/AdminProtectedRoute'));

// ─── Secondary / E-Commerce Flows (Isolated Chunks) ─────────
const SignupPage = lazy(() => import('./pages/SignupPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));

/**
 * Premium Loading Indicator during dynamic chunk loading
 */
function RouteLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '14px',
        color: '#6366f1',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          border: '3px solid rgba(99, 102, 241, 0.18)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'routeSpin 0.75s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite'
        }}
      />
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.02em' }}>
        Loading ReviewAssist...
      </span>
      <style>{`@keyframes routeSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * PUBLIC LAYOUT — Navbar + Footer wrapper for visitor-facing marketing pages
 */
function PublicLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}

/**
 * CLIENT DASHBOARD LAYOUT — Clean, dedicated portal without marketing footer
 */
function ClientDashboardLayout({ children }) {
  return (
    <div className="app-layout client-app-layout">
      <Navbar />
      <main className="main-content client-dashboard-main">{children}</main>
      <footer className="client-dashboard-footer">
        <p>ReviewAssist Business Suite · Logged in securely</p>
      </footer>
    </div>
  );
}

/**
 * VISITOR ROUTE GUARD
 * Rule: Authenticated clients (Owner or Staff) should only see/access their dashboard.
 * If they navigate to marketing pages, redirect to /dashboard.
 */
function VisitorRoute({ children }) {
  const { user, role } = useAuth();
  if (user && (role === ROLES.BUSINESS_OWNER || role === ROLES.BUSINESS_STAFF)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * REVIEW ROUTE GUARD
 * Public review collection flow accessible to customers and testers scanning QR codes.
 */
function ReviewRouteGuard() {
  return <ReviewPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* ══════════════════════════════════════════
              VISITOR / PUBLIC SIDE
              Home, Contact, Review flow, Legal pages
              ══════════════════════════════════════════ */}
          <Route
            path="/"
            element={
              <VisitorRoute>
                <PublicLayout>
                  <HomePage />
                </PublicLayout>
              </VisitorRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <VisitorRoute>
                <PublicLayout>
                  <ContactPage />
                </PublicLayout>
              </VisitorRoute>
            }
          />
          <Route
            path="/request-qr"
            element={
              <VisitorRoute>
                <PublicLayout>
                  <ContactPage />
                </PublicLayout>
              </VisitorRoute>
            }
          />
          {/* Customer review collection flow — accessible via QR scan, with or without slug, and with trailing slashes */}
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/review/" element={<ReviewPage />} />
          <Route path="/review/:businessId" element={<ReviewPage />} />
          <Route path="/review/:businessId/*" element={<ReviewPage />} />
          <Route path="/r/:businessId" element={<ReviewPage />} />
          <Route path="/qr/:businessId" element={<ReviewPage />} />
          <Route
            path="/login"
            element={
              <VisitorRoute>
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              </VisitorRoute>
            }
          />

          {/* Legal */}
          <Route path="/privacy" element={<PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><TermsOfServicePage /></PublicLayout>} />
          <Route path="/google-guidelines" element={<PublicLayout><GoogleGuidelinesPage /></PublicLayout>} />

          {/* ══════════════════════════════════════════
              BUSINESS OWNER DASHBOARD (Protected)
              ══════════════════════════════════════════ */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboardLayout>
                  <DashboardPage />
                </ClientDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:businessId"
            element={
              <ProtectedRoute>
                <ClientDashboardLayout>
                  <DashboardPage />
                </ClientDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Login — public, no navbar/footer */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ══════════════════════════════════════════
              ADMIN SIDE — /admin/* (Super Admin Only)
              Separate dark layout, isolated admin chunk
              ══════════════════════════════════════════ */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="inbox" element={<AdminInbox />} />
            <Route path="qr-builder" element={<AdminQRBuilder />} />
            <Route path="clients" element={<AdminClients />} />
          </Route>

          {/* ══════════════════════════════════════════
              LEGACY / SECONDARY ROUTES
              ══════════════════════════════════════════ */}
          <Route path="/signup" element={<VisitorRoute><PublicLayout><SignupPage /></PublicLayout></VisitorRoute>} />
          <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
          <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
          <Route path="/checkout/success" element={<PublicLayout><CheckoutSuccessPage /></PublicLayout>} />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <ClientDashboardLayout>
                  <SubscriptionPage />
                </ClientDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
