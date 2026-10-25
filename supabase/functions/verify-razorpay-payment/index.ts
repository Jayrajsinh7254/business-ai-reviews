// supabase/functions/verify-razorpay-payment/index.ts
// Verifies Razorpay payment signature and activates subscription in DB

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(generatedSignature, signature);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      planId,
      billingInterval,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment verification fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Server configuration error: missing secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Payment verification failed. Invalid signature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Replay Protection: Check if this payment proof was already consumed
    const { data: existingPayment } = await supabase
      .from("payment_events")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .eq("status", "captured")
      .maybeSingle();

    if (existingPayment) {
      return new Response(JSON.stringify({ error: "Payment proof has already been processed and consumed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Binding check: Load original server-side order to verify target business and plan
    const { data: orderEvent } = await supabase
      .from("payment_events")
      .select("business_id, plan_id, billing_interval, amount_paise")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("event_type", "order.created")
      .maybeSingle();

    if (orderEvent && orderEvent.business_id && orderEvent.business_id !== businessId) {
      return new Response(JSON.stringify({ error: "Payment order does not match target business" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetBusinessId = orderEvent?.business_id || businessId;
    const targetPlanId = orderEvent?.plan_id || planId;
    const targetBillingInterval = orderEvent?.billing_interval || billingInterval || "monthly";

    const AMOUNT_MAP: Record<string, Record<string, number>> = {
      starter: { monthly: 299, annual: 2988 },
      pro: { monthly: 499, annual: 5388 },
      enterprise: { monthly: 799, annual: 8388 },
    };

    const amount = (orderEvent?.amount_paise ? Math.round(orderEvent.amount_paise / 100) : null) ||
      AMOUNT_MAP[targetPlanId]?.[targetBillingInterval] || 499;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + (targetBillingInterval === "annual" ? 365 : 30));

    // Update or insert subscription record
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          business_id: targetBusinessId,
          plan_id: targetPlanId,
          status: "active",
          billing_interval: targetBillingInterval,
          amount,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          razorpay_order_id,
          razorpay_payment_id,
        },
        { onConflict: "business_id" }
      );

    if (subError) {
      console.error("Subscription upsert error:", subError);
      return new Response(JSON.stringify({ error: "Failed to activate subscription in database" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update business plan status
    await supabase
      .from("businesses")
      .update({ plan_id: targetPlanId, subscription_status: "active" })
      .eq("id", targetBusinessId);

    // Log payment event atomically
    await supabase.from("payment_events").insert({
      business_id: targetBusinessId,
      event_type: "payment.captured",
      razorpay_order_id,
      razorpay_payment_id,
      amount_paise: amount * 100,
      currency: "INR",
      plan_id: targetPlanId,
      billing_interval: targetBillingInterval,
      status: "captured",
      raw_payload: { razorpay_order_id, razorpay_payment_id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified. Subscription activated.",
        planId,
        billingInterval,
        periodEnd: periodEnd.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("verify-razorpay-payment error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
