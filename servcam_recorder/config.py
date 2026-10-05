"""
ServCam Recorder - Configurações Gerais
Localização recomendada: /opt/servcam-recorder/ai/config.py
"""

import os

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nfbolgqsrpjqhpoplulf.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYm9sZ3FzcnBqcWhwb3BsdWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTY1MTUsImV4cCI6MjA3OTY3MjUxNX0.VQU4KbW2rXHD3VrH5wfSb9_1nojQxQ5VK8h--bFofDk"
)

# Identificador da Unidade Gravadora ServCam
SERVCAM_ID = os.getenv("SERVCAM_ID", "SERVCAM-001")

# Configurações Padrão de WhatsApp (Fallback se não houver no banco)
WHATSAPP_PROVIDER = os.getenv("WHATSAPP_PROVIDER", "whaticket")  # 'whaticket', 'evolution_api', 'z_api', 'generic'
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://app.whatendimento.digital/backend/api/messages/send")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "HSYumH8GyDXc90Bb1ZcBoVMBjatynktt")
WHATSAPP_API_KEY = os.getenv("WHATSAPP_API_KEY", "Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp")
WHATSAPP_INSTANCE = os.getenv("WHATSAPP_INSTANCE", "default")

# Telefone de emergência padrão (caso o banco não responda)
WHATSAPP_DEFAULT_PHONE = os.getenv("WHATSAPP_DEFAULT_PHONE", "5548992067665")

# Configurações de Anti-Flood & Rate Limiting (Padrão)
DEFAULT_COOLDOWN_SECONDS = int(os.getenv("DEFAULT_COOLDOWN_SECONDS", "60"))  # 1 minuto entre detecções iguais
DEFAULT_MAX_ALERTS_PER_HOUR = int(os.getenv("DEFAULT_MAX_ALERTS_PER_HOUR", "30")) # Máximo 30 alertas/hora por câmera
DEFAULT_MIN_CONFIDENCE = float(os.getenv("DEFAULT_MIN_CONFIDENCE", "0.60")) # Confiança mínima de 60%

# Caminho para armazenamento de logs locais
LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "/var/log/servcam_alerts.log")
