import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://nfbolgqsrpjqhpoplulf.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evento = await req.json().catch(() => ({}));
    const { servcam_id, camera, evento_id, tipo, objeto, confidence, foto_url } = evento;

    console.log(`[servcam-evento] Recebido: ${objeto} na câmera ${camera} (${confidence})`);

    // 1. Buscar cliente e regras
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('servcam_id', servcam_id || 'SERVCAM-001')
      .eq('ativo', true)
      .limit(1);

    const clienteId = clientes?.[0]?.id;

    // 2. Buscar usuários com WhatsApp ativo
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('telefone')
      .eq('cliente_id', clienteId)
      .eq('receber_whatsapp', true)
      .eq('ativo', true);

    const destinatarios = (usuarios || []).map((u: any) => u.telefone).filter(Boolean);
    const fallbackPhone = "5548992067665";
    const finalDestinatarios = destinatarios.length > 0 ? destinatarios : [fallbackPhone];

    // 3. Montar mensagem
    const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const confPorcento = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);
    
    const mensagem = `🚨 *ALERTA SERVCAM*\n\n📷 *Câmera:* ${camera}\n🎯 *Detectado:* ${objeto}\n📊 *Confiança:* ${confPorcento}%\n⏰ *Horário:* ${horario}\n\n🖼️ *Imagem:*\n${foto_url || 'Disponível no painel'}`;

    // 4. Disparar via Edge Function send-alert ou Whaticket direto
    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") || "HSYumH8GyDXc90Bb1ZcBoVMBjatynktt";
    const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY") || "Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp";

    let sendSuccess = false;
    for (const phone of finalDestinatarios) {
      try {
        const resp = await fetch("https://app.whatendimento.digital/backend/api/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
            ...(WHATSAPP_API_KEY ? { "apikey": WHATSAPP_API_KEY } : {})
          },
          body: JSON.stringify({
            number: phone,
            body: mensagem
          })
        });
        if (resp.ok) sendSuccess = true;
      } catch (err: any) {
        console.error(`Erro ao enviar para ${phone}:`, err.message);
      }
    }

    // 5. Gravar log em eventos_alerta
    await supabase.from('eventos_alerta').insert({
      servcam_id: servcam_id || 'SERVCAM-001',
      evento_origem_id: evento_id,
      nome_camera: camera || 'Câmera',
      tipo_evento: tipo || 'object_detected',
      objeto_detectado: objeto || 'desconhecido',
      confianca: confidence || 0.0,
      foto_url: foto_url,
      status: sendSuccess ? 'ENVIADO' : 'ERRO_ENVIO',
      destinatarios_telefones: finalDestinatarios,
      mensagem_enviada: mensagem,
      cliente_id: clienteId
    });

    return new Response(JSON.stringify({ success: sendSuccess, status: sendSuccess ? 'ENVIADO' : 'ERRO_ENVIO' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[servcam-evento] Erro fatal:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
