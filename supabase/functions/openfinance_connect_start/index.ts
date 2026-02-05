import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Em produção, mude para seu domínio
    "Access-Control-Allow-Credentials": "false", // Com * tem que ser false. Se usar domínio específico, true.
    "Access-Control-Allow-Headers": "authorization, x-client-info, x-custom-auth, apikey, content-type, accept",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        version: "DEBUG-V4-BELVO-WIDGET-TOKEN",
        method: req.method,
        url: req.url,
        hasAuth: !!req.headers.get("authorization"),
        authPrefix: req.headers.get("authorization")?.slice(0, 20) ?? null,
    });

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        // 1. Validate JWT (robusto)
        const rawAuth =
            req.headers.get("authorization") ??
            req.headers.get("Authorization") ??
            req.headers.get("x-custom-auth");

        if (!rawAuth) {
            console.error("openfinance_connect_start: error - Missing authorization header");
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Normaliza o Bearer
        const authHeader = rawAuth.startsWith("Bearer ") ? rawAuth : `Bearer ${rawAuth}`;
        const jwt = authHeader.slice("Bearer ".length);

        // Verifica formato JWT antes de chamar
        if (!jwt.includes(".")) {
            console.error("Invalid JWT format (no dots)");
            return new Response(JSON.stringify({ error: "Invalid JWT format" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Chama GoTrue diretamente
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                apikey: supabaseAnonKey,
            },
        });

        if (!userRes.ok) {
            const txt = await userRes.text();
            console.error("auth/v1/user failed:", userRes.status, txt);
            return new Response(
                JSON.stringify({ error: "Unauthorized", details: txt }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const user = await userRes.json();
        console.log(`User ${user.id} initiating Open Finance connection`);

        // 2. Create pending link in DB
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

        // 4. Get Belvo Widget Access Token (OFDA spec)
        // Endpoint correto: /api/widget/token/
        const widgetTokenUrl = `${belvoBaseUrl}/api/widget/token/`;

        // Basic Auth para o request do token
        const basicAuth = btoa(`${belvoSecretId}:${belvoSecretPassword}`);

        console.log("Requesting Belvo Widget Token:", widgetTokenUrl);

        const tokenResponse = await fetch(widgetTokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${basicAuth}`,
            },
            body: JSON.stringify({
                external_id: link.id,
                locale: "pt",
                country_codes: ["BR"],
                fetch_resources: ["ACCOUNTS", "TRANSACTIONS"],
                scopes: [
                    "read_institutions",
                    "write_links",
                    "read_links",
                    "read_accounts",
                    "read_transactions",
                    // Adicione outros scopes se necessário para OFDA, mas este é um bom set inicial
                ],
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Belvo token failed:", {
                status: tokenResponse.status,
                body: errorText,
            });
            throw new Error(`Belvo Token Error: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access; // O token para o widget

        // 5. Build Connect URL
        // A URL do widget geralmente é https://widget.belvo.io/?access_token=...
        // Parâmetros adicionais devem estar encapsulados no token ou passados aqui se a doc exigir
        const connectUrl = `https://widget.belvo.io/?access_token=${accessToken}&external_id=${link.id}&locale=pt&country_codes=BR`;

        console.log(`Connect URL generated successfully`);

        return new Response(
            JSON.stringify({
                link_id: link.id,
                connect_url: connectUrl,
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
