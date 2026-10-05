-- ============================================================================
-- SERVCAM - ARQUITETURA DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Camada de Alertas Inteligentes & Integração WhatsApp
-- ============================================================================

-- Habilitar extensão para geração de UUIDs se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: CLIENTES (Condomínios, Empresas, Residências)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servcam_id VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'SERVCAM-001'
    nome VARCHAR(150) NOT NULL,
    documento VARCHAR(20), -- CPF ou CNPJ
    endereco TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA: USUARIOS (Moradores, Síndicos, Operadores, Administradores)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(30) NOT NULL, -- Formato: 5548999999999 (com DDI e DDD)
    cargo VARCHAR(50) DEFAULT 'morador', -- 'admin', 'sindico', 'seguranca', 'morador'
    receber_whatsapp BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA: CAMERAS (Dispositivos monitorados pelo ServCam Recorder)
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    servcam_id VARCHAR(50) NOT NULL, -- Link para o gravador local
    identificador_camera VARCHAR(100) NOT NULL, -- Nome ou ID da câmera no recorder (ex: 'Entrada Principal')
    nome_exibicao VARCHAR(100) NOT NULL,
    rtsp_url TEXT,
    localizacao VARCHAR(100), -- Ex: 'Portão Social', 'Garagem Subsolo'
    sensibilidade_padrao NUMERIC(4,2) DEFAULT 0.60, -- 60% de confiança mínima padrão
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_camera_cliente UNIQUE (cliente_id, identificador_camera)
);

-- 4. TABELA: WHATSAPP_CONFIG (Configuração da API de Envio por Cliente ou Global)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    provedor VARCHAR(30) NOT NULL DEFAULT 'whaticket', -- 'whaticket', 'evolution_api', 'z_api', 'rest_generico'
    api_url VARCHAR(255) NOT NULL, -- Ex: 'https://app.whatendimento.digital/backend/api/messages/send'
    api_token TEXT NOT NULL,       -- Bearer Token / API Key / Session Token
    api_key TEXT,                 -- Chave secundária para APIs que requerem (ex: Evolution API)
    instancia VARCHAR(100),       -- Nome da instância (Evolution API / Z-API)
    template_mensagem TEXT DEFAULT '🚨 *ALERTA SERVCAM*\n\n📷 *Câmera:* {camera}\n🎯 *Detectado:* {objeto}\n📊 *Confiança:* {confidence}%\n⏰ *Horário:* {horario}\n\n🖼️ *Imagem:* {foto_url}',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA: REGRAS_ALERTA (Filtros por câmera, tipo de objeto, horários e limites)
