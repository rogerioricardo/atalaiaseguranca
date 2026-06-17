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
    let MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    // Tentar carregar o token dinamicamente a partir das configurações do painel se o Env Secret não estiver setado
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.log("[create-preference] BUSCANDO Token do Mercado Pago em system_settings...");
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
        if (supabaseUrl && supabaseAnonKey) {
          const fetchUrl = `${supabaseUrl}/rest/v1/system_settings?key=eq.mercado_pago_access_token&select=value`;
          const dbResponse = await fetch(fetchUrl, {
            headers: {
              "apikey": supabaseAnonKey,
              "Authorization": `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json"
            }
          });
          if (dbResponse.ok) {
            const rows = await dbResponse.json();
            if (rows && rows.length > 0 && rows[0].value) {
              MERCADO_PAGO_ACCESS_TOKEN = rows[0].value.trim();
              console.log("[create-preference] Token do Mercado Pago carregado com sucesso do Banco de Dados.");
            }
          }
        }
      } catch (dbErr) {
        console.error("[create-preference] Erro ao buscar token no banco:", dbErr);
      }
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.warn("MERCADO_PAGO_ACCESS_TOKEN não configurado nos Secrets do Supabase e nem no sistema. Usando modo de simulação.");
    }

    const { planId, payer, metadata, redirectUrl, couponCode } = await req.json();

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

    // Verificar se existe cupom e se é válido
    let appliedCoupon = null;
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      console.log(`[create-preference] Verificando cupom de desconto: ${cleanCode}`);
      
      let foundInDb = false;
      // Tentar buscar do banco do Supabase primeiro (inclusive para 'TESTE7DIAS1REAL' alterados)
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
        if (supabaseUrl && supabaseAnonKey) {
          const fetchUrl = `${supabaseUrl}/rest/v1/coupons?code=eq.${encodeURIComponent(cleanCode)}&select=*`;
          const dbResponse = await fetch(fetchUrl, {
            headers: {
              "apikey": supabaseAnonKey,
              "Authorization": `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json"
            }
          });
          if (dbResponse.ok) {
            const rows = await dbResponse.json();
            if (rows && rows.length > 0) {
              const coupon = rows[0];
              // Verificar se está ativo e se não esgotou o limite
              if (coupon.active && (coupon.used_count || 0) < (coupon.max_uses || 999999)) {
                appliedCoupon = coupon;
                foundInDb = true;
                
                // Pegar o preço correto, suportando snake_case e camelCase
                const couponPrice = Number(
                  coupon.promotional_price !== undefined 
                    ? coupon.promotional_price 
                    : (coupon.promotionalPrice !== undefined ? coupon.promotionalPrice : 1.00)
                );
                
                price = couponPrice;
                title = `${title} (Cupom ${coupon.code})`;
                console.log(`[create-preference] Cupom de banco ${coupon.code} aplicado com sucesso. Novo preço: R$ ${price}`);
              } else {
                console.log(`[create-preference] Cupom ${cleanCode} encontrado no banco de dados, mas não está ativo ou esgotou o limite de usos.`);
              }
            }
          }
        }
      } catch (dbErr) {
        console.error("[create-preference] Erro ao buscar cupom no banco de dados:", dbErr);
      }

      // Se não encontrou no banco (ou houve erro de conexão/configuração), usar o fallback estático robusto como backup para o cupom padrão
      if (!foundInDb && cleanCode === 'TESTE7DIAS1REAL') {
        price = 1.00;
        title = `${title} (Promoção 7d R$1,00 - Fallback)`;
        console.log(`[create-preference] Cupom estático TESTE7DIAS1REAL aplicado via FALLBACK. Novo preço: R$ 1,00`);
      }
    }

    // Limpar redirectUrl tirando parâmetros de query para gerar o baseRedirect correto
    let baseRedirect = redirectUrl || "https://atalaia-app.pages.dev";
    if (baseRedirect.includes('?')) {
      baseRedirect = baseRedirect.split('?')[0];
    }

    // Se não houver token do Mercado Pago, geramos um fallback imediato
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      const successUrlSimulated = `${baseRedirect}/#/payment-success?plan=${planId}${couponCode ? `&coupon=${couponCode}` : ''}&simulated=true`;
      console.warn("[create-preference] Sem credencial MP: Redirecionando para sucesso simulado.", successUrlSimulated);
      return new Response(JSON.stringify({ init_point: successUrlSimulated, info: "Simulado localmente por falta de credenciais." }), {
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
        success: `${baseRedirect}/#/payment-success?plan=${planId}${couponCode ? `&coupon=${couponCode}` : ''}`,
        failure: `${baseRedirect}/#/dashboard`,
        pending: `${baseRedirect}/#/dashboard`
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
