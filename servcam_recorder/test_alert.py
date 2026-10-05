"""
ServCam - Script de Teste e Validação da Camada de Alertas
Permite testar envio para Whaticket/Evolution API/Z-API, regras de anti-flood e Supabase.
"""

import os
import sys
import time

# Adiciona o diretório raiz ao path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from servcam_recorder.alert_manager import enviar_alerta_whatsapp

def run_tests():
    print("=" * 70)
    print("🚀 SERVCAM - TESTE DA CAMADA DE ALERTAS INTELIGENTES")
    print("=" * 70)

    evento_teste_pessoa = {
        "servcam_id": "SERVCAM-001",
        "camera": "Entrada Principal",
        "evento_id": "test_evt_001",
        "tipo": "object_detected",
        "objeto": "person",
        "confidence": 0.92,
        "foto_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"
    }

    print("\n👉 [Teste 1] Enviando primeiro alerta (Pessoa - 92% de Confiança)...")
    res1 = enviar_alerta_whatsapp(evento_teste_pessoa, assincrono=False)
    print("Resultado Teste 1:", res1)

    print("\n👉 [Teste 2] Enviando evento IDÊNTICO logo em seguida (Testando Anti-Flood / Cooldown)...")
    res2 = enviar_alerta_whatsapp(evento_teste_pessoa, assincrono=False)
    print("Resultado Teste 2 (Deve descartar por Cooldown):", res2)

    print("\n👉 [Teste 3] Enviando evento de Baixa Confiança (Carro - 40% de Confiança)...")
    evento_baixa_confianca = {
        "servcam_id": "SERVCAM-001",
        "camera": "Entrada Principal",
        "evento_id": "test_evt_002",
        "tipo": "object_detected",
        "objeto": "car",
        "confidence": 0.40,
        "foto_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d"
    }
    res3 = enviar_alerta_whatsapp(evento_baixa_confianca, assincrono=False)
    print("Resultado Teste 3 (Deve descartar por Baixa Confiança):", res3)

    print("\n" + "=" * 70)
    print("✅ Bateria de testes concluída!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
