
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

-- Grant permissions to roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

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
