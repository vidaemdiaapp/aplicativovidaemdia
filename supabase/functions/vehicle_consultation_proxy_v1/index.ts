import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { endpoint, plate } = await req.json();

        if (!endpoint || !plate) {
            return new Response(JSON.stringify({ error: 'Endpoint and plate are required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const API_BASE_URL = 'https://buscasim.com.br/api/searches';
        const API_TOKEN = 'f4t76dbbwf';

        const apiUrl = `${API_BASE_URL}/${endpoint}`;

        console.log(`Proxying request for plate ${plate} to ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-TOKEN': API_TOKEN,
                'Accept': 'application/json',
            },
            body: JSON.stringify({ plate }),
        });

        // Some APIs return non-JSON responses on error, so we parse carefully
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse API response as JSON', responseText);
            data = { rawResponse: responseText };
        }

        if (!response.ok) {
            console.error(`API Error ${response.status}`, data);
            return new Response(JSON.stringify({
                error: `API returned ${response.status}`,
                details: data
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status,
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
