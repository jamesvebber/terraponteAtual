import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Crown, Store, Building, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

const PRODUCER_PLANS = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 'Grátis',
    period: '',
    subtitle: 'Por tempo ilimitado',
    icon: Shield,
    stripe_price_id: null,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    btnColor: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    features: [
      '1 anúncio por vez',
      'Expira em 15 dias',
      'Disparo em até 5 grupos locais',
      'Visibilidade básica',
    ]
  },
  {
    id: 'prata',
    name: 'Prata',
    price: 'R$ 19,90',
    period: '/mês',
    subtitle: 'Assinatura mensal',
    icon: Zap,
    stripe_price_id: 'price_1TMTcPKUpjZIh8bEpHw5lbfp',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    btnColor: 'bg-blue-600 text-white hover:bg-blue-700',
    popular: true,
    features: [
      'Até 2 anúncios simultâneos',
      'Validade de 30 dias',
      '1 disparo no ecossistema WhatsApp',
      'Destaque no feed',
    ]
  },
  {
    id: 'ouro',
    name: 'Ouro',
    price: 'R$ 39,90',
    period: '/mês',
    subtitle: 'Assinatura mensal',
    icon: Crown,
    stripe_price_id: 'price_1TMTcQKUpjZIh8bEzssDEfHc',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    btnColor: 'bg-amber-600 text-white hover:bg-amber-700',
    features: [
      'Anúncios ilimitados',
      'Destaque no Radar do Dia',
      '3 disparos WhatsApp (Seg, Qua, Sex)',
      '🏆 Selo "Vendedor Verificado"',
    ]
  }
];

const BUSINESS_PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 'R$ 149',
    period: '/mês',
    icon: Store,
    stripe_price_id: 'price_1TMTcQKUpjZIh8bEz88wXa7Z',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    btnColor: 'bg-slate-600 text-white hover:bg-slate-700',
    features: [
      'Até 10 anúncios ativos',
      '5 disparos mensais zap',
      'Link para catálogo da loja',
      'Suporte via WhatsApp'
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 'R$ 299',
    period: '/mês',
    icon: Building,
    stripe_price_id: 'price_1TMTcRKUpjZIh8bEmSvamEHG',
    color: 'bg-primary/10 text-primary border-primary/20',
    btnColor: 'bg-primary text-primary-foreground hover:bg-primary/90',
    popular: true,
    features: [
      'Anúncios ilimitados',
      '15 disparos mensais zap',
      'Estatísticas de performance',
      'Suporte premium 24h'
    ]
  },
  {
    id: 'master',
    name: 'Master',
    price: 'R$ 599',
    period: '/mês',
    icon: Crown,
    stripe_price_id: 'price_1TMTcSKUpjZIh8bEdHwvKd4X',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    btnColor: 'bg-purple-600 text-white hover:bg-purple-700',
    features: [
      'Tudo do Business',
      'Banner de destaque regional',
      'Prioridade total no suporte',
      'Integração de estoque'
    ]
  }
];

export default function PlanSelection({ currentType = 'producer', onSelect }) {
  const [tab, setTab] = useState(currentType);
  const [loading, setLoading] = useState(null);

  const plans = tab === 'producer' ? PRODUCER_PLANS : BUSINESS_PLANS;

  const handleSelect = async (plan) => {
    setLoading(plan.id);
    try {
      // Logic for Stripe integration will go here
      if (onSelect) await onSelect(plan);
      toast.success(`Iniciando processo para plano ${plan.name}`);
    } catch (error) {
      toast.error("Erro ao processar plano. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex p-1 bg-muted rounded-2xl">
        <button
          onClick={() => setTab('producer')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${tab === 'producer' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          INDIVIDUAL
        </button>
        <button
          onClick={() => setTab('business')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${tab === 'business' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          PARA EMPRESAS
        </button>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-card border rounded-3xl p-5 flex flex-col gap-4 transition-all hover:border-primary/50 group select-none ${plan.popular ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-[10px] rounded-full">
                  MAIS POPULAR
                </Badge>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${plan.color}`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">Plano individual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-foreground">{plan.price}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{plan.period ? plan.period.substring(1) : 'permanente'}</p>
              </div>
            </div>

            <div className="space-y-2.5 py-4 border-y border-border/50">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleSelect(plan)}
              disabled={loading !== null}
              className={`w-full h-12 rounded-2xl font-black text-sm transition-all group-active:scale-[0.98] ${plan.btnColor}`}
            >
              {loading === plan.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Selecionar {plan.name}</>
              )}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
        Pagamento seguro via Stripe. Cancele ou altere seu plano a qualquer momento pelo painel de controle.
      </p>
    </div>
  );
}