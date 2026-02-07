// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

async function downloadMediaAsBase64(mediaId: string, metaToken: string) {
  try {
    const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${metaToken}` },
    });
    const mediaData = await mediaRes.json();
    if (!mediaData?.url) return null;

    const fileRes = await fetch(mediaData.url, {
      headers: { Authorization: `Bearer ${metaToken}` },
    });
    const arrayBuffer = await fileRes.arrayBuffer();
    return encodeBase64(new Uint8Array(arrayBuffer));
  } catch (err) {
    console.error("Media download error:", err);
    return null;
  }
}

/* -------------------- utils -------------------- */
function normalizePhoneDigits(input: string) {
  let d = (input ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

function toE164(digits: string) {
  return digits ? `+${digits}` : null;
}

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* -------------------- main -------------------- */
Deno.serve(async (req: Request) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const META_TOKEN = Deno.env.get("META_WA_TOKEN") ?? "";
  const PHONE_NUMBER_ID = Deno.env.get("META_WA_PHONE_NUMBER_ID") ?? "";
  const VERIFY_TOKEN = Deno.env.get("META_WA_VERIFY_TOKEN") ?? "";

  if (!SUPABASE_URL || !SERVICE_ROLE) return new Response("Missing Supabase env", { status: 500 });
  if (!META_TOKEN || !PHONE_NUMBER_ID) return new Response("Missing Meta env", { status: 500 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  /* ----------- GET verify ----------- */
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

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  /* ----------- parse payload ----------- */
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("WEBHOOK PAYLOAD:", JSON.stringify(payload, null, 2));

  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const hasMessages = Boolean(value?.messages?.length);
  const hasStatuses = Boolean(value?.statuses?.length);

  console.log("WEBHOOK HIT", new Date().toISOString());
  console.log("HAS_MESSAGES?", hasMessages, "HAS_STATUSES?", hasStatuses);

  // statuses (delivered/read) -> ignore
  if (!hasMessages) {
    console.log("STEP_STATUS_ONLY: evento sem messages[] (status)");
    return jsonResponse({ ok: true });
  }

  console.log("STEP_INBOUND_RECEIVED");

  const msg = value.messages[0];
  const messageId = msg?.id ?? ""; // wamid - ID único da mensagem
  const wa_id: string = msg?.from ?? value?.contacts?.[0]?.wa_id ?? "";
  const msgType = msg?.type; // 'text', 'audio', 'image', 'voice', 'interactive', 'button'

  // ========== IDEMPOTÊNCIA ==========
  // Verifica se já processamos esta mensagem (pelo message_id único do WhatsApp)
  if (messageId && wa_id) {
    const { error: idempotencyError } = await supabase
      .from("whatsapp_inbound_events")
      .insert({
        provider: "whatsapp",
        message_id: messageId,
        from_phone: wa_id,
        message_type: msgType || "unknown",
        raw_payload: payload,
        status: "received"
      });

    if (idempotencyError) {
      // Erro de constraint única = mensagem já processada
      if (idempotencyError.code === "23505") {
        console.log("STEP_DUPLICATE_IGNORE: message_id já processado:", messageId);
        return jsonResponse({ ok: true, duplicate: true });
      }
      // Outro erro - loga mas continua (não bloqueia o fluxo)
      console.error("STEP_IDEMPOTENCY_ERROR:", idempotencyError);
    } else {
      console.log("STEP_IDEMPOTENCY_OK: nova mensagem registrada:", messageId);
    }
  }
  // ========== FIM IDEMPOTÊNCIA ==========


  console.log("MSG_DETAIL:", { wa_id, msgType, hasAudio: !!(msg?.audio || msg?.voice), hasText: !!msg?.text });

  let inboundText = "";
  let mediaUrl: string | null = null;
  let mediaMime: string | null = null;
  let isMedia = false;

  if (msgType === "text") {
    inboundText = msg.text?.body ?? "";
  } else if (msgType === "audio" || msgType === "voice" || msg?.audio || msg?.voice) {
    inboundText = "[audio]";
    const audioObj = msg.audio || msg.voice;
    mediaUrl = audioObj?.id;
    mediaMime = audioObj?.mime_type;
    isMedia = true;
  } else if (msgType === "image" || msg?.image) {
    inboundText = msg.caption ? `[imagem] ${msg.caption}` : "[imagem]";
    mediaUrl = msg.image?.id;
    mediaMime = msg.image?.mime_type;
    isMedia = true;
  } else if (msgType === "interactive") {
    // Trata botões de lista ou botões simples em mensagens interativas
    inboundText = msg.interactive?.button_reply?.title ??
      msg.interactive?.list_reply?.title ??
      msg.interactive?.button_reply?.id ?? "";
  } else if (msgType === "button") {
    inboundText = msg.button?.text ?? msg.button?.payload ?? "";
  } else if (msgType === "reaction") {
    console.log("Ignorado: reaction");
    return jsonResponse({ ok: true });
  } else {
    inboundText = `[${msgType || 'unknown'}]`;
  }

  // Se não tem wa_id OU se não tem texto E não tem mídia
  const trimmedText = inboundText.trim();
  if (!wa_id || (!trimmedText && !mediaUrl)) {
    console.log("Mensagem inválida ou vazia:", { wa_id, msgType, text: trimmedText, hasMedia: !!mediaUrl });
    return jsonResponse({ ok: true });
  }

  // Download media if exists
  let mediaBase64: string | null = null;
  if (mediaUrl && META_TOKEN) {
    console.log("Downloading media:", mediaUrl);
    mediaBase64 = await downloadMediaAsBase64(mediaUrl, META_TOKEN);
    if (!mediaBase64) console.warn("Failed to download media.");
  }

  const from_phone_digits = normalizePhoneDigits(wa_id);
  const from_phone_e164 = toE164(from_phone_digits);

  const businessDisplay = value?.metadata?.display_phone_number ?? "";
  const to_phone_digits = normalizePhoneDigits(businessDisplay);

  console.log("INBOUND:", { from_phone_digits, inboundText, isMedia: !!mediaBase64 });

  /* ----------- find profile ----------- */
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id, phone_digits")
    .eq("phone_digits", from_phone_digits)
    .maybeSingle();

  if (profErr) console.error("Profile lookup error:", profErr);

  /* ----------- log inbound ----------- */
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

  /* ----------- lead flow ----------- */
  if (!profile) {
    await supabase.from("whatsapp_leads").upsert(
      {
        phone_digits: from_phone_digits,
        phone_e164: from_phone_e164,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_digits" },
    );

    const leadReply =
      "Oi! 👋 Ainda não encontrei seu cadastro no app.\n\n" +
      "👉 Baixe o *Vida em Dia* e finalize o cadastro com esse número 😊";

    const sendRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
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
    });

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

    return jsonResponse({ ok: true });
  }

  /* ----------- call smart_chat_v1 ----------- */
  console.log("STEP_SMARTCHAT_CALL");
  const smartRes = await fetch(`${SUPABASE_URL}/functions/v1/smart_chat_v1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source: "whatsapp",
      user_id: profile.id,     // 🔥 ESSENCIAL para gravar em tasks
      profile_id: profile.id,  // ok manter
      wa_id,
      phone_digits: from_phone_digits,

      // aliases do texto
      message_text: inboundText,
      message: inboundText,
      text: inboundText,
      input: inboundText,
      prompt: inboundText,
      input_type: "text",

      // Add media payload
      audio_base64: (msgType === 'audio' || msgType === 'voice') ? mediaBase64 : null,
      audio_mime_type: (msgType === 'audio' || msgType === 'voice') ? mediaMime : null,
      image: msgType === 'image' ? mediaBase64 : null,
      image_mime_type: msgType === 'image' ? mediaMime : null,
    }),
  });

  const smartRaw = await smartRes.text();
  console.log("smart_chat_v1:", smartRes.status, smartRaw);

  let reply = "Recebi sua mensagem ✅";
  let eventStatus = "saved";
  let eventError: string | null = null;

  if (smartRes.ok) {
    console.log("STEP_SMARTCHAT_OK");
    try {
      const j = JSON.parse(smartRaw);
      reply =
        j.answer_text ||
        j.reply ||
        j.message ||
        j.text ||
        reply;
    } catch {
      reply = smartRaw.trim() || reply;
    }
  } else {
    console.log("STEP_SMARTCHAT_FAILED:", smartRes.status);
    eventStatus = "failed";
    eventError = `smart_chat status: ${smartRes.status}`;
    reply = "Tive um probleminha aqui 😅 Pode tentar de novo em alguns segundos?";
  }

  // Atualiza status do evento de idempotência
  if (messageId) {
    await supabase
      .from("whatsapp_inbound_events")
      .update({
        status: eventStatus,
        error: eventError,
        user_id: profile.id
      })
      .eq("message_id", messageId);
    console.log(`STEP_${eventStatus === "saved" ? "DB_SAVED" : "FAILED"}`);
  }

  /* ----------- send to WhatsApp ----------- */
  const sendRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
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
  });

  const sendBody = await sendRes.text();
  console.log("META SEND:", sendRes.status, sendBody);

  /* ----------- log outbound ----------- */
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

  return jsonResponse({ ok: true });
});
