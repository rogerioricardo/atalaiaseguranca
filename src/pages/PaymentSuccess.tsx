
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { MockService } from '../services/mockService';
import { Card, Button } from '../components/UI';
import { CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase, isRealSupabase } from '@/lib/supabaseClient';

const PaymentSuccess: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const rawPlanId = searchParams.get('plan');
  const couponCode = searchParams.get('coupon');
  const planId = (couponCode || (rawPlanId && rawPlanId.toUpperCase() === 'PROMO')) ? 'FAMILY' : (rawPlanId || 'FAMILY').toUpperCase();

  useEffect(() => {
      const processPayment = async () => {
          if (!user) {
              setLoading(false);
              return;
          }

          try {
              // 1. Determinar o preço do plano contratado
              let amount = planId === 'PREMIUM' ? 79.90 : 39.90;
              const payDate = new Date();
              const refMonth = `${(payDate.getMonth() + 1).toString().padStart(2, '0')}/${payDate.getFullYear()}`;

              if (couponCode || (rawPlanId && rawPlanId.toUpperCase() === 'PROMO')) {
                  const activeCoupon = couponCode || 'TESTE7DIAS1REAL';
                  const validateRes = await MockService.validateCoupon(activeCoupon, user.id);
                  if (validateRes.success && validateRes.coupon) {
                      amount = validateRes.coupon.promotionalPrice;
                      const startDate = new Date();
                      const endDate = new Date();
                      endDate.setDate(startDate.getDate() + validateRes.coupon.trialDays);

                      if (isRealSupabase) {
                          await supabase.from('profiles').update({
                              plan: 'FAMILY',
                              promo_active: true,
                              promo_start: startDate.toISOString(),
                              promo_end: endDate.toISOString(),
                              promo_coupon: validateRes.coupon.code
                          }).eq('id', user.id);
                      }

                      const cachedStr = localStorage.getItem(`atalaia_local_profile_${user.id}`);
                      if (cachedStr) {
                         try {
                             const parsed = JSON.parse(cachedStr);
                             parsed.plan = 'FAMILY';
                             parsed.promoActive = true;
                             parsed.promoStart = startDate.toISOString();
                             parsed.promoEnd = endDate.toISOString();
                             parsed.promoCoupon = validateRes.coupon.code;
                             localStorage.setItem(`atalaia_local_profile_${user.id}`, JSON.stringify(parsed));
                         } catch (e) {}
                      }

                      await MockService.incrementCouponUses(validateRes.coupon.code);
                  } else {
                      await MockService.updateUserPlan(user.id, 'FAMILY');
                  }
              } else {
                  await MockService.updateUserPlan(user.id, planId);
              }

              // 3. Registrar o pagamento na tabela 'payments' do Supabase para atualizar o Painel Financeiro
              // Evita duplicatas se o usuário recarregar a tela de sucesso
              const { data: existingPayments } = await supabase
                  .from('payments')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('reference_month', refMonth)
                  .eq('status', 'PAID')
                  .limit(1);

              if (!existingPayments || existingPayments.length === 0) {
                  await supabase
                      .from('payments')
                      .insert([{
                          user_id: user.id,
                          amount,
                          due_date: payDate.toISOString().split('T')[0],
                          payment_date: payDate.toISOString(),
                          status: 'PAID',
                          reference_month: refMonth
                      }]);
              }

              setSuccess(true);
              
              // Recarregar a página após 3 segundos para atualizar o AuthContext
              setTimeout(() => {
                  window.location.href = '/#/dashboard';
                  window.location.reload();
              }, 3000);
          } catch (error) {
              console.error("Erro ao processar pagamento:", error);
          } finally {
              setLoading(false);
          }
      };

      processPayment();
  }, [user, planId, couponCode]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-atalaia-neon/30 bg-atalaia-neon/5">
            {loading ? (
                <div className="flex flex-col items-center">
                    <Loader2 size={48} className="text-atalaia-neon animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-white">Processando Assinatura...</h2>
                    <p className="text-gray-400 text-sm mt-2">Estamos confirmando seu pagamento.</p>
                </div>
            ) : success ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h2>
                    <p className="text-gray-300 mb-6">
                        Seu plano <strong>{planId === 'FAMILY' ? 'Família' : 'Prêmio'}</strong> foi ativado com sucesso.
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Redirecionando para o painel...</p>
                    <Button onClick={() => { window.location.href = '/#/dashboard'; window.location.reload(); }}>
                        Ir para o Painel Agora
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <ShieldCheck size={48} className="text-gray-500 mb-4" />
                    <h2 className="text-xl font-bold text-white">Verificando...</h2>
                    <p className="text-gray-400 mb-4">Não foi possível confirmar automaticamente.</p>
                    <Button onClick={() => navigate('/dashboard')}>
                        Voltar ao Dashboard
                    </Button>
                </div>
            )}
        </Card>
    </div>
  );
};

export default PaymentSuccess;
