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

    const { businessId, serviceType, whatStoodOut, whatCouldImprove } = body || {};

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

    // 3. Build the prompt string
    const improvedSection =
      whatCouldImprove && typeof whatCouldImprove === "string" && whatCouldImprove.trim()
        ? whatCouldImprove.trim()
        : "nothing mentioned";

    const effectiveService =
      serviceType && typeof serviceType === "string" && serviceType.trim()
        ? serviceType.trim()
        : "service";

    const prompt = `Write a natural, first-person Google review (2-4 sentences) for a ${bizCategory} business called "${bizName}".
The customer got "${effectiveService}" done.
What they liked: "${whatStoodOut.trim()}".
What could be better: "${improvedSection}".
Keep it sounding like a real person wrote it — not overly polished, not generic, no marketing language.
Do not invent details that weren't mentioned above.`;

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
          continue; // Try next model in list
        }

        const geminiData = await geminiResponse.json();
        const extracted =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (extracted) {
          draftText = extracted;
          break; // Successfully got review draft
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
