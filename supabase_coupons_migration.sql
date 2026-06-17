-- =========================================================================
-- SCRIPT DE MIGRAÇÃO SQL SUPABASE: TABELA DE CUPONS PROMOCIONAIS E RASTREAMENTO
-- =========================================================================
-- Este script cria a tabela de cupons, insere o cupom padrão de simulação/teste,
-- e implementa regras/triggers para gerenciar a contagem de forma 100% segura
-- contra concorrência utilizando Row Locking (SELECT FOR UPDATE).
-- =========================================================================

-- 1. Certificar que a extensão UUID está habilitada no banco do Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da tabela de cupons promocionais
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    promotional_price NUMERIC(10,2) DEFAULT 1.00,
    trial_days INTEGER DEFAULT 7,
    max_uses INTEGER DEFAULT 1000,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserção do registro inicial padrão "TESTE7DIAS1REAL"
INSERT INTO coupons (code, active, promotional_price, trial_days, max_uses, used_count)
VALUES ('TESTE7DIAS1REAL', TRUE, 1.00, 7, 1000, 0)
ON CONFLICT (code) DO NOTHING;

-- 4. Configuração de Políticas de Segurança de Nível de Linha (RLS - Row Level Security)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Permite que qualquer usuário autenticado ou anônimo leia os cupons ativos para validação antes de pagar
DROP POLICY IF EXISTS "Permitir leitura pública de cupons" ON coupons;
CREATE POLICY "Permitir leitura pública de cupons" ON coupons 
    FOR SELECT 
    USING (active = TRUE);

-- Permite acesso completo (inserir, atualizar, deletar) para administradores ou serviços do sistema
DROP POLICY IF EXISTS "Acesso completo de serviço para cupons" ON coupons;
CREATE POLICY "Acesso completo de serviço para cupons" ON coupons 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Função/Procedure para incrementar com segurança em concorrência
CREATE OR REPLACE FUNCTION increment_coupon_use_safe(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_coupon_record RECORD;
BEGIN
    -- Seleciona travando a linha (FOR UPDATE) para prevenir condições de corrida sob múltiplos cadastros simultâneos
    SELECT * INTO v_coupon_record 
    FROM coupons 
    WHERE UPPER(code) = UPPER(TRIM(p_code)) 
    FOR UPDATE;

    -- Se o cupom não existir no banco
    IF NOT FOUND THEN
        RAISE WARNING 'Cupom não cadastrado no banco: %', p_code;
        RETURN FALSE;
    END IF;

    -- Se o cupom não estiver ativo
    IF NOT v_coupon_record.active THEN
        RAISE WARNING 'Cupom % está inativo.', p_code;
        RETURN FALSE;
    END IF;

    -- Se já atingiu o limite de utilizações permitido
    IF v_coupon_record.used_count >= v_coupon_record.max_uses THEN
        RAISE WARNING 'Limite de utilizações atingido para o cupom %.', p_code;
        RETURN FALSE;
    END IF;

    -- Incrementação segura e direta
    UPDATE coupons 
    SET used_count = used_count + 1 
    WHERE id = v_coupon_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger automático para rastrear e incrementar contagens a partir da tabela 'profiles'
CREATE OR REPLACE FUNCTION trg_track_profile_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Ação 1: Quando um novo cadastro é feito preenchendo o cupom promocional
    IF TG_OP = 'INSERT' THEN
        IF NEW.promo_coupon IS NOT NULL AND NEW.promo_coupon <> '' THEN
            PERFORM increment_coupon_use_safe(NEW.promo_coupon);
        END IF;
    
    -- Ação 2: Quando um usuário atualiza seu perfil com um novo cupom
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.promo_coupon IS DISTINCT FROM NEW.promo_coupon) AND (NEW.promo_coupon IS NOT NULL AND NEW.promo_coupon <> '') THEN
            PERFORM increment_coupon_use_safe(NEW.promo_coupon);
            
            -- Opcional: Se já existia um cupom anterior diferente, decrementa aquela contagem anterior
            IF OLD.promo_coupon IS NOT NULL AND OLD.promo_coupon <> '' THEN
                UPDATE coupons 
                SET used_count = GREATEST(0, used_count - 1) 
                WHERE UPPER(code) = UPPER(TRIM(OLD.promo_coupon));
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o trigger à tabela 'profiles' garantindo rastreamento centralizado automático
DROP TRIGGER IF EXISTS trg_profile_coupon_usage ON profiles;
CREATE TRIGGER trg_profile_coupon_usage
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trg_track_profile_coupon_usage();
