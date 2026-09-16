import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body provided." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { businessId, serviceType, whatStoodOut, whatCouldImprove, rating } =
      body || {};

    // 1. Basic input validation
    if (!businessId || typeof businessId !== "string" || !businessId.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required field: businessId is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!whatStoodOut || typeof whatStoodOut !== "string" || !whatStoodOut.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required field: whatStoodOut is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine star rating (1 to 5)
    const starRating =
      typeof rating === "number" && rating >= 1 && rating <= 5
        ? Math.round(rating)
        : 5;

    // 2. Query businesses table using businessId
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      "";

    let bizName = "Local Business";
    let bizCategory = "service";

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: business } = await supabase
          .from("businesses")
          .select("name, category")
          .eq("id", businessId.trim())
          .maybeSingle();

        if (business) {
          bizName = business.name || bizName;
          bizCategory = business.category || bizCategory;
        }
      } catch (dbErr) {
        console.warn("Database lookup warning:", dbErr);
      }
    }

    // Fallback defaults for demo IDs
    if (bizName === "Local Business") {
      if (businessId === "demo-1") {
        bizName = "Apex Auto Care & Diagnostics";
        bizCategory = "automobile";
      } else if (businessId === "demo-2") {
        bizName = "Lumina Skin & Hair Studio";
        bizCategory = "salon";
      }
    }

    // 3. Define sentiment guidance based on star rating
    let sentimentGuidance = "";
    if (starRating === 5) {
      sentimentGuidance =
        "5-STAR (EXCELLENT): The review must be overwhelmingly positive, highly enthusiastic, and recommend the business wholeheartedly. Express supreme satisfaction and highlight what stood out as exceptional.";
    } else if (starRating === 4) {
      sentimentGuidance =
        "4-STAR (VERY GOOD): The review should be mostly positive and happy with the service, praising what stood out, but with a slight, polite mention of any minor detail that could be improved.";
    } else if (starRating === 3) {
      sentimentGuidance =
        "3-STAR (AVERAGE / MIXED): The review must be balanced and neutral. Acknowledge what was okay, but clearly mention shortcomings or areas that were underwhelming.";
    } else if (starRating === 2) {
      sentimentGuidance =
        "2-STAR (DISSATISFIED / DISAPPOINTED): The review must express clear dissatisfaction and disappointment. Politely but firmly point out what went wrong and how expectations were not met.";
    } else {
      // 1 Star
      sentimentGuidance =
        "1-STAR (VERY POOR / HIGHLY CRITICAL): The review must be strongly critical, expressing serious frustration and dissatisfaction with bad service, issues encountered, or unprofessionalism.";
    }

    const improvedSection =
      whatCouldImprove && typeof whatCouldImprove === "string" && whatCouldImprove.trim()
        ? whatCouldImprove.trim()
        : "nothing mentioned";

    const effectiveService =
      serviceType && typeof serviceType === "string" && serviceType.trim()
        ? serviceType.trim()
        : "service";

    const prompt = `You are an expert AI review ghostwriter. Transform the customer's raw notes into an authentic, realistic ${starRating}-star Google review written in fluent, grammatically flawless English.

Business Name: "${bizName}"
Business Category: "${bizCategory}"
Service Received: "${effectiveService}"
Selected Star Rating: ${starRating} out of 5 stars
Tone & Sentiment Requirement: ${sentimentGuidance}
Customer's Experience Notes (What Stood Out): "${whatStoodOut.trim()}"
Customer's Feedback on Issues / Improvement: "${improvedSection}"

Instructions:
1. The tone, emotion, and wording MUST directly reflect a ${starRating}-star review as defined in the sentiment requirement.
2. Always write the review in clear, fluent, natural English (even if the customer provided notes in Hindi, Hinglish, Spanish, French, Gujarati, or rough informal slang).
3. Write from a first-person customer perspective ("I visited...", "I had...").
4. Keep the review authentic, engaging, and 2 to 4 sentences long.
5. Output ONLY the finalized review text. Do NOT include quotation marks, titles, or introductory text like "Here is your review:".`;

    // 4. Retrieve GEMINI_API_KEY from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY is not configured in Supabase Edge Function secrets. Please add it under Project Settings -> Edge Functions -> Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Call Gemini API (with automatic fallback to supported models)
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
    ];

    let draftText = "";
    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const geminiResponse = await fetch(geminiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errBody = await geminiResponse.text();
          let parsed;
          try {
            parsed = JSON.parse(errBody);
          } catch {
            parsed = null;
          }
          lastErrorMsg = parsed?.error?.message || `Status ${geminiResponse.status}: ${errBody}`;
          console.warn(`Model ${model} returned error:`, lastErrorMsg);
          continue;
        }

        const geminiData = await geminiResponse.json();
        let extracted =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (extracted) {
          extracted = extracted.replace(/^["']|["']$/g, "").trim();
          draftText = extracted;
          break;
        }
      } catch (callErr) {
        lastErrorMsg = callErr instanceof Error ? callErr.message : String(callErr);
      }
    }

    if (!draftText) {
      return new Response(
        JSON.stringify({
          error: `Gemini API error: ${lastErrorMsg || "Failed to generate review draft."}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 6. Return { draftText } as JSON
    return new Response(JSON.stringify({ draftText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error in generate-review function:", message);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
