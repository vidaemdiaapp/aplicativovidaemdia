import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Open Finance Connect Start
 * Inicia o fluxo de conexão bancária via Belvo
 * 
 * POST /openfinance_connect_start
 * Auth: JWT do usuário
 * Response: { link_id, connect_url }
 */
Deno.serve(async (req) => {
    // DEBUG LOG: Request received
    console.log("openfinance_connect_start: request received", {
        method: req.method,
        url: req.url,
        hasAuth: !!req.headers.get("authorization"),
        authPrefix: req.headers.get("authorization")?.slice(0, 20) ?? null,
        origin: req.headers.get("origin"),
    });

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Validate JWT
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("openfinance_connect_start: error - Missing authorization header");
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Create client with user's JWT
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            console.error("Auth error:", authError);
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`User ${user.id} initiating Open Finance connection`);

        // 2. Create pending link in DB using service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: link, error: insertError } = await supabaseAdmin
            .from("openfinance_links")
            .insert({
                user_id: user.id,
                status: "pending",
                provider: "belvo"
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            throw new Error(`Failed to create link: ${insertError.message}`);
        }

        console.log(`Created link ${link.id} for user ${user.id}`);

        // 3. Get Belvo credentials
        const belvoSecretId = Deno.env.get("BELVO_SECRET_ID");
        const belvoSecretPassword = Deno.env.get("BELVO_SECRET_PASSWORD");
        const belvoBaseUrl = Deno.env.get("BELVO_BASE_URL") || "https://sandbox.belvo.com";

        if (!belvoSecretId || !belvoSecretPassword) {
            throw new Error("Belvo credentials not configured");
        }

        // 4. Get Belvo access token for widget
        const tokenResponse = await fetch(`${belvoBaseUrl}/api/token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: belvoSecretId,
                password: belvoSecretPassword,
                scopes: "read_institutions,write_links,read_links,read_accounts,read_transactions",
                widget: {
                    branding: {
                        company_name: "Vida em Dia",
                    },
                    callback_urls: {
                        success: `${supabaseUrl}/functions/v1/openfinance_webhook`,
                        exit: `${supabaseUrl}/functions/v1/openfinance_webhook`,
                    },
                },
                link_token_data: {
                    external_id: link.id, // Nossa referência interna
                },
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Belvo token error:", errorText);
            throw new Error(`Failed to get Belvo access token: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access;

        // 5. Build Connect URL using the access token
        const connectUrl = `${belvoBaseUrl}/connect/?access_token=${accessToken}`;

        console.log(`Connect URL generated for link ${link.id}`);

        return new Response(
            JSON.stringify({
                link_id: link.id,
                connect_url: connectUrl,
                access_token: accessToken, // Para uso no widget embutido
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error in openfinance_connect_start:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
