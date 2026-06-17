
-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE BAIRROS
CREATE TABLE IF NOT EXISTS neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    iframe_url TEXT,
    camera_url TEXT 
);

-- 3. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'RESIDENT',
    plan TEXT DEFAULT 'FREE',
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    photo_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    approved BOOLEAN DEFAULT FALSE,
    mp_public_key TEXT,
    mp_access_token TEXT,
    promo_active BOOLEAN DEFAULT FALSE,
    promo_start TIMESTAMP WITH TIME ZONE,
    promo_end TIMESTAMP WITH TIME ZONE,
    promo_coupon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 TABELA DE CUPONS PROMOCIONAIS
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    promotional_price DECIMAL(10,2) DEFAULT 1.00,
    trial_days INTEGER DEFAULT 7,
    max_uses INTEGER DEFAULT 1000,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO coupons (code, active, promotional_price, trial_days, max_uses, used_count)
VALUES ('TESTE7DIAS1REAL', TRUE, 1.00, 7, 1000, 0)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tudo em coupons" ON coupons;
CREATE POLICY "Tudo em coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

-- 4. TABELA DE CONFIGURAÇÕES (TEMPLATES DE MENSAGENS)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE CÂMERAS ADICIONAIS
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    iframe_code TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    location_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE TICKETS DE SUPORTE
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
    user_name TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE PAGAMENTOS / MENSALIDADES
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDING', -- 'PAID', 'PENDING', 'OVERDUE'
    reference_month TEXT, -- e.g. '04/2025'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Grant permissions to roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Políticas para support_tickets
DROP POLICY IF EXISTS "Tudo em support_tickets" ON support_tickets;
CREATE POLICY "Tudo em support_tickets" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

-- Políticas para payments
DROP POLICY IF EXISTS "Tudo em payments" ON payments;
CREATE POLICY "Tudo em payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Políticas para system_settings
DROP POLICY IF EXISTS "Leitura pública" ON system_settings;
CREATE POLICY "Leitura pública" ON system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserção pública" ON system_settings;
CREATE POLICY "Inserção pública" ON system_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Atualização pública" ON system_settings;
CREATE POLICY "Atualização pública" ON system_settings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Deleção pública" ON system_settings;
CREATE POLICY "Deleção pública" ON system_settings FOR DELETE USING (true);

-- Políticas para outras tabelas
DROP POLICY IF EXISTS "Tudo em bairros" ON neighborhoods;
CREATE POLICY "Tudo em bairros" ON neighborhoods FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Tudo em cameras" ON cameras;
CREATE POLICY "Tudo em cameras" ON cameras FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Tudo em perfis" ON profiles;
CREATE POLICY "Tudo em perfis" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 7. TRIGGER DE PERFIL REFORÇADO PARA ADMIN/INTEGRADOR
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    role_from_meta TEXT;
    approved_from_meta BOOLEAN;
BEGIN
  -- Extrai o papel do metadado bruto se existir
  role_from_meta := COALESCE(new.raw_user_meta_data->>'role', 'RESIDENT');
  
  -- Se for ADMIN ou RESIDENT, já nasce aprovado
  IF role_from_meta = 'ADMIN' OR role_from_meta = 'RESIDENT' THEN
    approved_from_meta := TRUE;
  ELSE
    approved_from_meta := FALSE;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, approved, neighborhood_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    role_from_meta,
    approved_from_meta,
    (new.raw_user_meta_data->>'neighborhood_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. TABELA DE CONTROLE DE SESSÕES (ANTI-COMPARTILHAMENTO DE CONTAS)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tudo em user_sessions" ON user_sessions;
CREATE POLICY "Tudo em user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);

-- 11. TABELA DE BIOMETRIA FACIAL (TENSORFLOW.JS / BLAZEFACE)
CREATE TABLE IF NOT EXISTS user_facial_biometrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    descriptor TEXT NOT NULL, -- Vetor biométrico serializado em JSON
    photo_base64 TEXT, -- Snapshot visual opcional do rosto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_facial_biometrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tudo em user_facial_biometrics" ON user_facial_biometrics;
CREATE POLICY "Tudo em user_facial_biometrics" ON user_facial_biometrics FOR ALL USING (true) WITH CHECK (true);


