import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ─── Public Layout Components ───────────────────────────────
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './lib/rbac';

// ─── Public / Visitor Pages ──────────────────────────────────
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import ReviewPage from './pages/ReviewPage';
import LoginPage from './pages/LoginPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import GoogleGuidelinesPage from './pages/GoogleGuidelinesPage';

// ─── Business Owner Dashboard (Protected) ────────────────────
import DashboardPage from './pages/DashboardPage';

// ─── Admin Side (Protected) ───────────────────────────────────
import AdminLayout from './admin/AdminLayout';
import AdminOverview from './admin/AdminOverview';
import AdminInbox from './admin/AdminInbox';
import AdminQRBuilder from './admin/AdminQRBuilder';
import AdminClients from './admin/AdminClients';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminProtectedRoute from './admin/AdminProtectedRoute';

// ─── Legacy / Internal (keep accessible but not linked) ──────
import SignupPage from './pages/SignupPage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import SubscriptionPage from './pages/SubscriptionPage';

import './App.css';

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
 * Rule 6: Authenticated clients (Owner or Staff) should only see/access their dashboard.
 * If they navigate to marketing pages (Home, Contact / Get QR, Login), redirect to /dashboard.
 */
function VisitorRoute({ children }) {
  const { user, role } = useAuth();
  if (user && (role === ROLES.BUSINESS_OWNER || role === ROLES.BUSINESS_STAFF)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * REVIEW DEMO GUARD
 * Clients do not need the demo review page; redirect them to their dashboard.
 */
function ReviewRouteGuard() {
  const { user, role } = useAuth();
  if (user && (role === ROLES.BUSINESS_OWNER || role === ROLES.BUSINESS_STAFF)) {
    // If client visits demo review page, send them to dashboard
    if (window.location.pathname.includes('/review/demo-1')) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return <ReviewPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ══════════════════════════════════════════
            VISITOR / PUBLIC SIDE
            Home, Contact, Review flow, Legal pages
            Protected by VisitorRoute so logged-in clients
            are kept focused in their Dashboard.
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
        <Route path="/review/:businessId" element={<ReviewRouteGuard />} />
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
            Accessed by clients after we onboard them
            Dedicated clean client layout without marketing footer
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
            Own login gate at /admin/login
            Separate dark layout (no public navbar)
            ══════════════════════════════════════════ */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          {/* Admin nested routes rendered into <Outlet /> */}
          <Route index element={<AdminOverview />} />
          <Route path="inbox" element={<AdminInbox />} />
          <Route path="qr-builder" element={<AdminQRBuilder />} />
          <Route path="clients" element={<AdminClients />} />
        </Route>

        {/* ══════════════════════════════════════════
            LEGACY / INTERNAL ROUTES (not advertised)
            Kept functional for backward compatibility
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
    </AuthProvider>
  );
}
