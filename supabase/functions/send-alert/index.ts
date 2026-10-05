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
    const { message, number, numbers, token, apiKey } = await req.json().catch(() => ({}));

    // Credenciais ativas com fallback direto para suas credenciais do Whaticket
    const WHATSAPP_TOKEN = token || Deno.env.get("WHATSAPP_TOKEN") || "HSYumH8GyDXc90Bb1ZcBoVMBjatynktt";
    const WHATSAPP_API_KEY = apiKey || Deno.env.get("WHATSAPP_API_KEY") || "Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp";
    const WHATSAPP_URL = "https://app.whatendimento.digital/backend/api/messages/send";

    if (!WHATSAPP_TOKEN) {
      throw new Error("WHATSAPP_TOKEN não configurado.");
    }

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
      return new Response(JSON.stringify({ error: "Nenhum número de destino informado." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Tratamento dos números para o padrão aceito pelo Whaticket
    const targets = rawTargets.map(t => {
      let clean = t.toString().trim();
      
      // Se for ID de grupo do WhatsApp (@g.us), mantém inalterado
      if (clean.includes('@g.us')) return clean;

      // Remove sufixo @c.us e qualquer caractere não numérico
      clean = clean.replace('@c.us', '').replace(/\D/g, '');

      // Remove 0 após o 55 (ex: 55048... -> 5548...)
      if (clean.startsWith('550')) {
        clean = '55' + clean.substring(3);
      }

      // Se tiver 10 ou 11 dígitos (DDD + Número), adiciona o DDI Brasil (55)
      if (clean.length === 10 || clean.length === 11) {
        clean = '55' + clean;
      }

      return clean;
    });

    const sendRequest = async (target: string) => {
      console.log(`[WhatsApp] Disparando para: ${target}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`
      };
      if (WHATSAPP_API_KEY) {
        headers['apikey'] = WHATSAPP_API_KEY;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        const response = await fetch(WHATSAPP_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: target,
            body: message
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const resultText = await response.text();
        
        if (!response.ok) {
          console.error(`[WhatsApp-Erro] Status ${response.status} para ${target}:`, resultText);
          return { target, success: false, error: resultText };
        }

        console.log(`[WhatsApp-Sucesso] Whaticket colocou na fila para ${target}:`, resultText);
        return { target, success: true, details: resultText };
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error(`[WhatsApp-Falha] Erro de rede para ${target}:`, err.message);
        return { target, success: false, error: err.message };
      }
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
