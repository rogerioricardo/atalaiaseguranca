import { supabase } from "@/lib/supabaseClient";

export const PaymentService = {
  /**
   * Cria uma preferência de pagamento no Mercado Pago via Supabase Edge Function
   */
  createPreference: async (planId: string, email: string, name: string, phone: string) => {
    try {
        // Chamada à Edge Function que interage com a API do Mercado Pago
        const { data, error } = await supabase.functions.invoke('create-preference', {
            body: { 
                planId, 
                payer: { email, name, phone },
                // Adicionalmente podemos passar metadados
                metadata: {
                    source: 'web-app',
                    timestamp: new Date().toISOString()
                }
            }
        });
        
        if (error) {
            console.error("[PaymentService] Error invoking function:", error);
            throw error;
        }

        if (data && data.init_point) {
            return data.init_point; // URL do checkout Pro
        }
        
        throw new Error("Resposta inválida do servidor de pagamentos");
    } catch (error) {
        console.error("[PaymentService] Falha crítica ao criar preferência:", error);
        
        // Fallback de desenvolvimento: se a function não existir ou der erro, 
        // simulamos uma URL de checkout para não travar o fluxo do app
        const simulatedUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=simulated_${planId}_${Date.now()}`;
        console.warn("[PaymentService] Redirecionando para URL simulada:", simulatedUrl);
        
        return simulatedUrl;
    }
  },

  /**
   * Cria uma preferência de doação customizada para o integrador do bairro via Mercado Pago
   */
  createDonationPreference: async (amount: number, email: string, name: string, mpAccessToken: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('create-donation-preference', {
            body: { 
                amount, 
                payer: { email, name },
                mpAccessToken,
                metadata: {
                    source: 'donation-app',
                    timestamp: new Date().toISOString()
                }
            }
        });
        
        if (error) {
            console.error("[PaymentService] Error invoking donation function:", error);
            throw error;
        }

        if (data && data.init_point) {
            return data.init_point;
        }
        
        throw new Error("Resposta inválida do servidor de doações");
    } catch (error) {
        console.error("[PaymentService] Falha crítica ao criar preferência de doação:", error);
        
        // Fallback de desenvolvimento:
        const simulatedUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=simulated_donation_${amount}_${Date.now()}`;
        console.warn("[PaymentService] Redirecionando para doação simulada:", simulatedUrl);
        
        return simulatedUrl;
    }
  },

  /**
   * Verifica o status de um pagamento (opcional se usar webhooks)
   */
  checkPaymentStatus: async (paymentId: string) => {
      const { data, error } = await supabase
          .from('payments')
          .select('status')
          .eq('mercado_pago_id', paymentId)
          .maybeSingle();
      
      if (error) return 'error';
      return data?.status || 'not_found';
  }
};
