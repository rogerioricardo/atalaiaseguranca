
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
    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || "htGbba00iOEb9B74jRl2Y2lStYcSsEuJJvC2ST3IwCI5tcxFiu71WXxfHWwUeYC1"; // Use default if ENV not set
    const WHATSAPP_URL = "https://app.whatendimento.digital/api/messages/send";
    const SESSION_ID = "Default"; // Adjust according to Whaticket session if needed

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
      // Default fallback if no numbers provided
      return new Response(JSON.stringify({ error: "Nenhum número de destino fornecido." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const targets = rawTargets.map(t => {
      let clean = t.toString().trim();
      
      // Se já tiver o sufixo, mantém
      if (clean.includes('@g.us') || clean.includes('@c.us')) return clean;

      // Remove TUDO que não for número
      clean = clean.replace(/\D/g, '');

      // Se for número brasileiro sem 55 (10 ou 11 dígitos)
      if (clean.length === 11 || clean.length === 10) {
        clean = '55' + clean;
      }
      
      // Caso especial: se começar com 0, remove o 0 e tenta de novo (vários usuários colocam 011...)
      if (clean.startsWith('0') && (clean.length === 11 || clean.length === 12)) {
          clean = '55' + clean.substring(1);
      }

      return clean;
    });

    const sendRequest = async (target: string) => {
      let formattedTarget = target;
      if (!formattedTarget.includes('@')) {
        formattedTarget = `${formattedTarget}@c.us`;
      }

      console.log(`[WhatsApp] Tentando envio para: ${formattedTarget}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(WHATSAPP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'apikey': WHATSAPP_TOKEN 
          },
          body: JSON.stringify({
            number: formattedTarget,
            body: message,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const resultText = await response.text();
        
        if (!response.ok) {
          console.error(`[WhatsApp-Erro] API ${WHATSAPP_URL} retornou ${response.status}:`, resultText);
          return { 
            target, 
            success: false, 
            error: resultText || `Status ${response.status}`,
            status: response.status 
          };
        }

        console.log(`[WhatsApp-Sucesso] Enviado para ${formattedTarget}`);
        return { target, success: true };
      } catch (e: any) {
        console.error(`[WhatsApp-Falha] Erro para ${formattedTarget}:`, e.message);
        return { target, success: false, error: e.message };
      }
    };

    // Envio em lotes para evitar sobrecarga (5 por vez)
    const batchSize = 5;
    const results = [];
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      console.log(`[WhatsApp] Processando lote ${Math.floor(i/batchSize) + 1} (${batch.length} envios)`);
      const batchResults = await Promise.all(batch.map(t => sendRequest(t)));
      results.push(...batchResults);
      // Pequeno intervalo entre lotes se houver mais
      if (i + batchSize < targets.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
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
