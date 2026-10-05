"""
ServCam Recorder - Driver de Envio WhatsApp Multi-Provedores
Suporta: Whaticket, Evolution API, Z-API e REST Genérico.
Funciona tanto com 'requests' quanto com a biblioteca padrão 'urllib.request'.
"""

import json
import logging
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

logger = logging.getLogger("ServCam.WhatsAppSender")


def format_whatsapp_number(raw_number: str) -> str:
    """
    Higieniza o número para o padrão internacional (E.164 sem símbolo +).
    Remove @c.us, espaços, traços e adiciona DDI 55 (Brasil) se tiver 10 ou 11 dígitos.
    """
    if not raw_number:
        return ""
    
    clean = str(raw_number).strip()
    
    # Se for ID de grupo do WhatsApp (@g.us), preserva
    if "@g.us" in clean:
        return clean
        
    # Remove sufixos e qualquer caractere não numérico
    clean = clean.replace("@c.us", "")
    clean = re.sub(r"\D", "", clean)
    
    # Remove zero inicial após o 55 (ex: 55048... -> 5548...)
    if clean.startswith("550") and len(clean) >= 12:
        clean = "55" + clean[3:]
        
    # Remove zero inicial nacional (ex: 048999... -> 48999...)
    if clean.startswith("0") and (len(clean) == 11 or len(clean) == 12):
        clean = clean[1:]
        
    # Adiciona 55 para números de 10 ou 11 dígitos (DDD + Número)
    if len(clean) in (10, 11):
        clean = "55" + clean
        
    return clean


class Tuple_Response:
    def __init__(self, status_code: int, text: str):
        self.status_code = status_code
        self.text = text

    def json(self):
        return json.loads(self.text)


def http_post_json(url: str, payload: dict, headers: dict, timeout: int = 15) -> Tuple_Response:
    """
    Função utilitária HTTP POST que funciona mesmo sem a biblioteca 'requests' instalada.
    """
    if HAS_REQUESTS:
        resp = requests.post(url, json=payload, headers=headers, timeout=timeout)
        return Tuple_Response(resp.status_code, resp.text)
    
    # Fallback usando urllib.request da biblioteca padrão do Python
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.getcode()
            body_text = response.read().decode("utf-8")
            return Tuple_Response(status_code, body_text)
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8") if e.fp else str(e)
        return Tuple_Response(e.code, body_text)
    except Exception as e:
        raise e


class WhatsAppSender:
    def __init__(
        self,
        provider: str = "whaticket",
        api_url: str = "",
        api_token: str = "",
        api_key: Optional[str] = None,
        instance: Optional[str] = None
    ):
        self.provider = (provider or "whaticket").lower().strip()
        self.api_url = (api_url or "").strip()
        self.api_token = (api_token or "").strip()
        self.api_key = (api_key or "").strip() if api_key else None
        self.instance = (instance or "default").strip()

    def send_message(self, number: str, message: str, foto_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Envia mensagem de texto e/ou imagem para o destinatário baseado no provedor configurado.
        """
        target = format_whatsapp_number(number)
        if not target:
            return {"success": False, "error": "Número de telefone inválido"}

        logger.info(f"[WhatsApp] Enviando via {self.provider.upper()} para {target}...")

        try:
            if self.provider == "whaticket":
                return self._send_whaticket(target, message, foto_url)
            elif self.provider in ("evolution", "evolution_api"):
                return self._send_evolution_api(target, message, foto_url)
            elif self.provider in ("zapi", "z_api"):
                return self._send_zapi(target, message, foto_url)
            else:
                return self._send_generic_rest(target, message, foto_url)
        except Exception as e:
            logger.error(f"[WhatsApp-Erro] Falha ao enviar para {target}: {str(e)}")
            return {"success": False, "error": str(e)}

    # -------------------------------------------------------------------------
    # 1. WHATICKET (Endpoint padrão: /api/messages/send)
    # -------------------------------------------------------------------------
    def _send_whaticket(self, target: str, message: str, foto_url: Optional[str]) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}"
        }
        if self.api_key:
            headers["apikey"] = self.api_key

        payload = {
            "number": target,
            "body": message
        }

        url = self.api_url or "https://app.whatendimento.digital/backend/api/messages/send"
        if not url.endswith("/messages/send"):
            url = url.rstrip("/") + "/api/messages/send"

        response = http_post_json(url, payload, headers, timeout=12)
        
        if response.status_code in (200, 201):
            try:
                res_data = response.json()
            except Exception:
                res_data = response.text
            return {"success": True, "provider": "whaticket", "response": res_data}
        else:
            return {"success": False, "provider": "whaticket", "status_code": response.status_code, "error": response.text}

    # -------------------------------------------------------------------------
    # 2. EVOLUTION API (Endpoints: /message/sendText ou /message/sendMedia)
    # -------------------------------------------------------------------------
    def _send_evolution_api(self, target: str, message: str, foto_url: Optional[str]) -> Dict[str, Any]:
        base_url = self.api_url.rstrip("/")
        headers = {
            "Content-Type": "application/json",
            "apikey": self.api_token or self.api_key or ""
        }

        if foto_url and foto_url.startswith("http"):
            url = f"{base_url}/message/sendMedia/{self.instance}"
            payload = {
                "number": target,
                "mediaMessage": {
                    "mediatype": "image",
                    "caption": message,
                    "media": foto_url
                }
            }
        else:
            url = f"{base_url}/message/sendText/{self.instance}"
            payload = {
                "number": target,
                "text": message
            }

        response = http_post_json(url, payload, headers, timeout=15)
        if response.status_code in (200, 201):
            return {"success": True, "provider": "evolution_api", "response": response.json()}
        else:
            return {"success": False, "provider": "evolution_api", "status_code": response.status_code, "error": response.text}

    # -------------------------------------------------------------------------
    # 3. Z-API (Endpoints: /send-text ou /send-image)
    # -------------------------------------------------------------------------
    def _send_zapi(self, target: str, message: str, foto_url: Optional[str]) -> Dict[str, Any]:
        base_url = self.api_url.rstrip("/")
        headers = {
            "Content-Type": "application/json",
            "Client-Token": self.api_token
        }

        if foto_url and foto_url.startswith("http"):
            url = f"{base_url}/send-image"
            payload = {
                "phone": target,
                "image": foto_url,
                "caption": message
            }
        else:
            url = f"{base_url}/send-text"
            payload = {
                "phone": target,
                "message": message
            }

        response = http_post_json(url, payload, headers, timeout=15)
        if response.status_code in (200, 201):
            return {"success": True, "provider": "z_api", "response": response.json()}
        else:
            return {"success": False, "provider": "z_api", "status_code": response.status_code, "error": response.text}

    # -------------------------------------------------------------------------
    # 4. REST GENÉRICO / WEBHOOK
    # -------------------------------------------------------------------------
    def _send_generic_rest(self, target: str, message: str, foto_url: Optional[str]) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        payload = {
            "number": target,
            "message": message,
            "foto_url": foto_url
        }

        response = http_post_json(self.api_url, payload, headers, timeout=12)
        if response.status_code in (200, 201):
            return {"success": True, "provider": "generic", "response": response.text}
        else:
            return {"success": False, "provider": "generic", "status_code": response.status_code, "error": response.text}
