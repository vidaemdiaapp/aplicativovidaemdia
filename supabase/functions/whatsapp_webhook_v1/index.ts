import { serve } from "https://deno.land/std/http/server.ts";

function extractMessage(payload: any) {
  const msg = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return null;

  const from = msg.from; // wa_id do usuário
  const text = msg?.text?.body ?? "";
  return { from, text };
}

async function sendWhatsAppText(to: string, body: string) {
  const token = Deno.env.get("META_WA_TOKEN") ?? "";
  const phoneNumberId = Deno.env.get("META_WA_PHONE_NUMBER_ID") ?? "";

  if (!token || !phoneNumberId) {
    console.error("Faltam secrets META_WA_TOKEN ou META_WA_PHONE_NUMBER_ID");
    return;
  }

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Erro ao enviar WhatsApp:", err);
  }
}

serve(async (req) => {
  const url = new URL(req.url);

  // Verificação do webhook (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Mensagens (POST)
  if (req.method === "POST") {
    const raw = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      console.log("POST RAW (nao-json):", raw);
      return new Response("OK", { status: 200 });
    }

    // Extraí mensagem (se for evento de status/entrega, não vem messages[])
    const parsed = extractMessage(payload);
    if (!parsed) {
      return new Response("OK", { status: 200 });
    }

    const { from, text } = parsed;
    console.log("Mensagem recebida:", { from, text });

    // Resposta fixa (teste)
    await sendWhatsAppText(from, "Recebi 👍");

    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
