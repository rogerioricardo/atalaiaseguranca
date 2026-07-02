import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[MP Webhook] Supabase environment variables not set!");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Obter o Token de Acesso do Mercado Pago (buscando no Env Secret ou do Banco de Dados)
    let MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      try {
        const fetchUrl = `${supabaseUrl}/rest/v1/system_settings?key=eq.mercado_pago_access_token&select=value`;
        const dbResponse = await fetch(fetchUrl, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          }
        });
        if (dbResponse.ok) {
          const rows = await dbResponse.json();
          if (rows && rows.length > 0 && rows[0].value) {
            MERCADO_PAGO_ACCESS_TOKEN = rows[0].value.trim();
          }
        }
      } catch (dbErr) {
        console.error("[MP Webhook] Erro ao buscar token no banco:", dbErr);
      }
    }

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error("[MP Webhook] MERCADO_PAGO_ACCESS_TOKEN não encontrado.");
      return new Response(JSON.stringify({ error: "Access token missing" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Processar payload enviado pelo webhook do Mercado Pago
    // Mercado Pago pode enviar dados no query param (ex: topic=payment & id=...) ou no body JSON
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    let resourceId = url.searchParams.get("id");

    const bodyText = await req.text();
    console.log("[MP Webhook] Body recebido:", bodyText);

    let bodyJson: any = {};
    if (bodyText) {
      try {
        bodyJson = JSON.parse(bodyText);
      } catch (e) {
        console.warn("[MP Webhook] Falha ao parsear body como JSON:", e);
      }
    }

    // Se veio no body (notificações mais recentes do MP v2)
    const action = bodyJson.action;
    if (bodyJson.data && bodyJson.data.id) {
      resourceId = bodyJson.data.id;
    }
    const finalTopic = topic || bodyJson.type;

    console.log(`[MP Webhook] Notificação capturada - Tópico/Tipo: ${finalTopic}, ID: ${resourceId}, Ação: ${action}`);

    // Só processamos se o recurso for do tipo 'payment'
    if (resourceId && (finalTopic === "payment" || action?.includes("payment"))) {
      console.log(`[MP Webhook] Consultando detalhes do pagamento ${resourceId} no Mercado Pago...`);

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error(`[MP Webhook] Erro ao consultar pagamento ${resourceId} no MP:`, errText);
        return new Response(JSON.stringify({ error: "Failed to fetch payment details from MP" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const paymentData = await mpResponse.json();
      const status = paymentData.status; // 'approved', 'pending', 'rejected', etc.
      const metadata = paymentData.metadata || {};
      const amount = paymentData.transaction_amount;

      // Pegar email e plano através do metadado enviado na criação da preferência
      const payerEmail = metadata.payer_email || paymentData.payer?.email;
      const planId = (metadata.plan_id || "FAMILY").toUpperCase();

      console.log(`[MP Webhook] Detalhes do Pagamento: Status: ${status}, Email: ${payerEmail}, Plano: ${planId}, Valor: R$ ${amount}`);

      if (status === "approved" && payerEmail) {
        console.log(`[MP Webhook] Pagamento APROVADO para o e-mail: ${payerEmail}. Atualizando sistema...`);

        // 3. Buscar perfil do usuário no Supabase pelo email
        const userFetchUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(payerEmail.trim().toLowerCase())}&select=id,plan`;
        const profileResponse = await fetch(userFetchUrl, {
          headers: {
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          }
        });

        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          if (profiles && profiles.length > 0) {
            const userProfile = profiles[0];
            const userId = userProfile.id;

            console.log(`[MP Webhook] Usuário encontrado: ID ${userId}. Atualizando plano para ${planId}...`);

            // 4. Atualizar o plano na tabela 'profiles'
            const updateProfileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
            await fetch(updateProfileUrl, {
              method: "PATCH",
              headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                plan: planId,
                promo_active: false // Desativar promo/trial já que agora ele pagou o plano cheio
              })
            });

            // 5. Inserir ou atualizar na tabela 'payments'
            const payDate = new Date();
            const refMonth = `${(payDate.getMonth() + 1).toString().padStart(2, '0')}/${payDate.getFullYear()}`;

            // Verificar se já existe um pagamento registrado para este mês e usuário
            const checkPaymentUrl = `${supabaseUrl}/rest/v1/payments?user_id=eq.${userId}&reference_month=eq.${refMonth}&status=eq.PAID&select=id`;
            const checkPaymentRes = await fetch(checkPaymentUrl, {
              headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`
              }
            });

            let paymentExists = false;
            if (checkPaymentRes.ok) {
              const existingPayments = await checkPaymentRes.json();
              if (existingPayments && existingPayments.length > 0) {
                paymentExists = true;
              }
            }

            if (!paymentExists) {
              const insertPaymentUrl = `${supabaseUrl}/rest/v1/payments`;
              const insertRes = await fetch(insertPaymentUrl, {
                method: "POST",
                headers: {
                  "apikey": supabaseServiceKey,
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                  user_id: userId,
                  amount: amount,
                  due_date: payDate.toISOString().split('T')[0],
                  payment_date: payDate.toISOString(),
                  status: 'PAID',
                  reference_month: refMonth
                })
              });
              if (insertRes.ok) {
                console.log(`[MP Webhook] Pagamento mensalidade de ${refMonth} registrado para o usuário ${userId}.`);
              } else {
                console.error(`[MP Webhook] Falha ao registrar pagamento no banco:`, await insertRes.text());
              }
            } else {
              console.log(`[MP Webhook] Pagamento de ${refMonth} já estava registrado como pago.`);
            }

          } else {
            console.warn(`[MP Webhook] Nenhum usuário encontrado com o e-mail: ${payerEmail}`);
          }
        } else {
          console.error("[MP Webhook] Erro ao consultar perfis de usuário no banco de dados.");
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", message: "Notification processed" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("❌ Erro no webhook do Mercado Pago:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
