import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PRICE_MAP: Record<string, number> = {
  starter: 299,
  pro: 499,
  enterprise: 799,
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validPlan(planId: string): boolean {
  return Object.prototype.hasOwnProperty.call(PRICE_MAP, planId);
}

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) break;
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Server configuration is incomplete" }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Invalid authentication session" }, 401);

    const { data: callerProfile, error: profileError } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();
    if (profileError || callerProfile?.role !== "super_admin") {
      return json({ error: "Super-admin access is required" }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const action = body.action === "update"
      ? "update"
      : body.action === "list"
      ? "list"
      : body.action === "review-manual-payment"
      ? "review-manual-payment"
      : "create";

    if (action === "list") {
      const { data: businesses, error: businessesError } = await admin
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });
      if (businessesError) throw businessesError;
      return json({ success: true, businesses: businesses ?? [] });
    }

    if (action === "review-manual-payment") {
      const requestId = cleanText(body.requestId);
      const decision = cleanText(body.decision).toLowerCase();
      const rejectionReason = cleanText(body.rejectionReason);
      if (!requestId || !["approved", "rejected"].includes(decision)) {
        return json({ error: "Request ID and a valid decision are required" }, 400);
      }
      if (decision === "rejected" && !rejectionReason) {
        return json({ error: "A rejection reason is required" }, 400);
      }

      const { data: payment, error: paymentError } = await admin
        .from("manual_payment_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (paymentError) throw paymentError;
      if (!payment) return json({ error: "Payment request not found" }, 404);
      if (payment.status !== "pending") return json({ error: "This payment request has already been reviewed" }, 409);

      const reviewedAt = new Date().toISOString();
      const { error: updatePaymentError } = await admin
        .from("manual_payment_requests")
        .update({
          status: decision,
          reviewed_by: callerData.user.id,
          reviewed_at: reviewedAt,
          rejection_reason: decision === "rejected" ? rejectionReason : "",
        })
        .eq("id", requestId)
        .eq("status", "pending");
      if (updatePaymentError) throw updatePaymentError;

      if (decision === "approved") {
        const periodDays = payment.billing_interval === "annual" ? 365 : 30;
        const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();
        const { error: businessError } = await admin
          .from("businesses")
          .update({
            plan_id: payment.plan_id,
            subscription_status: "active",
            status: "active",
            paid_until: periodEnd,
          })
          .eq("id", payment.business_id);
        if (businessError) throw businessError;

        const { error: subscriptionError } = await admin
          .from("subscriptions")
          .upsert({
            id: `sub-${payment.business_id}`,
            business_id: payment.business_id,
            plan_id: payment.plan_id,
            status: "active",
            billing_interval: payment.billing_interval,
            amount: payment.amount,
            current_period_end: periodEnd,
          }, { onConflict: "business_id" });
        if (subscriptionError) throw subscriptionError;
      }

      return json({ success: true, requestId, status: decision });
    }

    const email = cleanText(body.email).toLowerCase();
    const businessName = cleanText(body.businessName);
    const ownerName = cleanText(body.ownerName) || businessName;
    const businessId = cleanText(body.businessId || body.id);
    const planId = cleanText(body.planId || "pro").toLowerCase();
    const password = cleanText(body.password);

    if (!email || !email.includes("@") || !businessName || !validPlan(planId)) {
      return json({ error: "Valid email, business name, and plan are required" }, 400);
    }
    if (action === "update" && !businessId) {
      return json({ error: "Business ID is required for update" }, 400);
    }
    if (password && password.length < 8) {
      return json({ error: "Password must contain at least 8 characters" }, 400);
    }

    let user = await findUserByEmail(admin, email);
    let generatedPassword = password;

    if (action === "update" && !user) {
      const { data: existingBusiness, error: existingBusinessError } = await admin
        .from("businesses")
        .select("user_id")
        .eq("id", businessId)
        .maybeSingle();
      if (existingBusinessError) throw existingBusinessError;
      if (existingBusiness?.user_id) {
        const { data: existingUser, error: existingUserError } = await admin.auth.admin.getUserById(existingBusiness.user_id);
        if (existingUserError) throw existingUserError;
        user = existingUser.user;
        if (user && email !== user.email?.toLowerCase()) {
          const { data: updatedUser, error: emailError } = await admin.auth.admin.updateUserById(user.id, { email });
          if (emailError) throw emailError;
          user = updatedUser.user;
        }
      }
    }

    if (action === "create" && !user) {
      generatedPassword = password || crypto.randomUUID().replaceAll("-", "").slice(0, 16) + "Aa1!";
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { name: ownerName, role: "business_owner" },
      });
      if (error) throw error;
      user = data.user;
    } else if (action === "update" && password && user) {
      const { data, error } = await admin.auth.admin.updateUserById(user.id, { password });
      if (error) throw error;
      user = data.user;
    } else if (action === "create" && !user && !generatedPassword) {
      return json({ error: "Could not create authentication user" }, 500);
    }

    if (!user) {
      user = await findUserByEmail(admin, email);
    }
    if (!user) return json({ error: "Authentication user could not be resolved" }, 500);

    const services = Array.isArray(body.services) ? body.services.filter((item: unknown) => typeof item === "string") : [];
    const reviewLink = cleanText(body.googleReviewUrl || body.google_review_link || body.googleReviewLink);
    const status = cleanText(body.status) || "active";
    const subscriptionStatus = status === "inactive" ? "canceled" : status === "trial" ? "trialing" : "active";
    const businessPayload = {
      id: businessId || `biz-${crypto.randomUUID().slice(0, 8)}`,
      user_id: user.id,
      name: businessName,
      category: cleanText(body.category) || "other",
      services,
      email,
      phone: cleanText(body.phone),
      google_review_link: reviewLink || null,
      google_review_url: reviewLink || null,
      logo_url: cleanText(body.logoUrl),
      tagline: cleanText(body.tagline),
      plan_id: planId,
      status,
      subscription_status: subscriptionStatus,
      paid_until: body.paidUntil || null,
    };

    const { data: business, error: businessError } = await admin
      .from("businesses")
      .upsert(businessPayload, { onConflict: "id" })
      .select("*")
      .single();
    if (businessError) throw businessError;

    const { error: profileUpsertError } = await admin.from("profiles").upsert({
      id: user.id,
      email,
      full_name: ownerName,
      role: "business_owner",
      business_id: business.id,
    });
    if (profileUpsertError) throw profileUpsertError;

    const { error: subscriptionError } = await admin.from("subscriptions").upsert({
      id: `sub-${business.id}`,
      business_id: business.id,
      plan_id: planId,
      status: subscriptionStatus,
      billing_interval: cleanText(body.billingInterval) || "monthly",
      amount: PRICE_MAP[planId],
      current_period_end: body.paidUntil || undefined,
    }, { onConflict: "business_id" });
    if (subscriptionError) throw subscriptionError;

    return json({
      success: true,
      action,
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        category: business.category,
        planId: business.plan_id,
        status: business.status,
        subscriptionStatus: business.subscription_status,
      },
      credentials: {
        email,
        temporaryPassword: generatedPassword || null,
      },
    });
  } catch (error) {
    console.error("admin-manage-client error:", error);
    return json({ error: error instanceof Error ? error.message : "Admin client operation failed" }, 500);
  }
});
