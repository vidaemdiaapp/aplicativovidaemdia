// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================================
   Utils
========================================================= */
function normalizePhoneDigits(input: string) {
  let d = (input ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

function toE164(digits: string) {
  return digits ? `+${digits}` : null;
}

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* =========================================================
   Main
========================================================= */
serve(async (req: Request) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const META_TOKEN = Deno.env.get("META_WA_TOKEN")!;
  const PHONE_NUMBER_ID = Deno.env.get("META_WA_PHONE_NUMBER_ID")!;
  const VERIFY_TOKEN = Deno.env.get("META_WA_VERIFY_TOKEN") ?? "";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  /* =====================================================
     GET — Webhook Verify (Meta)
  ===================================================== */
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  /* =====================================================
     Parse payload
  ===================================================== */
  const raw = await req.text();
  let payload: any;

  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("WEBHOOK HIT", new Date().toISOString());

  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const hasMessages = Boolean(value?.messages?.length);
  const hasStatuses = Boolean(value?.statuses?.length);

  console.log("HAS_MESSAGES?", hasMessages, "HAS_STATUSES?", hasStatuses);

  if (!hasMessages) {
    console.log("Ignorado: evento sem messages[] (status)");
    return json({ ok: true });
  }

  /* =====================================================
     Extract message
  ===================================================== */
  const msg = value.messages[0];
  const wa_id = msg?.from ?? value?.contacts?.[0]?.wa_id;

  const inboundText =
    msg?.text?.body ??
    msg?.button?.text ??
    msg?.interactive?.button_reply?.title ??
    msg?.interactive?.list_reply?.title ??
    "";

  "";

  const isAudio = msg?.type === "audio";
  const audioId = msg?.audio?.id;

  if (!wa_id || (!inboundText && !isAudio)) {
    console.log("Mensagem inválida ou vazia (e não é áudio)");
    return json({ ok: true });
  }

  const from_phone_digits = normalizePhoneDigits(wa_id);
  const from_phone_e164 = toE164(from_phone_digits);

  const businessDisplay = value?.metadata?.display_phone_number ?? "";
  const to_phone_digits = normalizePhoneDigits(businessDisplay);

  console.log("INBOUND:", { from_phone_digits, inboundText });

  /* =====================================================
     Find profile
  ===================================================== */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, phone_digits")
    .eq("phone_digits", from_phone_digits)
    .maybeSingle();

  /* =====================================================
     Log inbound
  ===================================================== */
  await supabase.from("whatsapp_messages").insert({
    profile_id: profile?.id ?? null,
    lead_id: null,
    wa_id,
    payload,
    message_text: inboundText,
    direction: "inbound",
    provider_message_id: msg?.id ?? null,
    from_phone: from_phone_digits,
    to_phone: to_phone_digits || null,
    error_log: null,
    created_at: new Date().toISOString(),
  });

  /* =====================================================
     If NO profile → lead flow
  ===================================================== */
  if (!profile) {
    await supabase.from("whatsapp_leads").upsert(
      {
        phone_digits: from_phone_digits,
        phone_e164: from_phone_e164,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_digits" }
    );

    const leadReply =
      "Oi! 👋 Ainda não encontrei seu cadastro no app.\n\n" +
      "👉 Baixe o *Vida em Dia* e finalize o cadastro com esse número 😊";

    const sendRes = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${META_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from_phone_digits,
          type: "text",
          text: { body: leadReply },
        }),
      }
    );

    const sendBody = await sendRes.text();
    console.log("META SEND (lead):", sendRes.status, sendBody);

    await supabase.from("whatsapp_messages").insert({
      profile_id: null,
      lead_id: null,
      wa_id,
      payload: { meta_send: sendBody },
      message_text: leadReply,
      direction: "outbound",
      provider_message_id: null,
      from_phone: to_phone_digits || null,
      to_phone: from_phone_digits,
      error_log: sendRes.ok ? null : sendBody,
      created_at: new Date().toISOString(),
    });

    return json({ ok: true });
  }

  /* =====================================================
     Handle Audio (Download & Convert)
  ===================================================== */
  let audioBase64: string | null = null;
  let audioMime: string | null = null;

  if (isAudio && audioId) {
    console.log(`[Webhook] Audio detected: ${audioId}. Fetching URL...`);
    try {
      // 1. Get Media URL
      const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${audioId}`, {
        headers: { Authorization: `Bearer ${META_TOKEN}` }
      });
      const mediaJson = await mediaRes.json();
      const mediaUrl = mediaJson.url;
      audioMime = mediaJson.mime_type || "audio/ogg"; // Default WhatsApp voice note

      console.log(`[Webhook] Downloading binary from ${mediaUrl}...`);

      // 2. Download Binary
      const binaryRes = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${META_TOKEN}` }
      });
      const arrayBuffer = await binaryRes.arrayBuffer();

      // 3. Convert to Base64
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      audioBase64 = btoa(binaryString);

      console.log(`[Webhook] Audio processed. Size: ${audioBase64.length} chars.`);

    } catch (err) {
      console.error("[Webhook] Failed to process audio", err);
      // Fallback: Continue without audio, maybe smart_chat will complain
    }
  }

  /* =====================================================
     Call smart_chat_v1 (INTERNAL)
  ===================================================== */
  console.log("CALLING smart_chat_v1");

  const smartRes = await fetch(
    `${SUPABASE_URL}/functions/v1/smart_chat_v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "whatsapp",
        profile_id: profile.id,
        wa_id,
        phone_digits: from_phone_digits,

        // 🔥 aliases (ESSENCIAL)
        message_text: inboundText,
        message: inboundText,
        text: inboundText,
        input: inboundText,
        prompt: inboundText,

        // 🎵 Audio Payload
        message_type: isAudio ? "audio" : "text",
        audio_base64: audioBase64,
        audio_mime_type: audioMime
      }),
    }
  );

  const smartRaw = await smartRes.text();
  console.log("smart_chat_v1:", smartRes.status, smartRaw);

  /* =====================================================
     Parse smart response
  ===================================================== */
  let reply = "Recebi sua mensagem ✅";

  if (smartRes.ok) {
    try {
      const j = JSON.parse(smartRaw);
      reply =
        j.answer_text ||
        j.reply ||
        j.message ||
        j.text ||
        reply;

      // --- NEW: Handle Pending Actions (Tool Calls) ---
      if (j.pending_action) {
        console.log("EXECUTING ACTION:", j.pending_action.type, j.pending_action.payload);

        const actionType = j.pending_action.type;
        const payload = j.pending_action.payload || {};

        if (actionType === 'create_task' || actionType === 'add_expense') {
          // Validate payload
          const title = payload.title || "Despesa via WhatsApp";
          const amount = parseFloat(payload.amount);
          const category_id = payload.category_id || 'outros';

          if (!isNaN(amount) && amount > 0) {
            const { error: taskError } = await supabase.from('tasks').insert({
              user_id: profile.id,
              owner_user_id: profile.id,
              household_id: profile.active_household_id, // Important: use active household
              title: title,
              amount: amount,
              category_id: category_id,
              entry_type: 'immediate', // Default for WhatsApp
              status: 'completed', // Assume immediate is paid? Or pending? Usually immediate is 'completed' logic-wise for expenses paid now. Let's start with pending/bill unless explicitly immediate. AI usually sends entry_type.
              // Updating to match standard logic:
              purchase_date: new Date().toISOString().split('T')[0],
              payment_method: 'pix', // Default or from payload
              description: `Via WhatsApp: ${inboundText}`,
              created_at: new Date().toISOString()
            });

            if (taskError) {
              console.error("Task insert error:", taskError);
              reply += "\n\n(Ops, tentei salvar a despesa mas deu erro no banco).";
            } else {
              reply += "\n\n✅ Despesa salva no app!";
            }
          }
        }
      }
      // ------------------------------------------------

    } catch (e) {
      console.error("JSON parse error/Action error:", e);
      reply = smartRaw.trim() || reply;
    }
  } else {
    reply = "Tive um probleminha aqui 😅 Pode tentar de novo.";
  }

  /* =====================================================
     Send reply to WhatsApp
  ===================================================== */
  const sendRes = await fetch(
    `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: from_phone_digits,
        type: "text",
        text: { body: reply },
      }),
    }
  );

  const sendBody = await sendRes.text();
  console.log("META SEND:", sendRes.status, sendBody);

  /* =====================================================
     Log outbound
  ===================================================== */
  await supabase.from("whatsapp_messages").insert({
    profile_id: profile.id,
    lead_id: null,
    wa_id,
    payload: { meta_send: sendBody },
    message_text: reply,
    direction: "outbound",
    provider_message_id: null,
    from_phone: to_phone_digits || null,
    to_phone: from_phone_digits,
    error_log: sendRes.ok ? null : sendBody,
    created_at: new Date().toISOString(),
  });

  return json({ ok: true });
});
