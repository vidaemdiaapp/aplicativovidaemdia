// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* -------------------- helper: media -------------------- */
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
    return encodeBase64(arrayBuffer);
  } catch (err) {
    console.error("Media download error:", err);
    return null;
  }
}

/* -------------------- main -------------------- */
serve(async (req: Request) => {
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

  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const hasMessages = Boolean(value?.messages?.length);
  const hasStatuses = Boolean(value?.statuses?.length);

  console.log("WEBHOOK HIT", new Date().toISOString());
  console.log("HAS_MESSAGES?", hasMessages, "HAS_STATUSES?", hasStatuses);

  // statuses (delivered/read) -> ignore
  if (!hasMessages) {
    console.log("Ignorado: evento sem messages[] (status)");
    return json({ ok: true });
  }
  const msg = value.messages[0];
  const wa_id: string = msg?.from ?? value?.contacts?.[0]?.wa_id ?? "";

  /* ----------- media handling ----------- */
  let audio_base64: string | null = null;
  let audio_mime_type: string | null = null;
  let image_base64: string | null = null;
  let image_mime_type: string | null = null;

  if (msg?.type === "audio" && msg?.audio?.id) {
    console.log("AUDIO DETECTED:", msg.audio.id);
    audio_base64 = await downloadMediaAsBase64(msg.audio.id, META_TOKEN);
    audio_mime_type = msg.audio.mime_type || "audio/ogg";
  } else if (msg?.type === "image" && msg?.image?.id) {
    console.log("IMAGE DETECTED:", msg.image.id);
    image_base64 = await downloadMediaAsBase64(msg.image.id, META_TOKEN);
    image_mime_type = msg.image.mime_type || "image/jpeg";
  } else if (msg?.type === "document" && msg?.document?.id) {
    console.log("DOCUMENT DETECTED:", msg.document.id);
    image_base64 = await downloadMediaAsBase64(msg.document.id, META_TOKEN);
    image_mime_type = msg.document.mime_type || "application/pdf";
  }


  const inboundText: string =
    msg?.text?.body ??
    msg?.button?.text ??
    msg?.interactive?.button_reply?.title ??
    msg?.interactive?.list_reply?.title ??
    "";

  const hasMedia = !!audio_base64 || !!image_base64;

  if (!wa_id || (!inboundText && !hasMedia)) {
    console.log("Mensagem inválida ou vazia (sem texto, áudio ou imagem)");
    return json({ ok: true });
  }

  const mediaHint = audio_base64
    ? "[Áudio: Transcrever e processar ações financeiras]"
    : (image_base64 ? "[Imagem: Extrair dados de Cupom/Nota Fiscal/Documento]" : "");


  const from_phone_digits = normalizePhoneDigits(wa_id);
  const from_phone_e164 = toE164(from_phone_digits);

  const businessDisplay = value?.metadata?.display_phone_number ?? "";
  const to_phone_digits = normalizePhoneDigits(businessDisplay);

  console.log("INBOUND:", { from_phone_digits, inboundText, hasAudio: !!audio_base64, hasImage: !!image_base64 });

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
    message_text: inboundText || (audio_base64 ? "[Áudio]" : ""),
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

    return json({ ok: true });
  }

  /* ----------- call smart_chat_v1 ----------- */
  const smartRes = await fetch(`${SUPABASE_URL}/functions/v1/smart_chat_v1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "whatsapp",
      user_id: profile.id,     // 🔥 ESSENCIAL para gravar em tasks
      profile_id: profile.id,  // ok manter
      wa_id,
      phone_digits: from_phone_digits,
      audio_base64,
      audio_mime_type,

      // aliases do texto
      message_text: inboundText || mediaHint,
      message: inboundText || mediaHint,
      text: inboundText || mediaHint,
      input: inboundText || mediaHint,
      prompt: inboundText || mediaHint,
      input_type: audio_base64 ? "audio" : (image_base64 ? "image" : "text"),
      image: image_base64,
      image_mime_type
    }),
  });

  const smartRaw = await smartRes.text();
  console.log("smart_chat_v1:", smartRes.status, smartRaw);

  let reply = "Recebi sua mensagem ✅";

  if (smartRes.ok) {
    try {
      const j = JSON.parse(smartRaw);
      if (j.ok && j.answer_text) {
        reply = j.answer_text;
      } else {
        reply =
          j.answer_text ||
          j.reply ||
          j.message ||
          j.text ||
          reply;
      }
    } catch {
      reply = smartRaw.trim() || reply;
    }
  } else {
    reply = "Tive um probleminha aqui 😅 Pode tentar de novo em alguns segundos?";
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

  return json({ ok: true });
});