CREATE TABLE IF NOT EXISTS public.regras_alerta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo_objeto VARCHAR(50) NOT NULL, -- 'pessoa', 'carro', 'moto', 'animal', 'movimento_suspeito', '*' (todos)
    confianca_minima NUMERIC(4,2) DEFAULT 0.65, -- Ex: 0.65 = 65% de confiança mínima do YOLOv5
    cooldown_segundos INT DEFAULT 60, -- Tempo mínimo entre alertas do mesmo objeto na mesma câmera (Anti-flood)
    limite_por_hora INT DEFAULT 20, -- Limite máximo de mensagens por hora nesta câmera
    horario_inicio TIME DEFAULT '00:00:00', -- Para disparar apenas em horários específicos (ex: 22:00 até 06:00)
    horario_fim TIME DEFAULT '23:59:59',
    dias_semana INT[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Domingo, 1=Segunda, etc.
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA: EVENTOS_ALERTA (Auditoria, Logs e Histórico de Disparos)
CREATE TABLE IF NOT EXISTS public.eventos_alerta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
    servcam_id VARCHAR(50) NOT NULL,
    evento_origem_id VARCHAR(100), -- ID gerado no /opt/servcam-recorder
    nome_camera VARCHAR(100) NOT NULL,
    tipo_evento VARCHAR(50) DEFAULT 'object_detected',
    objeto_detectado VARCHAR(50) NOT NULL,
    confianca NUMERIC(4,2) NOT NULL,
    foto_url TEXT,
    status VARCHAR(30) NOT NULL, -- 'ENVIADO', 'DESCARTADO_COOLDOWN', 'DESCARTADO_RECON', 'ERRO_ENVIO', 'HORARIO_INATIVO'
    destinatarios_telefones TEXT[], -- Lista de números que receberam
    resposta_api JSONB, -- Retorno bruto do Whaticket/Evolution/Z-API
    mensagem_enviada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES DE PERFORMANCE PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_clientes_servcam_id ON public.clientes(servcam_id);
CREATE INDEX IF NOT EXISTS idx_cameras_servcam_camera ON public.cameras(servcam_id, identificador_camera);
CREATE INDEX IF NOT EXISTS idx_regras_camera_objeto ON public.regras_alerta(camera_id, tipo_objeto, ativo);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON public.eventos_alerta(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_camera_status ON public.eventos_alerta(nome_camera, status, created_at DESC);

-- POLÍTICAS RLS (Row Level Security) - SEGURANÇA BÁSICA
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_alerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_alerta ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura e Escrita Públicas para Chave Anon/Service (Ajustar conforme permissões)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acesso público por service_role ou anon clientes" ON public.clientes;
    CREATE POLICY "Acesso público por service_role ou anon clientes" ON public.clientes FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso público por service_role ou anon usuarios" ON public.usuarios;
    CREATE POLICY "Acesso público por service_role ou anon usuarios" ON public.usuarios FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso público por service_role ou anon cameras" ON public.cameras;
    CREATE POLICY "Acesso público por service_role ou anon cameras" ON public.cameras FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso público por service_role ou anon whatsapp_config" ON public.whatsapp_config;
    CREATE POLICY "Acesso público por service_role ou anon whatsapp_config" ON public.whatsapp_config FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso público por service_role ou anon regras_alerta" ON public.regras_alerta;
    CREATE POLICY "Acesso público por service_role ou anon regras_alerta" ON public.regras_alerta FOR ALL USING (true);

    DROP POLICY IF EXISTS "Acesso público por service_role ou anon eventos_alerta" ON public.eventos_alerta;
    CREATE POLICY "Acesso público por service_role ou anon eventos_alerta" ON public.eventos_alerta FOR ALL USING (true);
END $$;

-- ============================================================================
-- DADOS INICIAIS DE TESTE / EXEMPLO
-- ============================================================================
INSERT INTO public.clientes (servcam_id, nome, documento)
VALUES ('SERVCAM-001', 'Condomínio Residencial Atalaia', '12.345.678/0001-99')
ON CONFLICT (servcam_id) DO NOTHING;

-- Configuração padrão do WhatsApp (Whaticket já com credenciais ativas)
INSERT INTO public.whatsapp_config (cliente_id, provedor, api_url, api_token, template_mensagem)
SELECT id, 'whaticket', 'https://app.whatendimento.digital/backend/api/messages/send', 'HSYumH8GyDXc90Bb1ZcBoVMBjatynktt',
'🚨 *ALERTA SERVCAM*

📷 *Câmera:* {camera}
🎯 *Detectado:* {objeto}
📊 *Confiança:* {confidence}%
⏰ *Horário:* {horario}

🖼️ *Imagem:*
{foto_url}'
FROM public.clientes WHERE servcam_id = 'SERVCAM-001'
LIMIT 1;

-- Câmera de Teste
INSERT INTO public.cameras (cliente_id, servcam_id, identificador_camera, nome_exibicao, localizacao)
SELECT id, 'SERVCAM-001', 'Entrada Principal', 'Entrada Principal - Portão Social', 'Acesso Frontal'
FROM public.clientes WHERE servcam_id = 'SERVCAM-001'
ON CONFLICT (cliente_id, identificador_camera) DO NOTHING;

-- Usuário Administrador para receber alertas
INSERT INTO public.usuarios (cliente_id, nome, email, telefone, cargo, receber_whatsapp)
SELECT id, 'Central de Segurança', 'seguranca@atalaia.com', '5548992067665', 'admin', true
FROM public.clientes WHERE servcam_id = 'SERVCAM-001'
LIMIT 1;

-- Regras de Alerta para a Câmera (Pessoa, Carro, Moto, Animal com Cooldown de 60s)
INSERT INTO public.regras_alerta (camera_id, cliente_id, tipo_objeto, confianca_minima, cooldown_segundos, limite_por_hora)
SELECT c.id, cl.id, 'pessoa', 0.60, 60, 30
FROM public.cameras c
JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE cl.servcam_id = 'SERVCAM-001' AND c.identificador_camera = 'Entrada Principal';

INSERT INTO public.regras_alerta (camera_id, cliente_id, tipo_objeto, confianca_minima, cooldown_segundos, limite_por_hora)
SELECT c.id, cl.id, 'carro', 0.65, 60, 30
FROM public.cameras c
JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE cl.servcam_id = 'SERVCAM-001' AND c.identificador_camera = 'Entrada Principal';

INSERT INTO public.regras_alerta (camera_id, cliente_id, tipo_objeto, confianca_minima, cooldown_segundos, limite_por_hora)
SELECT c.id, cl.id, 'moto', 0.65, 60, 30
FROM public.cameras c
JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE cl.servcam_id = 'SERVCAM-001' AND c.identificador_camera = 'Entrada Principal';

INSERT INTO public.regras_alerta (camera_id, cliente_id, tipo_objeto, confianca_minima, cooldown_segundos, limite_por_hora)
SELECT c.id, cl.id, 'animal', 0.70, 120, 20
FROM public.cameras c
JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE cl.servcam_id = 'SERVCAM-001' AND c.identificador_camera = 'Entrada Principal';
