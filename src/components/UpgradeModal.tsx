
import React, { useState } from 'react';
import { Modal, Button, Card, Badge } from './UI';
import { Check, Shield, Star, Loader2 } from 'lucide-react';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/auth/context';
import { MockService } from '@/services/mockService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Estados do cupom para a tela principal (mantidos para retrocompatibilidade se necessário)
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [couponCodeIn, setCouponCodeIn] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // NOVOS ESTADOS PARA O POPUP EXCLUSIVO DE CUPOM (MUDANÇA DE REQUISITO)
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoCouponCode, setPromoCouponCode] = useState('');
  const [promoAppliedCoupon, setPromoAppliedCoupon] = useState<any>(null);
  const [promoCouponError, setPromoCouponError] = useState<string | null>(null);
  const [promoCouponSuccess, setPromoCouponSuccess] = useState<string | null>(null);
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!user) return;
    if (!couponCodeIn.trim()) {
      setCouponError("Por favor, digite o código do cupom.");
      return;
    }
    
    setIsValidating(true);
    setCouponError(null);
    setCouponSuccess(null);
    
    try {
      const res = await MockService.validateCoupon(couponCodeIn, user.id);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponSuccess(`Cupom ${res.coupon.code} aplicado! ${res.coupon.trialDays} dias por R$ ${res.coupon.promotionalPrice.toFixed(2).replace('.', ',')}.`);
      } else {
        setAppliedCoupon(null);
        setCouponError(res.message);
      }
    } catch (err) {
      console.error("Erro ao aplicar cupom:", err);
      setCouponError("Erro técnico ao validar o cupom.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyPromoCoupon = async () => {
    if (!user) return;
    if (!promoCouponCode.trim()) {
      setPromoCouponError("Por favor, digite o código do cupom.");
      return;
    }
    
    setIsPromoValidating(true);
    setPromoCouponError(null);
    setPromoCouponSuccess(null);
    
    try {
      const res = await MockService.validateCoupon(promoCouponCode.trim().toUpperCase(), user.id);
      if (res.success && res.coupon) {
        setPromoAppliedCoupon(res.coupon);
        setPromoCouponSuccess(`Cupom ${res.coupon.code} validado com sucesso!`);
      } else {
        setPromoAppliedCoupon(null);
        setPromoCouponError(res.message);
      }
    } catch (err) {
      console.error("Erro ao validar cupom promocional:", err);
      setPromoCouponError("Erro técnico ao validar o cupom.");
    } finally {
      setIsPromoValidating(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    if (!user) return;
    setLoading(planId);
    try {
      const activeCouponCode = appliedCoupon ? appliedCoupon.code : undefined;
      const checkoutUrl = await PaymentService.createPreference(
        planId,
        user.email,
        user.name,
        user.phone || '',
        activeCouponCode
      );
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      alert("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
    } finally {
      setLoading(null);
    }
  };

  const handlePromoCheckout = async () => {
    if (!user || !promoAppliedCoupon) return;
    setPromoLoading(true);
    try {
      // Abre a preferência diretamente no checkout com todas as vantagens do cupom de R$ 1,00
      const checkoutUrl = await PaymentService.createPreference(
        'FAMILY',
        user.email,
        user.name,
        user.phone || '',
        promoAppliedCoupon.code
      );
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Erro ao iniciar checkout promocional:", error);
      alert("Não foi possível iniciar o pagamento promocional.");
    } finally {
      setPromoLoading(false);
    }
  };

  const plans = [
    {
      id: 'FAMILY',
      title: 'Plano Família',
      price: '39,90',
      description: 'Ideal para sua casa e família',
      features: [
        'Acesso a todas as câmeras do bairro',
        'Chat em tempo real liberado',
        'Aviso de chegada e saída (Escolta)',
        'Rondas extras ilimitadas'
      ],
      color: 'yellow',
      icon: <Check className="text-yellow-500" size={16} />
    },
    {
      id: 'PREMIUM',
      title: 'Plano Prêmio',
      price: '79,90',
      description: 'O monitoramento mais completo',
      features: [
        'Todos os recursos do Plano Família',
        'Atalaia Móvel (Botão de Pânico 24h)',
        'Segurança dedicada via WhatsApp',
        'Prioridade máxima em ocorrências'
      ],
      color: 'green',
      icon: <Star className="text-atalaia-neon" size={16} />
    }
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 md:p-8">
        <div className="text-center mb-10">
          <Badge color="yellow" className="mb-4">⚡ Upgrade Necessário</Badge>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Desbloqueie o Atalaia</h2>
          <p className="text-gray-400 text-sm">Escolha o plano ideal para a sua segurança e a de seus familiares.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`p-6 flex flex-col h-full border-white/5 bg-white/5 hover:border-${plan.id === 'FAMILY' ? 'yellow-500/30' : 'atalaia-neon/30'} transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-white font-bold text-xl">{plan.title}</h3>
                   <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className={`p-2 rounded-lg ${plan.id === 'FAMILY' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-atalaia-neon/10 text-atalaia-neon'}`}>
                  {plan.id === 'FAMILY' ? <Shield size={20} /> : <Star size={20} />}
                </div>
              </div>

              <div className="mb-6">
                {appliedCoupon ? (
                  <div className="space-y-1">
                    <div className="text-[10px] text-atalaia-neon font-black uppercase tracking-wider bg-atalaia-neon/10 border border-atalaia-neon/20 px-2 py-0.5 rounded-md inline-block">
                      🏷️ Teste Pró Ativo
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-gray-500 text-sm line-through">R$ {plan.price}</span>
                      <span className="text-3xl font-black text-atalaia-neon">R$ {appliedCoupon.promotionalPrice.toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-400 text-xs font-mono">/ {appliedCoupon.trialDays} dias</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl font-black text-white">R$ {plan.price}</span>
                    <span className="text-gray-500 text-sm ml-1">/mês</span>
                  </>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className={plan.id === 'FAMILY' ? 'text-yellow-500 mt-0.5' : 'text-atalaia-neon mt-0.5'} size={14} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleCheckout(plan.id)}
                disabled={!!loading}
                className={`w-full h-12 uppercase font-black tracking-widest ${plan.id === 'FAMILY' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-atalaia-neon text-black'}`}
              >
                {loading === plan.id ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Processando...</>
                ) : (
                  <>Contratar Agora</>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Seção Cupom Promocional que abre o novo popup */}
        <div id="promo-coupon-section" className="mt-10 p-5 rounded-2xl bg-[#0a0a0a] border border-white/5 max-w-md mx-auto transition-all hover:border-yellow-500/20 shadow-lg">
          <button 
            id="btn-toggle-coupon"
            onClick={() => {
              setPromoCouponCode('');
              setPromoCouponError(null);
              setPromoCouponSuccess(null);
              setPromoAppliedCoupon(null);
              setIsPromoOpen(true);
            }} 
            className="w-full flex items-center justify-center gap-2 text-center text-xs text-yellow-500 hover:text-yellow-400 font-black transition-all uppercase tracking-widest cursor-pointer hover:underline outline-none"
          >
            🎟️ Tenho um cupom promocional
          </button>
        </div>

        <div className="mt-8 text-center">
           <button onClick={onClose} className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4">
             Continuar no plano Gratuito (Limitado)
           </button>
        </div>
      </div>
    </Modal>

    {/* NOVO POPUP DO CUPOM PROMOCIONAL PARA RESGATAR O PLANO DE 1 REAL */}
    <Modal isOpen={isPromoOpen} onClose={() => setIsPromoOpen(false)}>
      <div className="p-6 md:p-8">
        <div className="text-center mb-6">
          <Badge color="yellow" className="mb-3">🎟️ Cupom Promocional</Badge>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Desbloquear Plano de Teste</h2>
          <p className="text-gray-400 text-xs">Insira seu cupom ativo abaixo para desbloquear seu plano promocional de R$ 1,00 para checkin.</p>
        </div>

        {!promoAppliedCoupon ? (
          <div className="max-w-md mx-auto space-y-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 shadow-xl">
            <div className="space-y-1.5">
              <label htmlFor="promo-coupon-input-popup" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Código do Cupom de Desconto
              </label>
              <input
                id="promo-coupon-input-popup"
                type="text"
                placeholder="EX: TESTE7DIAS1REAL"
                value={promoCouponCode}
                onChange={(e) => setPromoCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyPromoCoupon();
                }}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-yellow-500/50 uppercase select-text"
                autoFocus
              />
            </div>

            <Button 
              id="btn-apply-promo-popup"
              onClick={handleApplyPromoCoupon}
              disabled={isPromoValidating}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-black text-xs uppercase h-11 tracking-wider"
            >
              {isPromoValidating ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Validando...</>
              ) : (
                "Validar e Desbloquear Plano"
              )}
            </Button>

            {promoCouponError && (
              <p id="popup-coupon-error" className="text-xs text-red-500 font-semibold text-center mt-1 animate-in fade-in duration-200">
                ❌ {promoCouponError}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            <div className="border border-atalaia-neon/20 bg-atalaia-neon/5 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-350 shadow-2xl">
              <span className="text-[10px] text-atalaia-neon font-black uppercase tracking-widest bg-atalaia-neon/10 border border-atalaia-neon/20 px-3 py-1 rounded-full inline-block mb-3 animate-pulse">
                🎉 Oferta Desbloqueada com Sucesso!
              </span>
              
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                Plano Teste Pró-Ativo
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Desfrute de monitoramento total por {promoAppliedCoupon.trialDays} dias com todas as funções desbloqueadas.
              </p>

              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/30 border border-white/5 mb-6">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valor no Checkout de Entrada</span>
                <span className="text-4xl font-black text-atalaia-neon mt-1">
                  R$ {Number(promoAppliedCoupon.promotionalPrice || 1.00).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-gray-400 mt-1 font-mono">Pago via Mercado Pago</span>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handlePromoCheckout}
                  disabled={promoLoading}
                  className="w-full h-12 bg-atalaia-neon hover:bg-[#33ff85] text-black uppercase font-black tracking-widest shadow-[0_0_15px_rgba(0,255,102,0.4)] transition-all"
                >
                  {promoLoading ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Redirecionando...</>
                  ) : (
                    <>Ir para o Pagamento (R$ {Number(promoAppliedCoupon.promotionalPrice || 1.00).toFixed(2).replace('.', ',')})</>
                  )}
                </Button>

                <button 
                  onClick={() => setPromoAppliedCoupon(null)}
                  className="text-xs text-gray-500 hover:text-white transition-colors underline mt-2"
                >
                  Usar outro cupom
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center border-t border-white/5 pt-4">
          <button 
            onClick={() => setIsPromoOpen(false)} 
            className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
          >
            Voltar aos Planos Principais
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
};
