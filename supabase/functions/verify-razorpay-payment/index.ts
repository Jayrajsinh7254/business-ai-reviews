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
  return generatedSignature === signature;
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

    // Payment verified — activate subscription in Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const AMOUNT_MAP: Record<string, Record<string, number>> = {
      starter: { monthly: 499, annual: 399 },
      pro: { monthly: 1299, annual: 999 },
      enterprise: { monthly: 2999, annual: 2399 },
    };

    const amount = AMOUNT_MAP[planId]?.[billingInterval] || 1299;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + (billingInterval === "annual" ? 365 : 30));

    // Update or insert subscription record
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          business_id: businessId,
          plan_id: planId,
          status: "active",
          billing_interval: billingInterval,
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
    }

    // Update business plan status
    await supabase
      .from("businesses")
      .update({ plan_id: planId, subscription_status: "active" })
      .eq("id", businessId);

    // Log payment event
    await supabase.from("payment_events").insert({
      business_id: businessId,
      event_type: "payment.captured",
      razorpay_order_id,
      razorpay_payment_id,
      amount_paise: amount * 100,
      currency: "INR",
      plan_id: planId,
      billing_interval: billingInterval,
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
