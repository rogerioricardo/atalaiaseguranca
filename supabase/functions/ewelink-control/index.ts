
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const IFTTT_KEY = Deno.env.get("IFTTT_KEY");
    
    if (!IFTTT_KEY) {
      throw new Error("IFTTT_KEY não configurada nos Secrets do Supabase.");
    }

    const { deviceId, action } = await req.json();
    const eventName = (deviceId || "acionar_giroflex").toString().trim();
    const cleanAction = (action || "toggle").toString().trim();
    
    const iftttUrl = `https://maker.ifttt.com/trigger/${eventName}/with/key/${IFTTT_KEY}`;

    console.log(`[IoT] Disparando IFTTT: ${eventName} com ação ${cleanAction}`);

    const response = await fetch(iftttUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        value1: cleanAction,
        value2: "Atalaia Cloud"
      })
    });

    const resultText = await response.text();

    if (!response.ok) {
      throw new Error(`Erro IFTTT: ${resultText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: resultText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(`[IoT-Erro] ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
})
