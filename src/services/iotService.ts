
import { supabase } from '../lib/supabaseClient';
import { IoTDevice } from '../types';

export const IoTService = {
  /**
   * Envia um comando para um dispositivo via IFTTT Webhook através da Edge Function
   */
  async toggleDevice(device: IoTDevice, action: 'on' | 'off'): Promise<{ success: boolean; status?: string }> {
    try {
      console.log(`[IoTService] Iniciando comando: ${device.name} -> ${action}`);
      
      // Chamamos a função ewelink-control (que agora usa IFTTT)
      const { data, error } = await supabase.functions.invoke('ewelink-control', {
        body: { 
          deviceId: device.deviceId, // Nome do evento IFTTT
          action: action 
        }
      });

      // Erro de infraestrutura do Supabase (ex: timeout real, função não implantada ou rede)
      if (error) {
        console.error("[IoTService] Erro de rede/infraestrutura Supabase:", error);
        throw new Error("Não foi possível conectar ao servidor de automação. Verifique se a Edge Function está implantada.");
      }

      // Se a função retornou, mas com erro lógico interno (que agora retornamos com 200)
      if (!data || data.success === false) {
        const errorMsg = data?.error || "O servidor de automação encontrou um problema interno.";
        console.error("[IoTService] Falha na execução da lógica:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`✅ [IoTService] Sucesso: ${data.message}`);
      return { 
        success: true, 
        status: action 
      };
      
    } catch (err: any) {
      console.error("[IoTService] Erro capturado no serviço:", err.message);
      // Repassamos apenas a mensagem limpa para a UI
      throw new Error(err.message);
    }
  },

  /**
   * Busca dispositivos IoT vinculados ao bairro no banco de dados
   */
  async getDevicesByNeighborhood(neighborhoodId: string): Promise<IoTDevice[]> {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('neighborhood_id', neighborhoodId);

      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
        neighborhoodId: d.neighborhood_id,
        deviceId: d.device_id
      }));
    } catch (e: any) {
      console.warn("[IoTService] Erro ao carregar dispositivos:", e.message);
      return [];
    }
  }
};
