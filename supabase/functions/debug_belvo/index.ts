import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, x-custom-auth, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

    try {
        const belvoSecretId = Deno.env.get("BELVO_SECRET_ID");
        const belvoSecretPassword = Deno.env.get("BELVO_SECRET_PASSWORD");
        const belvoBaseUrl = (Deno.env.get("BELVO_BASE_URL") || "https://sandbox.belvo.com").replace(/\/+$/, "");

        // 1. Obter Token (Com feature)
        const tokenPayload = {
            id: belvoSecretId,
            password: belvoSecretPassword,
            scopes: "read_institutions,read_links,write_links,read_consents,write_consents",
            openfinance_feature: "consent_link_creation"
        };

        const tokenRes = await fetch(`${belvoBaseUrl}/api/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tokenPayload),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access;

        // 2. Tentar Criar Consentimento (Gringotts)
        const consentPayload = {
            institution: "gringotts_br_retail",
            scopes: ["accounts", "transactions"]
        };

        const consentRes = await fetch(`${belvoBaseUrl}/api/consents/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(consentPayload),
        });

        const bodyText = await consentRes.text();
        let bodyJson = bodyText;
        try { bodyJson = JSON.parse(bodyText); } catch (e) { }

        return new Response(JSON.stringify({
            TEST: "GRINGOTTS_SIMULATION",
            status: consentRes.status,
            response: bodyJson
        }, null, 2), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
