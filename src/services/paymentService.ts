
import { supabase } from '../lib/supabaseClient';

const SYSTEM_MP_ACCESS_TOKEN = 'APP_USR-2402733175170598-110815-ab4eb9842f819545d66055ec031c9554-2581348917';

export const PaymentService = {
  /**
   * Cria uma preferência de pagamento para os planos Family ou Premium.
   * Em produção, o window.location.origin mudará automaticamente para o seu domínio.
   */
  createPreference: async (planId: string, userEmail: string, userName: string, userPhone?: string) => {
    const plansDetails: Record<string, { title: string; price: number }> = {
      'FAMILY': { title: 'Plano Família - Atalaia', price: 39.90 },
      'PREMIUM': { title: 'Plano Prêmio - Atalaia', price: 79.90 }
    };

    const plan = plansDetails[planId];
    if (!plan) throw new Error('Plano inválido');

    // Remove espaços e caracteres especiais do telefone para o MP
    const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '';

    const preferenceData = {
      items: [
        {
          id: planId,
          title: plan.title,
          description: `Assinatura mensal do sistema Atalaia - Segurança Colaborativa`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: plan.price
        }
      ],
      payer: {
        email: userEmail,
        name: userName,
        phone: {
          area_code: cleanPhone.substring(2, 4),
          number: cleanPhone.substring(4)
        }
      },
      back_urls: {
        // Usamos o origin dinâmico. No portal do MP, você deve permitir este domínio.
        success: `${window.location.origin}/#/payment/success?plan=${planId}`,
        failure: `${window.location.origin}/#/dashboard`,
        pending: `${window.location.origin}/#/dashboard`
      },
      auto_return: 'approved',
      external_reference: `${userEmail}|${planId}`
    };

    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SYSTEM_MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[PaymentService] Erro API MP:', errorData);
        throw new Error(errorData.message || 'Falha ao criar preferência de pagamento.');
      }

      const data = await response.json();
      return data.init_point;
    } catch (error: any) {
      console.error('[PaymentService] Erro crítico:', error);
      // Fallback para evitar travamento da UI em ambiente de desenvolvimento sem internet ou com CORS block
      if (window.location.hostname === 'localhost') {
        console.warn("Ambiente local detectado: Redirecionando para sandbox de teste.");
        return `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=SANDBOX-TEST-${Date.now()}`;
      }
      throw error;
    }
  },

  /**
   * Cria uma preferência para doações destinadas ao Integrador do bairro.
   */
  createDonationPreference: async (amount: number, userEmail: string, userName: string, targetAccessToken: string) => {
      const preferenceData = {
          items: [
              {
                  title: 'Doação para Segurança Comunitária',
                  description: 'Contribuição voluntária para manutenção do sistema de monitoramento local.',
                  quantity: 1,
                  currency_id: 'BRL',
                  unit_price: amount
              }
          ],
          payer: {
              email: userEmail,
              name: userName
          },
          back_urls: {
              success: `${window.location.origin}/#/dashboard`,
              failure: `${window.location.origin}/#/dashboard`,
              pending: `${window.location.origin}/#/dashboard`
          },
          auto_return: 'approved'
      };

      try {
          const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${targetAccessToken}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(preferenceData)
          });

          if (!response.ok) {
              throw new Error('Não foi possível gerar o link de doação. Verifique as credenciais do integrador.');
          }

          const data = await response.json();
          return data.init_point;
      } catch (error: any) {
          console.error('[PaymentService] Erro ao criar doação:', error);
          throw error;
      }
  }
};
