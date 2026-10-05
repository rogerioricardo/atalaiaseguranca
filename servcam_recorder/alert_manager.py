"""
ServCam Recorder - Gerenciador Central de Alertas Inteligentes
Integração com Supabase, Filtros de IA (YOLOv5), Cooldown Anti-Flood e WhatsApp.
Compatível com 'requests' e com a biblioteca nativa 'urllib.request'.
"""

import datetime
import json
import logging
import queue
import threading
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

from .config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    SERVCAM_ID,
    WHATSAPP_PROVIDER,
    WHATSAPP_API_URL,
    WHATSAPP_TOKEN,
    WHATSAPP_API_KEY,
    WHATSAPP_INSTANCE,
    WHATSAPP_DEFAULT_PHONE,
    DEFAULT_COOLDOWN_SECONDS,
    DEFAULT_MAX_ALERTS_PER_HOUR,
    DEFAULT_MIN_CONFIDENCE,
    LOG_FILE_PATH,
)
from .whatsapp_sender import WhatsAppSender

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ServCam] %(message)s"
)
logger = logging.getLogger("ServCam.AlertManager")


def _http_get_json(url: str, headers: dict, timeout: int = 5) -> Tuple[int, Any]:
    if HAS_REQUESTS:
        try:
            r = requests.get(url, headers=headers, timeout=timeout)
            return r.status_code, r.json() if r.text else []
        except Exception as e:
            return 500, str(e)

    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return resp.getcode(), data
    except Exception as e:
        return 500, str(e)


def _http_post_json(url: str, payload: dict, headers: dict, timeout: int = 5) -> Tuple[int, Any]:
    if HAS_REQUESTS:
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=timeout)
            return r.status_code, r.json() if r.text and r.status_code != 204 else {}
        except Exception as e:
            return 500, str(e)

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
            return resp.getcode(), data
    except Exception as e:
        return 500, str(e)


class ServCamAlertManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ServCamAlertManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return

        self._initialized = True
        self.queue: queue.Queue = queue.Queue(maxsize=1000)
        
        # Controle de Repetição (Anti-Flood): (camera, objeto) -> timestamp_ultimo_envio
        self._cooldown_cache: Dict[Tuple[str, str], float] = {}
        
        # Limite de Alertas por Câmera por Hora: camera -> [timestamps dos últimos envios]
        self._hourly_camera_alerts: Dict[str, List[float]] = {}
        
        # Cache local das configurações de clientes e câmeras (TTL: 5 minutos)
        self._config_cache: Dict[str, Any] = {}
        self._config_cache_timestamp: float = 0.0
        self._cache_ttl = 300.0 # 5 minutos

        # Iniciar thread trabalhadora em background para não travar o loop de IA
        self._worker_thread = threading.Thread(target=self._process_queue_loop, daemon=True)
        self._worker_thread.start()
        logger.info("🚀 [ServCam AlertManager] Fila assíncrona iniciada com sucesso.")

    # -------------------------------------------------------------------------
    # API PÚBLICA PARA O MONITOR.PY
    # -------------------------------------------------------------------------
    def enfileirar_evento(self, evento: Dict[str, Any]) -> bool:
        """
        Adiciona o evento na fila para processamento em background (não bloqueia a IA).
        """
        try:
            self.queue.put_nowait(evento)
            return True
        except queue.Full:
            logger.warning("⚠️ [ServCam AlertManager] Fila cheia! Evento descartado.")
            return False

    def enviar_alerta_whatsapp(self, evento: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executa a validação das regras e o envio da mensagem WhatsApp.
        Pode ser chamada de forma síncrona ou pelo worker da fila.
        """
        camera = evento.get("camera", "Câmera Desconhecida")
        objeto = str(evento.get("objeto", "")).lower().strip()
        confidence = float(evento.get("confidence", 0.0))
        foto_url = evento.get("foto_url", "")
        evento_id = evento.get("evento_id", f"evt_{int(time.time()*1000)}")

        logger.info(f"🔍 [Processando Evento] Câmera: {camera} | Objeto: {objeto} | Confiança: {confidence:.2f}")

        # 1. Normalização de objetos detectados (YOLOv5 / CodeProject.AI)
        objeto_normalizado = self._normalizar_objeto(objeto)
        if not objeto_normalizado:
            logger.debug(f"ℹ️ Objeto ignorado: {objeto}")
            return {"status": "IGNORADO_OBJETO", "objeto": objeto}

        # 2. Carregar configurações do cliente e câmera no Supabase
        config_data = self._obter_configuracoes_cliente(camera, objeto_normalizado)
        cliente = config_data.get("cliente")
        regras = config_data.get("regras", {})
        usuarios = config_data.get("usuarios", [])
        wa_config = config_data.get("whatsapp_config", {})

        confianca_minima = regras.get("confianca_minima", DEFAULT_MIN_CONFIDENCE)
        cooldown_segundos = regras.get("cooldown_segundos", DEFAULT_COOLDOWN_SECONDS)
        limite_hora = regras.get("limite_por_hora", DEFAULT_MAX_ALERTS_PER_HOUR)

        # 3. Validação de Confiança da IA
        if confidence < confianca_minima:
            logger.info(f"🚫 [Baixa Confiança] {objeto_normalizado} em {camera}: {confidence:.2f} < {confianca_minima:.2f}")
            self._registrar_evento_supabase(
                evento=evento,
                status="DESCARTADO_CONFIANCA",
                objeto=objeto_normalizado,
                destinatarios=[],
                mensagem=None,
                cliente_id=cliente.get("id") if cliente else None
            )
            return {"status": "DESCARTADO_CONFIANCA", "confidence": confidence}

        # 4. Controle de Repetição (Anti-Flood / Cooldown por Câmera + Objeto)
        agora = time.time()
        cache_key = (camera, objeto_normalizado)
        ultimo_envio = self._cooldown_cache.get(cache_key, 0.0)
        
        if (agora - ultimo_envio) < cooldown_segundos:
            tempo_restante = int(cooldown_segundos - (agora - ultimo_envio))
            logger.info(f"⏳ [Anti-Flood Cooldown] {objeto_normalizado} em {camera}: aguarde {tempo_restante}s.")
            self._registrar_evento_supabase(
                evento=evento,
                status="DESCARTADO_COOLDOWN",
                objeto=objeto_normalizado,
                destinatarios=[],
                mensagem=None,
                cliente_id=cliente.get("id") if cliente else None
            )
            return {"status": "DESCARTADO_COOLDOWN", "tempo_restante": tempo_restante}

        # 5. Limite de Alertas por Câmera por Hora
        if not self._verificar_limite_horario_camera(camera, limite_hora):
            logger.warning(f"🛑 [Limite Horário] Câmera {camera} atingiu o limite de {limite_hora} alertas/hora.")
            self._registrar_evento_supabase(
                evento=evento,
                status="DESCARTADO_LIMITE_HORA",
                objeto=objeto_normalizado,
                destinatarios=[],
                mensagem=None,
                cliente_id=cliente.get("id") if cliente else None
            )
            return {"status": "DESCARTADO_LIMITE_HORA"}

        # 6. Filtrar destinatários habilitados a receber WhatsApp
        destinatarios = [u["telefone"] for u in usuarios if u.get("receber_whatsapp") and u.get("telefone")]
        if not destinatarios:
            destinatarios = [WHATSAPP_DEFAULT_PHONE] if WHATSAPP_DEFAULT_PHONE else []

        if not destinatarios:
            logger.warning(f"⚠️ [Destinatários] Nenhum usuário com WhatsApp ativo para a câmera {camera}")
            return {"status": "SEM_DESTINATARIOS"}

        # 7. Montar mensagem formatada
        mensagem = self._formatar_mensagem(
            template=wa_config.get("template_mensagem"),
            camera=camera,
            objeto=objeto_normalizado.capitalize(),
            confidence=int(confidence * 100) if confidence <= 1.0 else int(confidence),
            foto_url=foto_url
        )

        # 8. Instanciar driver de envio WhatsApp
        sender = WhatsAppSender(
            provider=wa_config.get("provedor") or WHATSAPP_PROVIDER,
            api_url=wa_config.get("api_url") or WHATSAPP_API_URL,
            api_token=wa_config.get("api_token") or WHATSAPP_TOKEN,
            api_key=wa_config.get("api_key") or WHATSAPP_API_KEY,
            instance=wa_config.get("instancia") or WHATSAPP_INSTANCE
        )

        # 9. Executar disparos para os destinatários
        resultados = []
        destinatarios_sucesso = []
        for tel in destinatarios:
            res = sender.send_message(tel, mensagem, foto_url)
            resultados.append(res)
            if res.get("success"):
                destinatarios_sucesso.append(tel)

        sucesso_geral = len(destinatarios_sucesso) > 0
        status_final = "ENVIADO" if sucesso_geral else "ERRO_ENVIO"

        # 10. Atualizar cache de anti-flood se enviado com sucesso
        if sucesso_geral:
            self._cooldown_cache[cache_key] = time.time()
            self._registrar_envio_camera(camera)
            logger.info(f"✅ [Alerta Disparado] {objeto_normalizado} em {camera} para {len(destinatarios_sucesso)} contatos.")
        else:
            logger.error(f"❌ [Falha de Disparo] Erro ao enviar WhatsApp para {destinatarios}.")

        # 11. Registrar log do evento no Supabase
        self._registrar_evento_supabase(
            evento=evento,
            status=status_final,
            objeto=objeto_normalizado,
            destinatarios=destinatarios_sucesso if sucesso_geral else destinatarios,
            mensagem=mensagem,
            resposta_api=resultados,
            cliente_id=cliente.get("id") if cliente else None
        )

        return {
            "status": status_final,
            "destinatarios": destinatarios_sucesso,
            "detalhes": resultados
        }

    # -------------------------------------------------------------------------
    # FUNÇÕES INTERNAS DE SUPORTE
    # -------------------------------------------------------------------------
    def _process_queue_loop(self):
        """Loop contínuo consumindo da fila assíncrona."""
        while True:
            try:
                evento = self.queue.get(timeout=2.0)
                self.enviar_alerta_whatsapp(evento)
                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Erro no worker de alertas: {e}")

    def _normalizar_objeto(self, raw_label: str) -> Optional[str]:
        """Converte rótulos do YOLOv5/CodeProject.AI para os padrões do ServCam."""
        label = raw_label.lower().strip()
        
        if label in ("person", "pessoa", "human", "pedestre"):
            return "pessoa"
        elif label in ("car", "carro", "automobile", "veiculo", "truck", "caminhao", "bus", "onibus"):
            return "carro"
        elif label in ("motorcycle", "moto", "motocicleta", "bicycle", "bicicleta"):
            return "moto"
        elif label in ("dog", "cat", "animal", "cachorro", "gato", "bird", "passaro", "cavalo", "horse"):
            return "animal"
        elif "suspeito" in label or "movimento" in label or "motion" in label:
            return "movimento suspeito"
            
        return None

    def _formatar_mensagem(self, template: Optional[str], camera: str, objeto: str, confidence: int, foto_url: str) -> str:
        """Monta o texto do alerta usando template customizado ou o padrão ServCam."""
        horario = datetime.datetime.now().strftime("%H:%M")
        data = datetime.datetime.now().strftime("%d/%m/%Y")

        if not template:
            template = (
                "🚨 *ALERTA SERVCAM*\n\n"
                "📷 *Câmera:* {camera}\n"
                "🎯 *Detectado:* {objeto}\n"
                "📊 *Confiança:* {confidence}%\n"
                "⏰ *Horário:* {horario}\n\n"
                "🖼️ *Imagem:*\n{foto_url}"
            )

        msg = template
        msg = msg.replace("{camera}", camera)
        msg = msg.replace("{objeto}", objeto)
        msg = msg.replace("{confidence}", str(confidence))
        msg = msg.replace("{horario}", horario)
        msg = msg.replace("{data}", data)
        msg = msg.replace("{foto_url}", foto_url or "Não disponível")

        return msg

    def _verificar_limite_horario_camera(self, camera: str, limite_por_hora: int) -> bool:
        """Verifica se a câmera não estourou o limite de alertas no intervalo de 1 hora."""
        agora = time.time()
        uma_hora_atras = agora - 3600.0

        if camera not in self._hourly_camera_alerts:
            self._hourly_camera_alerts[camera] = []

        # Remove envios mais antigos que 1 hora
        self._hourly_camera_alerts[camera] = [
            t for t in self._hourly_camera_alerts[camera] if t > uma_hora_atras
        ]

        return len(self._hourly_camera_alerts[camera]) < limite_por_hora

    def _registrar_envio_camera(self, camera: str):
        """Registra o timestamp do envio atual na janela horária."""
        if camera not in self._hourly_camera_alerts:
            self._hourly_camera_alerts[camera] = []
        self._hourly_camera_alerts[camera].append(time.time())

    # -------------------------------------------------------------------------
    # INTEGRAÇÃO SUPABASE REST
    # -------------------------------------------------------------------------
    def _obter_configuracoes_cliente(self, camera_nome: str, objeto: str) -> Dict[str, Any]:
        """Consulta as tabelas do Supabase (com cache em memória)."""
        agora = time.time()
        cache_key = f"{camera_nome}_{objeto}"

        if (agora - self._config_cache_timestamp) < self._cache_ttl and cache_key in self._config_cache:
            return self._config_cache[cache_key]

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        try:
            # 1. Buscar cliente pelo SERVCAM_ID
            code, clientes = _http_get_json(
                f"{SUPABASE_URL}/rest/v1/clientes?servcam_id=eq.{SERVCAM_ID}&ativo=eq.true&select=*",
                headers=headers,
                timeout=5
            )
            cliente = clientes[0] if (code == 200 and isinstance(clientes, list) and clientes) else {}
            cliente_id = cliente.get("id")

            # 2. Buscar usuários que recebem alertas
            usuarios = []
            if cliente_id:
                code_usr, usr_data = _http_get_json(
                    f"{SUPABASE_URL}/rest/v1/usuarios?cliente_id=eq.{cliente_id}&ativo=eq.true&receber_whatsapp=eq.true&select=*",
                    headers=headers,
                    timeout=5
                )
                if code_usr == 200 and isinstance(usr_data, list):
                    usuarios = usr_data

            # 3. Buscar configurações WhatsApp
            wa_config = {}
            if cliente_id:
                code_wa, wa_data = _http_get_json(
                    f"{SUPABASE_URL}/rest/v1/whatsapp_config?cliente_id=eq.{cliente_id}&ativo=eq.true&select=*",
                    headers=headers,
                    timeout=5
                )
                if code_wa == 200 and isinstance(wa_data, list) and wa_data:
                    wa_config = wa_data[0]

            # 4. Buscar regras de alerta para esta câmera e objeto
            regras = {
                "confianca_minima": DEFAULT_MIN_CONFIDENCE,
                "cooldown_segundos": DEFAULT_COOLDOWN_SECONDS,
                "limite_por_hora": DEFAULT_MAX_ALERTS_PER_HOUR
            }
            if cliente_id:
                code_regras, regras_data = _http_get_json(
                    f"{SUPABASE_URL}/rest/v1/regras_alerta?cliente_id=eq.{cliente_id}&tipo_objeto=in.({objeto},*)&ativo=eq.true&select=*",
                    headers=headers,
                    timeout=5
                )
                if code_regras == 200 and isinstance(regras_data, list) and regras_data:
                    r = regras_data[0]
                    regras["confianca_minima"] = float(r.get("confianca_minima", DEFAULT_MIN_CONFIDENCE))
                    regras["cooldown_segundos"] = int(r.get("cooldown_segundos", DEFAULT_COOLDOWN_SECONDS))
                    regras["limite_por_hora"] = int(r.get("limite_por_hora", DEFAULT_MAX_ALERTS_PER_HOUR))

            resultado = {
                "cliente": cliente,
                "usuarios": usuarios,
                "whatsapp_config": wa_config,
                "regras": regras
            }

            self._config_cache[cache_key] = resultado
            self._config_cache_timestamp = agora
            return resultado

        except Exception as e:
            logger.error(f"Erro ao buscar configurações no Supabase: {e}")
            # Fallback seguro com configurações locais
            return {
                "cliente": {"servcam_id": SERVCAM_ID},
                "usuarios": [{"telefone": WHATSAPP_DEFAULT_PHONE, "receber_whatsapp": True}],
                "whatsapp_config": {},
                "regras": {
                    "confianca_minima": DEFAULT_MIN_CONFIDENCE,
                    "cooldown_segundos": DEFAULT_COOLDOWN_SECONDS,
                    "limite_por_hora": DEFAULT_MAX_ALERTS_PER_HOUR
                }
            }

    def _registrar_evento_supabase(
        self,
        evento: Dict[str, Any],
        status: str,
        objeto: str,
        destinatarios: List[str],
        mensagem: Optional[str],
        resposta_api: Optional[Any] = None,
        cliente_id: Optional[str] = None
    ):
        """Grava log na tabela eventos_alerta do Supabase."""
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        payload = {
            "servcam_id": evento.get("servcam_id", SERVCAM_ID),
            "evento_origem_id": evento.get("evento_id", ""),
            "nome_camera": evento.get("camera", "Câmera"),
            "tipo_evento": evento.get("tipo", "object_detected"),
            "objeto_detectado": objeto,
            "confianca": float(evento.get("confidence", 0.0)),
            "foto_url": evento.get("foto_url", ""),
            "status": status,
            "destinatarios_telefones": destinatarios,
            "mensagem_enviada": mensagem,
            "resposta_api": resposta_api,
            "cliente_id": cliente_id
        }

        try:
            _http_post_json(
                f"{SUPABASE_URL}/rest/v1/eventos_alerta",
                payload=payload,
                headers=headers,
                timeout=5
            )
        except Exception as e:
            logger.warning(f"Não foi possível salvar eventos_alerta no Supabase: {e}")


# =============================================================================
# FUNÇÃO DE INTERFACE GLOBAL (Drop-in para monitor.py)
# =============================================================================
_alert_manager = ServCamAlertManager()

def enviar_alerta_whatsapp(evento: Dict[str, Any], assincrono: bool = True) -> Dict[str, Any]:
    """
    Função principal requisitada pelo usuário.
    
    Uso:
        enviar_alerta_whatsapp(evento, assincrono=True)   # Não bloqueia IA (Recomendado)
        enviar_alerta_whatsapp(evento, assincrono=False)  # Envia e aguarda retorno
    """
    if assincrono:
        sucesso = _alert_manager.enfileirar_evento(evento)
        return {"status": "ENFILEIRADO", "sucesso": sucesso}
    else:
        return _alert_manager.enviar_alerta_whatsapp(evento)


def enviar_evento_saas(evento: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mantém 100% de compatibilidade com a função legada do /opt/servcam-recorder/ai/monitor.py.
    Envia para o Supabase e dispara o alerta WhatsApp simultaneamente.
    """
    enviar_alerta_whatsapp(evento, assincrono=True)

    try:
        url = f"{SUPABASE_URL}/functions/v1/servcam-evento"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        code, data = _http_post_json(url, evento, headers, timeout=5)
        return data if code == 200 else {"status": "ok", "local_processed": True}
    except Exception as e:
        logger.debug(f"Edge function servcam-evento ignorada ou indisponível: {e}")
        return {"status": "ok", "local_processed": True}
