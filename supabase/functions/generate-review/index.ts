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
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse JSON request body
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

    // 2. Query businesses table using businessId to fetch name and category
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("name, category")
      .eq("id", businessId.trim())
      .maybeSingle();

    if (bizError) {
      console.error("Database query error:", bizError);
      return new Response(
        JSON.stringify({ error: `Database error querying business: ${bizError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!business) {
      return new Response(
        JSON.stringify({ error: `Business with ID "${businessId}" not found.` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { name, category } = business;

    // 3. Build the prompt string
    const improvedSection =
      whatCouldImprove && typeof whatCouldImprove === "string" && whatCouldImprove.trim()
        ? whatCouldImprove.trim()
        : "nothing mentioned";

    const effectiveService =
      serviceType && typeof serviceType === "string" && serviceType.trim()
        ? serviceType.trim()
        : "service";

    const prompt = `Write a natural, first-person Google review (2-4 sentences) for a ${category || "local"} business called "${name}".
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
            "GEMINI_API_KEY is not configured in Supabase Edge Function secrets. Please set it using: supabase secrets set GEMINI_API_KEY=your_key",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Call Gemini API using gemini-2.5-flash-lite
    const geminiEndpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

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
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Gemini API call failed with status ${geminiResponse.status}: ${errorText}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();

    // 6. Extract the generated text from data.candidates[0].content.parts[0].text
    const draftText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!draftText) {
      return new Response(
        JSON.stringify({
          error: "Failed to extract text from Gemini response structure.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 7. Return { draftText } as JSON
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
