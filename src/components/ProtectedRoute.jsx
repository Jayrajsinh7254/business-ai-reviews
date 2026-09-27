import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — gates access to authenticated + active-subscription routes.
 * - Unauthenticated users → /login
 * - Canceled/past_due subscriptions → /checkout with a warning banner
 * - Trialing users → full access (14-day free trial)
 */
export default function ProtectedRoute({ children, requireActiveSubscription = false }) {
  const { user, subscription } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: "Please sign in to continue." }} replace />;
  }

  if (requireActiveSubscription && subscription) {
    const isBlocked = subscription.status === "canceled" || subscription.status === "past_due";
    if (isBlocked) {
      return (
        <Navigate
          to={`/checkout?plan=${subscription.planId || "pro"}&blocked=1`}
          state={{ warning: subscription.status === "past_due"
            ? "Your last payment failed. Please update your payment method to restore access."
            : "Your subscription has ended. Reactivate to access your dashboard." }}
          replace
        />
      );
    }
  }

  return children;
}
