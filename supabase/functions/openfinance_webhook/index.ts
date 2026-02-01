import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-belvo-signature",
};

/**
 * Verify Belvo webhook signature using HMAC-SHA256
 */
async function verifyBelvoSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
        const computedSignature = Array.from(new Uint8Array(signed))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return computedSignature === signature;
    } catch (err) {
        console.error("Signature verification error:", err);
        return false;
    }
}

/**
 * Open Finance Webhook Handler
 * Recebe eventos do Belvo (link_created, new_accounts_available, etc.)
 * 
 * POST /openfinance_webhook
 * Auth: x-belvo-signature header (HMAC)
 */
Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.text();
        const signature = req.headers.get("x-belvo-signature");
        const webhookSecret = Deno.env.get("BELVO_WEBHOOK_SECRET");

        // Verify HMAC signature if secret is configured
        if (webhookSecret && signature) {
            const isValid = await verifyBelvoSignature(body, signature, webhookSecret);
            if (!isValid) {
                console.error("Invalid webhook signature");
                return new Response(
                    JSON.stringify({ error: "Invalid signature" }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            console.log("Webhook signature verified");
        } else {
            console.log("Webhook signature verification skipped (no secret configured)");
        }

        const payload = JSON.parse(body);
        console.log("Webhook received:", JSON.stringify(payload, null, 2));

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Extract event data
        const eventType = payload.event_type || payload.webhook_type;
        const data = payload.data || payload;

        // Try to get link_id from various places in the payload
        const linkId = data?.external_id || data?.link_token_data?.external_id;
        const providerLinkId = data?.link || data?.id || data?.link_id;

        console.log(`Event: ${eventType}, Link ID: ${linkId}, Provider Link: ${providerLinkId}`);

        if (!linkId) {
            console.log("No internal link_id found in webhook payload, attempting provider lookup");

            // Try to find by provider_link_id if we have it
            if (providerLinkId) {
                const { data: existingLink } = await supabase
                    .from("openfinance_links")
                    .select("id")
                    .eq("provider_link_id", providerLinkId)
                    .single();

                if (existingLink) {
                    // Process with found link
                    await processWebhookEvent(supabase, eventType, existingLink.id, providerLinkId, data);
                }
            }

            return new Response(
                JSON.stringify({ received: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        await processWebhookEvent(supabase, eventType, linkId, providerLinkId, data);

        return new Response(
            JSON.stringify({ received: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

async function processWebhookEvent(
    supabase: ReturnType<typeof createClient>,
    eventType: string,
    linkId: string,
    providerLinkId: string | null,
    data: Record<string, unknown>
) {
    let newStatus: string | null = null;
    let errorMessage: string | null = null;

    // Map Belvo events to our status
    switch (eventType) {
        case "link_created":
        case "historical_update":
        case "link.created":
            newStatus = "connected";
            break;

        case "link_error":
        case "invalid_credentials":
        case "link.error":
            newStatus = "error";
            errorMessage = (data?.message as string) || "Connection error";
            break;

        case "consent_expired":
        case "link_revoked":
        case "consent.expired":
        case "link.revoked":
            newStatus = "revoked";
            break;

        case "new_accounts_available":
        case "new_transactions_available":
        case "accounts.available":
        case "transactions.available":
            // Trigger sync for new data
            console.log(`Triggering sync for link ${linkId}`);
            try {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/openfinance_sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                    body: JSON.stringify({ link_id: linkId }),
                });
            } catch (syncError) {
                console.error("Failed to trigger sync:", syncError);
            }
            break;

        default:
            console.log(`Unhandled event type: ${eventType}`);
    }

    // Update link status if changed
    if (newStatus) {
        const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        if (providerLinkId) {
            updateData.provider_link_id = providerLinkId;
        }

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        const { error: updateError } = await supabase
            .from("openfinance_links")
            .update(updateData)
            .eq("id", linkId);

        if (updateError) {
            console.error("Failed to update link status:", updateError);
        } else {
            console.log(`Updated link ${linkId} status to ${newStatus}`);
        }
    }
}
