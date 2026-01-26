import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface NotificationPayload {
    to: string[];
    title: string;
    body: string;
    data?: any;
}

Deno.serve(async (req) => {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
    );

    try {
        // 1. Find users where it's 09:00 AM (or whatever hour we choose)
        // For simplicity, we can run this hourly and check:
        // current_hour in user's timezone == 9
        const { data: profiles, error: profileError } = await supabaseClient
            .from("profiles")
            .select("id, timezone, active_household_id");

        if (profileError) throw profileError;

        const currentUtc = new Date();
        const targetHour = 9;

        for (const profile of profiles) {
            if (!profile.active_household_id) continue;

            // Check timezone (simple check for now)
            // In a real app, we'd use a library like luxon or just offset math
            // For now, let's assume we run this and check the local hour
            const userLocalTime = new Date(currentUtc.toLocaleString("en-US", { timeZone: profile.timezone || "UTC" }));
            if (userLocalTime.getHours() !== targetHour) continue;

            // 2. Compute Household Status
            const { data: statusData, error: statusError } = await supabaseClient
                .rpc("compute_household_status", { target_household_id: profile.active_household_id });

            if (statusError) {
                console.error(`Error computing status for household ${profile.active_household_id}:`, statusError);
                continue;
            }

            const { household_status, counts, top_priorities } = statusData;

            // 3. Determine if notification is needed
            let type: "risk" | "attention" | "info" | null = null;
            let title = "";
            let body = "";

            if (household_status === "risk") {
                type = "risk";
                title = "Atenção: tem algo em risco";
                body = "Isso pode virar multa ou juros. Quer ver agora?";
            } else if (household_status === "attention") {
                type = "attention";
                title = "Fique de olho";
                body = "Algumas coisas vencem em breve. Melhor se antecipar.";
            }

            if (!type) continue;

            // 4. Anti-spam check (already sent today?)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { data: existingNotif, error: notifCheckError } = await supabaseClient
                .from("notifications")
                .select("id")
                .eq("user_id", profile.id)
                .gte("created_at", todayStart.toISOString())
                .limit(1);

            if (notifCheckError || (existingNotif && existingNotif.length > 0)) {
                continue;
            }

            // 5. Get device tokens
            const { data: tokens, error: tokenError } = await supabaseClient
                .from("device_tokens")
                .select("token")
                .eq("user_id", profile.id);

            if (tokenError || !tokens || tokens.length === 0) continue;

            const pushTokens = tokens.map((t) => t.token);

            // 6. Record in notifications table
            await supabaseClient.from("notifications").insert({
                user_id: profile.id,
                household_id: profile.active_household_id,
                title,
                body,
                type,
                related_task_id: top_priorities?.[0]?.id || null,
            });

            // 7. Send Push via Expo
            await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: pushTokens,
                    title,
                    body,
                    data: { screen: "NotificationCenter", taskId: top_priorities?.[0]?.id },
                }),
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
