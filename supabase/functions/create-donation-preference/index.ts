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
    const { amount, payer, mpAccessToken, metadata } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valor de doação inválido" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Se o integrador não configurou o token dele, caímos no mockup para simulação
    if (!mpAccessToken) {
      console.warn("O Integrador não passou um token de acesso do Mercado Pago.");
      const simulatedUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=simulated_donation_${amount}_${Date.now()}`;
      return new Response(JSON.stringify({ init_point: simulatedUrl, info: "Simulado localmente." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Montando payload de doação para a API do Mercado Pago
    const mpPayload = {
      items: [
        {
          title: "Contribuição Espontânea - Atalaia Bairro",
          quantity: 1,
          unit_price: Number(amount),
          currency_id: "BRL"
        }
      ],
      payer: {
        name: payer?.name || "Apoiador Atalaia",
        email: payer?.email || ""
      },
      back_urls: {
        success: `https://atalaia-app.pages.dev/#/dashboard?donation=success`,
        failure: `https://atalaia-app.pages.dev/#/dashboard?donation=failed`,
        pending: `https://atalaia-app.pages.dev/#/dashboard`
      },
      auto_return: "approved",
      metadata: {
        type: "donation",
        payer_email: payer?.email,
        source: metadata?.source || "donation-app"
      }
    };

    console.log("[Mercado Pago Doação] Enviando payload:", JSON.stringify(mpPayload));

    // Fazendo a chamada utilizando o token de acesso exclusivo do integrador do bairro
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken}`
      },
      body: JSON.stringify(mpPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Mercado Pago Donation Error]", result);
      throw new Error(result.message || "Erro desconhecido na API do Mercado Pago ao gerar doação");
    }

    return new Response(JSON.stringify({ 
      init_point: result.init_point, 
      preference_id: result.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Erro fatal create-donation-preference:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
