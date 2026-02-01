import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncResult {
    link_id: string;
    accounts: number;
    transactions: number;
    error: string | null;
}

/**
 * Open Finance Sync
 * Sincroniza contas e transações de um ou todos os links conectados
 * 
 * POST /openfinance_sync
 * Auth: Service Role only
 * Body: { link_id?: string } (opcional, se não informado sincroniza todos)
 */
Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!authHeader?.includes(serviceRoleKey)) {
        console.error("Unauthorized sync attempt");
        return new Response(
            JSON.stringify({ error: "Unauthorized - service role required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json().catch(() => ({}));
        const specificLinkId = body.link_id as string | undefined;

        console.log(`Starting sync${specificLinkId ? ` for link ${specificLinkId}` : " for all links"}`);

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Fetch links to sync
        let query = supabase
            .from("openfinance_links")
            .select("*")
            .eq("status", "connected");

        if (specificLinkId) {
            query = query.eq("id", specificLinkId);
        }

        const { data: links, error: linksError } = await query;

        if (linksError) {
            throw new Error(`Failed to fetch links: ${linksError.message}`);
        }

        if (!links || links.length === 0) {
            console.log("No connected links to sync");
            return new Response(
                JSON.stringify({ synced: [], message: "No connected links found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Found ${links.length} link(s) to sync`);

        // Belvo credentials
        const belvoSecretId = Deno.env.get("BELVO_SECRET_ID")!;
        const belvoSecretPassword = Deno.env.get("BELVO_SECRET_PASSWORD")!;
        const belvoBaseUrl = Deno.env.get("BELVO_BASE_URL") || "https://sandbox.belvo.com";
        const authBase64 = btoa(`${belvoSecretId}:${belvoSecretPassword}`);

        const results: SyncResult[] = [];

        for (const link of links) {
            if (!link.provider_link_id) {
                console.log(`Skipping link ${link.id} - no provider_link_id`);
                continue;
            }

            const result = await syncLink(
                supabase,
                link,
                belvoBaseUrl,
                authBase64
            );
            results.push(result);
        }

        console.log(`Sync completed: ${results.length} link(s) processed`);

        return new Response(
            JSON.stringify({ synced: results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Sync error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

async function syncLink(
    supabase: SupabaseClient,
    link: Record<string, unknown>,
    belvoBaseUrl: string,
    authBase64: string
): Promise<SyncResult> {
    const linkId = link.id as string;
    const providerLinkId = link.provider_link_id as string;

    console.log(`Syncing link ${linkId} (provider: ${providerLinkId})`);

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
        .from("openfinance_sync_logs")
        .insert({
            link_id: linkId,
            status: "running",
        })
        .select()
        .single();

    if (logError) {
        console.error("Failed to create sync log:", logError);
    }

    let accountsFetched = 0;
    let transactionsFetched = 0;
    let syncError: string | null = null;

    try {
        // Fetch accounts from Belvo
        const accountsRes = await fetch(
            `${belvoBaseUrl}/api/accounts/?link=${providerLinkId}`,
            {
                headers: { Authorization: `Basic ${authBase64}` },
            }
        );

        if (!accountsRes.ok) {
            const errorText = await accountsRes.text();
            throw new Error(`Failed to fetch accounts: ${errorText}`);
        }

        const accountsData = await accountsRes.json();
        const accounts = accountsData.results || accountsData || [];
        accountsFetched = accounts.length;

        console.log(`Fetched ${accountsFetched} accounts for link ${linkId}`);

        // Upsert accounts
        for (const acc of accounts) {
            const { data: upsertedAccount, error: accError } = await supabase
                .from("openfinance_accounts")
                .upsert(
                    {
                        link_id: linkId,
                        provider_account_id: acc.id,
                        name: acc.name,
                        type: acc.type,
                        subtype: acc.subtype,
                        currency: acc.currency || "BRL",
                        balance_current: acc.balance?.current ?? acc.balance_current,
                        balance_available: acc.balance?.available ?? acc.balance_available,
                        last_balance_at: new Date().toISOString(),
                        raw: acc,
                    },
                    { onConflict: "link_id,provider_account_id" }
                )
                .select()
                .single();

            if (accError) {
                console.error(`Failed to upsert account ${acc.id}:`, accError);
                continue;
            }

            if (!upsertedAccount) continue;

            // Fetch transactions for this account (paginated)
            let nextPage: string | null =
                `${belvoBaseUrl}/api/transactions/?link=${providerLinkId}&account=${acc.id}`;

            while (nextPage) {
                const txRes = await fetch(nextPage, {
                    headers: { Authorization: `Basic ${authBase64}` },
                });

                if (!txRes.ok) {
                    console.error(`Failed to fetch transactions for account ${acc.id}`);
                    break;
                }

                const txData = await txRes.json();
                const transactions = txData.results || txData || [];
                transactionsFetched += transactions.length;

                // Upsert transactions
                for (const tx of transactions) {
                    const { error: txError } = await supabase
                        .from("openfinance_transactions")
                        .upsert(
                            {
                                account_id: upsertedAccount.id,
                                provider_transaction_id: tx.id,
                                amount: tx.amount,
                                type: tx.type,
                                status: tx.status,
                                category: tx.category,
                                description: tx.description,
                                merchant_name: tx.merchant?.name,
                                transaction_date: tx.value_date || tx.accounting_date,
                                raw: tx,
                            },
                            { onConflict: "account_id,provider_transaction_id" }
                        );

                    if (txError) {
                        console.error(`Failed to upsert transaction ${tx.id}:`, txError);
                    }
                }

                // Next page
                nextPage = txData.next || null;
            }
        }

        // Update last_synced_at
        await supabase
            .from("openfinance_links")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("id", linkId);

        console.log(`Synced link ${linkId}: ${accountsFetched} accounts, ${transactionsFetched} transactions`);

    } catch (err) {
        syncError = err.message;
        console.error(`Sync error for link ${linkId}:`, err);
    }

    // Complete sync log
    if (syncLog) {
        await supabase
            .from("openfinance_sync_logs")
            .update({
                status: syncError ? "error" : "success",
                finished_at: new Date().toISOString(),
                accounts_fetched: accountsFetched,
                transactions_fetched: transactionsFetched,
                error_message: syncError,
            })
            .eq("id", syncLog.id);
    }

    return {
        link_id: linkId,
        accounts: accountsFetched,
        transactions: transactionsFetched,
        error: syncError,
    };
}
