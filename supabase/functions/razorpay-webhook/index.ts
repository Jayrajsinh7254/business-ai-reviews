// supabase/functions/razorpay-webhook/index.ts
// Handles Razorpay webhook events for subscription lifecycle management

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const generated = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return generated === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

    if (WEBHOOK_SECRET) {
      const isValid = await verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = JSON.parse(rawBody);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = event.payload?.payment?.entity || event.payload?.subscription?.entity || {};
    const businessId = payload.notes?.business_id || event.payload?.payment?.entity?.notes?.business_id;

    // Log every webhook event
    await supabase.from("payment_events").insert({
      business_id: businessId || "unknown",
      event_type: event.event,
      razorpay_order_id: payload.order_id || null,
      razorpay_payment_id: payload.id || null,
      amount_paise: payload.amount || 0,
      currency: payload.currency || "INR",
      plan_id: payload.notes?.plan_id || null,
      billing_interval: payload.notes?.billing_interval || null,
      status: payload.status || "unknown",
      raw_payload: event,
    });

    if (!businessId) {
      console.warn("Webhook received without business_id in notes:", event.event);
      return new Response(JSON.stringify({ received: true, warning: "No business_id in notes" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle specific events
    switch (event.event) {
      case "payment.captured": {
        const planId = payload.notes?.plan_id;
        const billingInterval = payload.notes?.billing_interval || "monthly";
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + (billingInterval === "annual" ? 365 : 30));

        await supabase.from("subscriptions").upsert(
          {
            business_id: businessId,
            plan_id: planId,
            status: "active",
            billing_interval: billingInterval,
            amount: Math.round(payload.amount / 100),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            razorpay_order_id: payload.order_id,
            razorpay_payment_id: payload.id,
          },
          { onConflict: "business_id" }
        );

        await supabase
          .from("businesses")
          .update({ plan_id: planId, subscription_status: "active" })
          .eq("id", businessId);
        break;
      }

      case "payment.failed": {
        await supabase
          .from("businesses")
          .update({ subscription_status: "past_due" })
          .eq("id", businessId);
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
        await supabase.from("subscriptions").update({ status: "canceled" }).eq("business_id", businessId);
        await supabase
          .from("businesses")
          .update({ subscription_status: "canceled" })\
          .eq("id", businessId);
        break;
      }

      default:
        console.log("Unhandled event type:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("razorpay-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
