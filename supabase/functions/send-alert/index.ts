
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Fix: Declare Deno global to resolve TypeScript error
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    const WHATSAPP_URL = "https://app.whatendimento.digital/backend/api/messages/send";
    const DEFAULT_GROUP = "120363025345678901@g.us";

    if (!WHATSAPP_TOKEN) {
      throw new Error("WHATSAPP_TOKEN não configurado nos Secrets do Supabase.");
    }

    const { message, number, numbers } = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: "Mensagem vazia" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let rawTargets: string[] = [];
    if (numbers && Array.isArray(numbers)) {
      rawTargets = numbers;
    } else if (number) {
      rawTargets = [number];
    } else {
      rawTargets = [DEFAULT_GROUP];
    }

    const targets = rawTargets.map(t => {
      let clean = t.toString().trim();
      
      // Se já tiver o sufixo, mantém
      if (clean.includes('@g.us') || clean.includes('@c.us')) return clean;

      // Remove TUDO que não for número
      clean = clean.replace(/\D/g, '');

      // Correção do 550 para 55
      if (clean.startsWith('550')) {
        clean = '55' + clean.substring(3);
      }
      
      // Se não tiver o sufixo e for número individual, adiciona @c.us
      if (!clean.includes('@')) {
        return `${clean}@c.us`;
      }
      
      return clean;
    });

    const sendRequest = async (target: string) => {
      const fullUrl = `${WHATSAPP_URL}?token=${WHATSAPP_TOKEN}`;

      console.log(`[WhatsApp] Enviando para: ${target}`);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'apikey': WHATSAPP_TOKEN 
        },
        body: JSON.stringify({
          number: target,
          body: message
        })
      });

      const resultText = await response.text();
      
      if (!response.ok) {
        console.error(`[WhatsApp-Erro] Status ${response.status} para ${target}:`, resultText);
        return { target, success: false, error: resultText };
      }

      console.log(`[WhatsApp-Sucesso] API aceitou o envio para ${target}`);
      return { target, success: true };
    };

    const results = await Promise.all(targets.map(t => sendRequest(t)));
    
    return new Response(JSON.stringify({ 
      success: results.some(r => r.success), 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ Erro fatal send-alert:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
