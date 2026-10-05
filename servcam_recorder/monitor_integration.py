"""
Exemplo de integração direta no arquivo:
/opt/servcam-recorder/ai/monitor.py

Este arquivo demonstra como plugar a camada de alertas no pipeline
de detecção do CodeProject.AI Server (YOLOv5).
"""

import os
import sys
import time
import uuid

# Adiciona o diretório raiz ao path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importa o módulo de alertas do ServCam
from servcam_recorder.alert_manager import enviar_alerta_whatsapp, enviar_evento_saas


def on_detection_callback(nome_camera: str, prediction: dict, frame_url: str):
    """
    Exemplo de callback chamado pelo YOLOv5 ao detectar objetos no frame.
    
    Estrutura típica do CodeProject.AI:
    prediction = {
        "label": "person",      # pessoa, car, motorcycle, dog, etc.
        "confidence": 0.92,     # 0.0 a 1.0
        "x_min": 100,
        "y_min": 50,
        ...
    }
    """
    objeto_detectado = prediction.get("label", "desconhecido")
    confianca = float(prediction.get("confidence", 0.0))
    id_evento = f"evt_{uuid.uuid4().hex[:12]}"

    # Monta o payload exatamente no formato atual do ServCam
    evento = {
        "servcam_id": "SERVCAM-001",
        "camera": nome_camera,
        "evento_id": id_evento,
        "tipo": "object_detected",
        "objeto": objeto_detectado,
        "confidence": confianca,
        "foto_url": frame_url
    }

    # 1. Opção Recomendada: Usar a função de alerta WhatsApp assíncrona (não trava a IA)
    print(f"[YOLOv5 Detection] {objeto_detectado.upper()} ({confianca:.2f}) na câmera {nome_camera}")
    enviar_alerta_whatsapp(evento, assincrono=True)

    # 2. Se você já chamava enviar_evento_saas(evento), pode continuar usando ela diretamente:
    # enviar_evento_saas(evento)


if __name__ == "__main__":
    print("Simulando detecção do CodeProject.AI...")
    teste_pred = {
        "label": "person",
        "confidence": 0.94
    }
    on_detection_callback(
        nome_camera="Entrada Principal",
        prediction=teste_pred,
        frame_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"
    )

    # Aguardar 3 segundos para a thread de background processar o envio
    time.sleep(3)
    print("Simulação concluída!")
