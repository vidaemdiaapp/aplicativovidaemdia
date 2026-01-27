import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { fine_details, user_answers } = await req.json()
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')

        const prompt = `
      Você é um especialista em direito de trânsito brasileiro. Sua tarefa é gerar uma DEFESA PRÉVIA formal para uma multa de trânsito.
      
      DADOS DA INFRAÇÃO:
      - Placa: ${fine_details.plate}
      - Órgão Emissor: ${fine_details.issuer}
      - Código/Infração: ${fine_details.infraction_code} - ${fine_details.description}
      - Natureza: ${fine_details.nature}
      - Local: ${fine_details.location}
      - Data/Hora: ${fine_details.infraction_date} às ${fine_details.infraction_time}
      
      DETALHES DO CONDUTOR (RESPOSTAS):
      ${JSON.stringify(user_answers)}
      
      REGRAS:
      1. Use uma linguagem formal e jurídica (porém acessível).
      2. Foque em inconsistências técnicas se houver (ex: erro na placa, local inexistente, sinalização precária).
      3. Se o condutor alegou que não estava no local ou emergência, fundamente com base no CTB (Código de Trânsito Brasileiro).
      4. O tom deve ser respeitoso, dirigido ao Presidente da JARI/Órgão Autuador.
      5. Retorne APENAS o texto em Markdown, pronto para ser impresso ou lido.
      6. No final, adicione uma seção: "ONDE PROTOCOLAR" explicando que deve ser feito no site do DETRAN ou presencialmente.
      
      Template de estrutura:
      # ILUSTRÍSSIMO SENHOR PRESIDENTE DA JARI DO(A) [ÓRGÃO EMISSOR]
      
      Eu, [Nome do Condutor], proprietário do veículo de placa [PLACA], venho respeitosamente apresentar DEFESA contra a Notificação de Autuação nº [NÚMERO Se houver].
      
      ## DOS FATOS
      (Descreva o ocorrido com base nos detalhes fornecidos)
      
      ## DO DIREITO
      (Fundamente juridicamente)
      
      ## DO PEDIDO
      Ante o exposto, requer-se o CANCELAMENTO e ARQUIVAMENTO do Auto de Infração.
      
      Atenciosamente,
      [Espaço para Assinatura]
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar defesa."

        return new Response(JSON.stringify({ markdown: content }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
