import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, x-custom-auth, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Open Finance Connect Start
 * 
 * Versão SPRINT-V15:
 * - Melhor tratamento para Erros 5xx da Belvo (Infraestrutura/Gateway).
 * - Payload refinado com Basic Auth.
 */
Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

    try {
        const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const jwt = authHeader.replace(/^Bearer\s+/i, "");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // 1. Auth Supabase
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { Authorization: `Bearer ${jwt}`, apikey: supabaseAnonKey },
        });
        if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        const user = await userRes.json();

        // 2. Criar Link ID no Banco
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: link, error: insertError } = await supabaseAdmin
            .from("openfinance_links")
            .insert({ user_id: user.id, status: "pending", provider: "belvo" })
            .select().single();
        if (insertError) throw new Error(`DB Error: ${insertError.message}`);

        // 3. Belvo API
        const belvoSecretId = Deno.env.get("BELVO_SECRET_ID");
        const belvoSecretPassword = Deno.env.get("BELVO_SECRET_PASSWORD");
        const belvoBaseUrl = (Deno.env.get("BELVO_BASE_URL") || "https://sandbox.belvo.com").replace(/\/+$/, "");
        const basic = btoa(`${belvoSecretId}:${belvoSecretPassword}`);

        const tokenPayload = {
            id: belvoSecretId,
            password: belvoSecretPassword,
            scopes: "read_institutions,read_links,write_links,read_accounts,read_transactions",
            openfinance_feature: "consent_link_creation"
        };

        console.log("Requesting Belvo SPRINT-V15...");
        const res = await fetch(`${belvoBaseUrl}/api/token/`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${basic}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tokenPayload),
        });

        if (!res.ok) {
            const rawError = await res.text();
            console.error(`Belvo Error SPRINT-V15 [${res.status}]:`, rawError);

            // Se for 502/503/504, é problema de infra na Belvo
            if (res.status >= 500) {
                return new Response(
                    JSON.stringify({
                        error: "Belvo Infrastructure Issue",
                        message: "A Belvo está temporariamente instável (Erro 502/503). Por favor, aguarde alguns minutos e tente novamente.",
                        code: res.status
                    }),
                    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            let belvoDetails = rawError;
            try { belvoDetails = JSON.parse(rawError); } catch (e) { }

            return new Response(
                JSON.stringify({
                    error: "Belvo Rejection",
                    code: res.status,
                    details: belvoDetails
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await res.json();
        const connect_url = `https://widget.belvo.io/?access_token=${data.access}&locale=pt&country_codes=BR&external_id=${link.id}`;

        return new Response(
            JSON.stringify({ link_id: link.id, connect_url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Fatal Error SPRINT-V15:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
