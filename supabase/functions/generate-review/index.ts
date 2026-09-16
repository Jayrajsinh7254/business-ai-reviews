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

    // 3. Define natural human sentiment tone guidance
    let sentimentGuidance = "";
    if (starRating === 5) {
      sentimentGuidance =
        "5-STAR (Genuinely Delighted / High Praise): Write a happy, relaxed, authentic 5-star review. Highlight the specific positives mentioned in simple everyday words. Include natural enthusiasm (e.g., 'Super happy with the work', 'Fair prices and really honest people', 'Definitely coming back next time').";
    } else if (starRating === 4) {
      sentimentGuidance =
        "4-STAR (Good / Solid Experience): Write a positive, grounded review giving a solid thumbs up. Mention what was done well, and if any minor hiccup was noted, mention it casually without sounding angry (e.g., 'Solid service and nice staff. Had to wait a few extra minutes, but overall very happy with the result').";
    } else if (starRating === 3) {
      sentimentGuidance =
        "3-STAR (Average / Middle of the Road): Write an honest, balanced review. Acknowledge what was okay, but plainly mention where it felt underwhelming or slow (e.g., 'Decent job on the service, but communication could be a lot better').";
    } else if (starRating === 2) {
      sentimentGuidance =
        "2-STAR (Disappointed / Unhappy): Write a disappointed, frank review pointing out the specific issues faced. Sound like a real customer who felt let down (e.g., 'Pretty disappointed with my visit. Took way longer than promised and staff wasn't very helpful').";
    } else {
      // 1 Star
      sentimentGuidance =
        "1-STAR (Frustrated / Strongly Critical): Write a blunt, direct 1-star review warning others. Detail what went wrong in plain, realistic words without sounding robotic or melodramatic (e.g., 'Terrible experience. Terrible customer service, overcharged, and they didn't even resolve the issue. Avoid this place').";
    }

    const improvedSection =
      whatCouldImprove && typeof whatCouldImprove === "string" && whatCouldImprove.trim()
        ? whatCouldImprove.trim()
        : "nothing mentioned";

    const effectiveService =
      serviceType && typeof serviceType === "string" && serviceType.trim()
        ? serviceType.trim()
        : "service";

    const prompt = `You are a real human customer writing a genuine Google Maps review on your phone.
Your goal is to turn the customer's raw notes (which may be in Hindi, Hinglish, Spanish, slang, or rough bullet points) into a completely NATURAL, AUTHENTIC review in fluent everyday English.

Business Name: "${bizName}"
Business Category: "${bizCategory}"
Service Received: "${effectiveService}"
Selected Star Rating: ${starRating} Stars
Rating Tone Goal: ${sentimentGuidance}
Customer Notes (What Stood Out): "${whatStoodOut.trim()}"
Customer Notes (Feedback / Issues): "${improvedSection}"

CRITICAL ANTI-AI & HUMAN WRITING RULES:
1. NEVER use AI cliches or robotic PR buzzwords:
   - FORBIDDEN: "I recently had the pleasure of", "testament to", "nestled in", "plethora", "wholeheartedly recommend", "delve into", "tapestry", "seamless experience", "exceptional customer service", "top-notch establishment", "gem of a place", "culinary journey", "second to none", "without a shadow of a doubt", "in conclusion", "furthermore".
2. SOUND LIKE A REAL PERSON typing a review on Google Maps:
   - Use natural sentence structures that real people use (e.g. "Brought my car in for...", "Got my brakes done here...", "Stopped by for...", "Super quick and honest...", "The team was really friendly and helpful...").
   - Vary your opening sentence naturally. Do not always start with "I visited [Business]".
3. TRANSLATE AUTHENTICALLY:
   - If the customer provided notes in Hindi, Hinglish, Spanish, Gujarati, slang, or rough notes, translate their core real-world meaning into natural conversational English as if a native speaker wrote it.
4. LENGTH: Keep it between 2 to 4 concise, punchy sentences (around 30 to 65 words). Real Google reviews are concise and to the point.
5. NO QUOTES OR LABELS: Output ONLY the finalized review text. Do NOT wrap in quotes or add titles or headers.`;

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
