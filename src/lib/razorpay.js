/**
 * Razorpay Frontend Helper
 * Loads the Razorpay checkout script and exposes payment utilities.
 */

import { supabase } from "./supabase";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

/** Dynamically loads the Razorpay checkout.js script (idempotent). */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

/**
 * Full Razorpay payment flow:
 * 1. Calls Supabase Edge Function to create a Razorpay Order
 * 2. Opens the Razorpay Checkout popup
 * 3. On success calls verify-razorpay-payment Edge Function
 * 4. Returns verified payment details or throws on failure
 */
export async function initiateRazorpayCheckout({
  businessId,
  planId,
  billingInterval,
  customerName,
  customerEmail,
  customerPhone = "",
  planDisplayName,
  amountInr,
}) {
  await loadRazorpayScript();

  // Create order via Supabase Edge Function
  const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
    "create-razorpay-order",
    {
      body: { businessId, planId, billingInterval, customerName, customerEmail, customerPhone },
    }
  );

  if (sessionError || !sessionData?.orderId) {
    throw new Error(sessionError?.message || "Failed to create payment order. Please try again.");
  }

  // Open Razorpay Checkout popup
  return new Promise((resolve, reject) => {
    const options = {
      key: RAZORPAY_KEY_ID || sessionData.keyId,
      amount: sessionData.amount,
      currency: sessionData.currency || "INR",
      name: "ReviewAssist",
      description: `${planDisplayName} Plan — ${billingInterval === "annual" ? "Annual" : "Monthly"}`,
      image: `${window.location.origin}/favicon.ico`,
      order_id: sessionData.orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: {
        business_id: businessId,
        plan_id: planId,
        billing_interval: billingInterval,
      },
      theme: { color: "#7c3aed" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled by user")),
      },
      handler: async (response) => {
        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                businessId,
                planId,
                billingInterval,
              },
            }
          );
          if (verifyError || !verifyData?.success) {
            reject(new Error(verifyError?.message || "Payment verification failed"));
            return;
          }
          resolve({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            planId,
            billingInterval,
            periodEnd: verifyData.periodEnd,
            amountInr,
          });
        } catch (err) {
          reject(err);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

/** Format INR currency for display */
export function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
