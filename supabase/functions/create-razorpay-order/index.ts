// supabase/functions/create-razorpay-order/index.ts
// Creates a Razorpay Order to initiate the payment checkout

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { businessId, planId, billingInterval, customerName, customerEmail, customerPhone } = body;

    if (!businessId || !planId || !billingInterval) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Razorpay credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pricing in paise (1 INR = 100 paise)
    const PRICE_MAP: Record<string, Record<string, number>> = {
      starter: { monthly: 49900, annual: 39900 },
      pro: { monthly: 129900, annual: 99900 },
      enterprise: { monthly: 299900, annual: 239900 },
    };

    const amount = PRICE_MAP[planId]?.[billingInterval];
    if (!amount) {
      return new Response(JSON.stringify({ error: "Invalid plan or billing interval" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const receiptId = `rcpt_${String(businessId).slice(0, 8)}_${Date.now()}`;

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: receiptId,
        notes: {
          business_id: businessId,
          plan_id: planId,
          billing_interval: billingInterval,
          customer_email: customerEmail || "",
          customer_name: customerName || "",
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errData = await razorpayRes.json();
      console.error("Razorpay order creation failed:", errData);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await razorpayRes.json();

    // Log to Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await supabase.from("payment_events").insert({
      business_id: businessId,
      event_type: "order.created",
      razorpay_order_id: order.id,
      amount_paise: amount,
      currency: "INR",
      plan_id: planId,
      billing_interval: billingInterval,
      status: "pending",
      raw_payload: order,
    });

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        planId,
        billingInterval,
        businessId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-razorpay-order error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
