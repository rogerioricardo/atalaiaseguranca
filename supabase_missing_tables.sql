-- Tabela de alertas (botão de pânico)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de logs de ronda
CREATE TABLE IF NOT EXISTS patrol_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    note TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    user_name TEXT,
    user_role TEXT,
    text TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações in-app
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    message TEXT,
    data JSONB,
    from_user_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações de serviço (escolta, ronda extra, viagem)
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    user_name TEXT,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS genéricas (desbloqueadas para o MVP)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tudo em alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE patrol_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tudo em patrol_logs" ON patrol_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tudo em chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tudo em notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tudo em service_requests" ON service_requests FOR ALL USING (true) WITH CHECK (true);
