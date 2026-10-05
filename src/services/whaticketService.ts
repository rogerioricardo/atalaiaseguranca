import { supabase } from '../lib/supabaseClient';
import { MockService } from './mockService';

export interface WhatsAppSendResult {
  target: string;
  success: boolean;
  error?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  results: WhatsAppSendResult[];
}

export const formatWhatsAppNumber = (rawNumber: string): string => {
  let clean = rawNumber.toString().trim();
  if (clean.includes('@g.us')) return clean;
  // O Whaticket / Ticketz espera apenas dígitos puros (sem @c.us) para contatos individuais
  clean = clean.replace('@c.us', '').replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  if (clean.startsWith('0') && (clean.length === 11 || clean.length === 12)) {
    clean = '55' + clean.substring(1);
  }
  return clean;
};

export const WhaticketService = {
  /**
   * Envia mensagem WhatsApp tentando primeiro via Proxy Local/Direto (com o token Whaticket atualizado),
   * e fallback para a Edge Function do Supabase.
   */
  sendMessage: async (
    message: string, 
    rawNumbers: string | string[], 
    overrideToken?: string,
    overrideUrl?: string
  ): Promise<WhatsAppSendResponse> => {
    const list = Array.isArray(rawNumbers) ? rawNumbers : [rawNumbers];
    const validTargets = list.map(formatWhatsAppNumber).filter(Boolean);

    if (validTargets.length === 0) {
      throw new Error("Nenhum número de telefone válido fornecido.");
    }

    const settings = await MockService.getSettings().catch(() => ({}));
    const token = overrideToken || (settings as any)['whaticket_token'] || "HSYumH8GyDXc90Bb1ZcBoVMBjatynktt";
    const apiKey = (settings as any)['whaticket_api_key'] || "Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp";

    // 1. Tentar primeiro via Edge Function Supabase (servidor direto para o Whaticket, sem bloqueio de navegador/proxy)
    try {
      const { data, error } = await supabase.functions.invoke('send-alert', {
        body: {
          message,
          numbers: validTargets,
          token,
          apiKey
        }
      });

      if (!error && data?.success) {
        console.log("[WhaticketService] Mensagem enviada com sucesso via Edge Function Supabase:", data);
        return {
          success: true,
          results: data?.results || validTargets.map(t => ({ target: t, success: true }))
        };
      }
      if (error) {
        console.warn("[WhaticketService] Edge Function falhou, tentando proxy local:", error.message);
      }
    } catch (edgeError) {
      console.warn("[WhaticketService] Erro ao invocar Edge Function, acionando proxy:", edgeError);
    }

    // 2. Fallback: Proxy local (/whaticket-proxy/api/messages/send)
    try {
      const results: WhatsAppSendResult[] = [];
      let anyProxySuccess = false;

      for (const target of validTargets) {
        try {
          const resp = await fetch('/whaticket-proxy/api/messages/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              ...(apiKey ? { 'apikey': apiKey } : {})
            },
            body: JSON.stringify({
              number: target,
              body: message
            })
          });

          const contentType = resp.headers.get('content-type') || '';
          // Garante que a resposta é JSON real do Whaticket (e não HTML do SPA index.html)
          if (resp.ok && contentType.includes('application/json')) {
            const json = await resp.json().catch(() => null);
            if (json && (json.mensagem || json.message || json.id)) {
              anyProxySuccess = true;
              results.push({ target, success: true });
              continue;
            }
          }
          
          const errText = await resp.text().catch(() => '');
          results.push({ target, success: false, error: errText || `HTTP ${resp.status}` });
        } catch (targetErr: any) {
          results.push({ target, success: false, error: targetErr?.message });
        }
      }

      return {
        success: anyProxySuccess,
        results
      };
    } catch (proxyError: any) {
      console.error("[WhaticketService] Falha em todos os canais de envio:", proxyError);
      return {
        success: false,
        results: validTargets.map(t => ({ target: t, success: false, error: proxyError?.message }))
      };
    }
  }
};
