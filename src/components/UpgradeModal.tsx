
import React, { useState } from 'react';
import { Modal, Button, Card, Badge } from './UI';
import { Check, Shield, Star, Loader2 } from 'lucide-react';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/auth/context';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (!user) return;
    setLoading(planId);
    try {
      const checkoutUrl = await PaymentService.createPreference(
        planId,
        user.email,
        user.name,
        user.phone
      );
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      alert("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
    } finally {
      setLoading(null);
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
                <span className="text-3xl font-black text-white">R$ {plan.price}</span>
                <span className="text-gray-500 text-sm ml-1">/mês</span>
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

        <div className="mt-8 text-center">
           <button onClick={onClose} className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4">
             Continuar no plano Gratuito (Limitado)
           </button>
        </div>
      </div>
    </Modal>
  );
};
