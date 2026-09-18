import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES, hasPermission, PERMISSIONS } from '../lib/rbac';
import { getPlan, isFeatureAllowed } from '../lib/plans';
import { api } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_AUTH_STATE = 'reviewassist_auth_state';

// Pre-configured default demo users representing each role
export const DEMO_PROFILES = {
  [ROLES.SUPER_ADMIN]: {
    id: 'user-admin-01',
    email: 'admin@reviewassist.ai',
    name: 'Alex Rivera (SaaS Admin)',
    role: ROLES.SUPER_ADMIN,
    businessId: 'demo-1',
    isSuperAdmin: true,
  },
  [ROLES.BUSINESS_OWNER]: {
    id: 'user-owner-01',
    email: 'admin@apexauto.com',
    name: 'Marcus Vance (Apex Owner)',
    role: ROLES.BUSINESS_OWNER,
    businessId: 'demo-1',
    isSuperAdmin: false,
  },
  [ROLES.BUSINESS_STAFF]: {
    id: 'user-staff-01',
    email: 'staff@apexauto.com',
    name: 'Elena Rostova (Front Desk)',
    role: ROLES.BUSINESS_STAFF,
    businessId: 'demo-1',
    isSuperAdmin: false,
  },
};

export function AuthProvider({ children }) {
  // Initialize user from localStorage or default to Business Owner
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_STATE);
      if (saved) return JSON.parse(saved);
    } catch {}
    const cur = api.getCurrentUser();
    if (cur) {
      return {
        ...DEMO_PROFILES[ROLES.BUSINESS_OWNER],
        ...cur,
        role: cur.role || ROLES.BUSINESS_OWNER,
      };
    }
    return DEMO_PROFILES[ROLES.BUSINESS_OWNER];
  });

  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState({
    planId: 'pro',
    status: 'active',
    billingInterval: 'monthly',
    amount: 49,
    currentPeriodEnd: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerationsUsed: 38,
    whatsappInvitesUsed: 64,
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync state to storage
  const persistUser = (newUser) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(STORAGE_AUTH_STATE, JSON.stringify(newUser));
        localStorage.setItem('reviewassist_current_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem(STORAGE_AUTH_STATE);
        localStorage.removeItem('reviewassist_current_user');
      }
    } catch (err) {
      console.warn('Storage sync notice:', err);
    }
  };

  // Load business & subscription data for active user
  const loadUserData = useCallback(async (bizId) => {
    const targetBizId = bizId || user?.businessId || 'demo-1';
    try {
      const [bizData, subData, teamData] = await Promise.allSettled([
        api.getBusiness(targetBizId),
        api.getSubscription ? api.getSubscription(targetBizId) : Promise.resolve(null),
        api.getTeamMembers ? api.getTeamMembers(targetBizId) : Promise.resolve([]),
      ]);

      if (bizData.status === 'fulfilled' && bizData.value) {
        setBusiness(bizData.value);
      }
      if (subData.status === 'fulfilled' && subData.value) {
        setSubscription(subData.value);
      }
      if (teamData.status === 'fulfilled' && Array.isArray(teamData.value)) {
        setTeamMembers(teamData.value);
      }
    } catch (err) {
      console.warn('Failed to load user business context:', err);
    }
  }, [user?.businessId]);

  useEffect(() => {
    loadUserData(user?.businessId);
  }, [user?.businessId, loadUserData]);

  // Role Switcher for instant live interactive demo testing
  const switchRole = (newRole) => {
    if (!DEMO_PROFILES[newRole]) return;
    const profile = {
      ...DEMO_PROFILES[newRole],
      businessId: user?.businessId || 'demo-1',
    };
    persistUser(profile);
  };

  // Sign In
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      const determinedRole =
        email.toLowerCase().includes('admin@reviewassist')
          ? ROLES.SUPER_ADMIN
          : email.toLowerCase().includes('staff')
          ? ROLES.BUSINESS_STAFF
          : ROLES.BUSINESS_OWNER;

      const userData = {
        id: res.user?.id || `user-${Date.now()}`,
        email: res.user?.email || email,
        name: res.user?.name || (determinedRole === ROLES.SUPER_ADMIN ? 'Super Admin' : 'Business Owner'),
        role: determinedRole,
        businessId: res.businessId || res.business?.id || 'demo-1',
        isSuperAdmin: determinedRole === ROLES.SUPER_ADMIN,
      };

      persistUser(userData);
      if (res.business) {
        setBusiness(res.business);
      }
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const signup = async (formData) => {
    setLoading(true);
    try {
      const res = await api.signup(formData);
      const userData = {
        id: res.user?.id || `user-${Date.now()}`,
        email: formData.email,
        name: formData.name,
        role: ROLES.BUSINESS_OWNER, // New signups are business owners
        businessId: res.business?.id || 'demo-1',
        isSuperAdmin: false,
      };

      // Set selected plan or default to Pro 14-day trial
      const initialPlan = formData.planId || 'pro';
      const initialSub = {
        planId: initialPlan,
        status: 'trialing',
        billingInterval: formData.billingInterval || 'monthly',
        amount: initialPlan === 'starter' ? 19 : initialPlan === 'pro' ? 49 : 99,
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerationsUsed: 0,
        whatsappInvitesUsed: 0,
      };

      persistUser(userData);
      setSubscription(initialSub);
      if (res.business) {
        setBusiness(res.business);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const logout = async () => {
    await api.logout();
    persistUser(null);
    setBusiness(null);
  };

  // Upgrade / Update Subscription Plan
  const updateSubscriptionPlan = async (newPlanId, billingInterval = 'monthly') => {
    const targetBizId = user?.businessId || 'demo-1';
    const planObj = getPlan(newPlanId);
    const updatedSub = {
      planId: planObj.id,
      status: 'active',
      billingInterval,
      amount: billingInterval === 'annual' ? planObj.annualPrice : planObj.monthlyPrice,
      currentPeriodEnd: new Date(Date.now() + (billingInterval === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      aiGenerationsUsed: subscription?.aiGenerationsUsed || 0,
      whatsappInvitesUsed: subscription?.whatsappInvitesUsed || 0,
    };

    setSubscription(updatedSub);
    if (api.updateSubscription) {
      await api.updateSubscription(targetBizId, updatedSub);
    }
    return updatedSub;
  };

  // Invite Team Member
  const inviteMember = async ({ email, name, role }) => {
    const targetBizId = user?.businessId || 'demo-1';
    const newMember = {
      id: `mem-${Math.random().toString(36).substring(2, 8)}`,
      businessId: targetBizId,
      email: email.trim(),
      name: name.trim(),
      role: role || ROLES.BUSINESS_STAFF,
      status: 'active',
      invitedAt: new Date().toISOString(),
    };

    const updated = [newMember, ...teamMembers];
    setTeamMembers(updated);
    if (api.saveTeamMembers) {
      await api.saveTeamMembers(targetBizId, updated);
    }
    return newMember;
  };

  // Remove Team Member
  const removeMember = async (memberId) => {
    const targetBizId = user?.businessId || 'demo-1';
    const updated = teamMembers.filter((m) => m.id !== memberId);
    setTeamMembers(updated);
    if (api.saveTeamMembers) {
      await api.saveTeamMembers(targetBizId, updated);
    }
  };

  // Change Team Member Role
  const changeMemberRole = async (memberId, newRole) => {
    const targetBizId = user?.businessId || 'demo-1';
    const updated = teamMembers.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
    setTeamMembers(updated);
    if (api.saveTeamMembers) {
      await api.saveTeamMembers(targetBizId, updated);
    }
  };

  // Permission checkers
  const checkPermission = (permission) => {
    const currentRole = user?.role || ROLES.CUSTOMER;
    return hasPermission(currentRole, permission);
  };

  const isFeatureUnlocked = (featureKey) => {
    return isFeatureAllowed(subscription?.planId, featureKey);
  };

  const value = {
    user,
    role: user?.role || ROLES.CUSTOMER,
    business,
    subscription,
    teamMembers,
    loading,
    hasPermission: checkPermission,
    can: checkPermission,
    isFeatureUnlocked,
    switchRole,
    login,
    signup,
    logout,
    updateSubscriptionPlan,
    inviteMember,
    removeMember,
    changeMemberRole,
    refreshUserData: () => loadUserData(user?.businessId),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
