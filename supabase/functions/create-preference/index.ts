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
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.warn("MERCADO_PAGO_ACCESS_TOKEN não configurado nos Secrets do Supabase. Usando modo de simulação.");
    }

    const { planId, payer, metadata } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: "Parâmetro planId é obrigatório" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Configuração do preço baseado no ID do plano
    let title = "Assinatura Plano Atalaia";
    let price = 39.90;

    if (planId === "FAMILY") {
      title = "Atalaia - Plano Família";
      price = 39.90;
    } else if (planId === "PREMIUM") {
      title = "Atalaia - Plano Prêmio";
      price = 79.90;
    } else {
      title = `Atalaia - Plano ${planId}`;
      price = 39.90; 
    }

    // Se não houver token do Mercado Pago, geramos um fallback imediato
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      const simulatedUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=simulated_${planId}_${Date.now()}`;
      return new Response(JSON.stringify({ init_point: simulatedUrl, info: "Simulado localmente por falta de credenciais." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Corpo de requisição da preferência do Mercado Pago v1 API
    const mpPayload = {
      items: [
        {
          title: title,
          quantity: 1,
          unit_price: price,
          currency_id: "BRL"
        }
      ],
      payer: {
        name: payer?.name || "Morador Atalaia",
        email: payer?.email || "",
        phone: payer?.phone ? { number: payer.phone } : undefined
      },
      back_urls: {
        // Redireciona de volta para a rota de sucesso do applet
        success: `https://atalaia-app.pages.dev/#/payment-success?plan=${planId}`,
        failure: `https://atalaia-app.pages.dev/#/dashboard`,
        pending: `https://atalaia-app.pages.dev/#/dashboard`
      },
      auto_return: "approved",
      metadata: {
        plan_id: planId,
        payer_email: payer?.email,
        source: metadata?.source || "web-app"
      }
    };

    console.log("[Mercado Pago] Enviando payload:", JSON.stringify(mpPayload));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(mpPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Mercado Pago Error]", result);
      throw new Error(result.message || "Erro desconhecido na API do Mercado Pago");
    }

    return new Response(JSON.stringify({ 
      init_point: result.init_point, 
      preference_id: result.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Erro fatal create-preference:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
