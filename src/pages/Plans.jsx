import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Zap, Crown, Star, Shield, CreditCard, TrendingUp, Package } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Planos disponíveis para contratação
const PLANS = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 'R$ 14,90',
    period: '/mês',
    icon: Shield,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    btnColor: 'bg-orange-600 text-white hover:bg-orange-700',
    stripe_price_id: 'price_1TMTcPKUpjZIh8bEpHw5lbfp',
    features: [
      'Até 6 anúncios simultâneos',
      'Anúncio dura 15 dias',
      'Excedente: R$ 4,99 por anúncio',
    ],
    overage: 'R$ 4,99 / anúncio extra',
  },
  {
    id: 'prata',
    name: 'Prata',
    price: 'R$ 29,90',
    period: '/mês',
    icon: Star,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    btnColor: 'bg-blue-600 text-white hover:bg-blue-700',
    stripe_price_id: 'price_1TMTcPKUpjZIh8bEpHw5lbfp',
    popular: true,
    features: [
      'Até 15 anúncios simultâneos',
      'Anúncio dura 30 dias',
      'Excedente: R$ 3,99 por anúncio',
      '1 disparo no ecossistema WhatsApp',
    ],
    overage: 'R$ 3,99 / anúncio extra',
  },
  {
    id: 'ouro',
    name: 'Ouro',
    price: 'R$ 49,90',
    period: '/mês',
    icon: Crown,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    btnColor: 'bg-amber-600 text-white hover:bg-amber-700',
    stripe_price_id: 'price_1TMTcQKUpjZIh8bEzssDEfHc',
    features: [
      'Anúncios ilimitados',
      'Anúncio dura 60 dias',
      'Sem custo excedente',
      '3 disparos WhatsApp (Seg, Qua, Sex)',
    ],
    overage: null,
  },
];

const PLAN_ORDER = ['gratis', 'bronze', 'prata', 'ouro'];

const PLAN_INFO = {
  gratis: { name: 'Grátis', limit: 2, days: 7, icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100' },
  bronze: { name: 'Bronze', limit: 6, days: 15, icon: Shield, color: 'text-orange-700', bg: 'bg-orange-100' },
  prata:  { name: 'Prata',  limit: 15, days: 30, icon: Star,   color: 'text-blue-700',   bg: 'bg-blue-100'   },
  ouro:   { name: 'Ouro',  limit: null, days: 60, icon: Crown,  color: 'text-amber-700',  bg: 'bg-amber-100'  },
};

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoadingAuth, sellerProfile, checkAppState } = useAuth();
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(false);

  const success = searchParams.get('success');
  const planId = searchParams.get('plan');
  const cancelled = searchParams.get('cancelled');

  // Contexto passado quando vem do fluxo de limite atingido
  const fromLimit = searchParams.get('from') === 'limit';
  const overageContext = searchParams.get('overage'); // preço avulso disponível

  const activationRef = React.useRef(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (success === 'true' && planId && isAuthenticated && user && !activationRef.current) {
      activationRef.current = true;
      activatePlan(planId);
    }
    if (cancelled === 'true' && !activationRef.current) {
      activationRef.current = true;
      toast.info("Pagamento cancelado.");
    }
  }, [success, planId, cancelled, user, isLoadingAuth, isAuthenticated]);

  const activatePlan = async (planIdToActivate) => {
    if (activating) return;
    setActivating(true);
    const data = {
      plan_type: planIdToActivate,
      plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan_started_at: new Date().toISOString(),
      owner_email: user.email,
    };
    if (sellerProfile) {
      await base44.entities.SellerProfile.update(sellerProfile.id, data);
    } else {
      await base44.entities.SellerProfile.create({
        ...data,
        seller_name: user.full_name || user.email,
        seller_type: 'Produtor',
      });
    }
    toast.success(`Plano ${planIdToActivate} ativado com sucesso! 🎉`);
    checkAppState();
    setActivating(false);
  };

  const handleSelectPlan = async (plan) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!plan.stripe_price_id) {
      await activatePlan(plan.id);
      navigate("/vender");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planId: plan.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/planos?success=true&plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/planos?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Erro ao iniciar pagamento.");
      }
    } catch {
      toast.error("Erro ao conectar com o Stripe.");
    }
    setLoading(false);
  };

  // ── Loading / activating states ──────────────────────────────────
  if (isLoadingAuth || (success === 'true' && activating)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{activating ? "Ativando seu plano..." : "Carregando..."}</p>
      </div>
    );
  }

  // ── Pagamento confirmado ─────────────────────────────────────────
  if (success === 'true' && !activating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2">Plano ativado! 🎉</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Seu plano <strong className="text-foreground">{planId?.toUpperCase()}</strong> foi ativado com sucesso.
        </p>
        <Button className="h-12 px-8 rounded-xl font-bold" onClick={() => navigate('/vender')}>
          Criar meu anúncio agora
        </Button>
        <button onClick={() => navigate('/meus-anuncios')} className="mt-3 text-sm text-muted-foreground underline">
          Ver meus anúncios
        </button>
      </div>
    );
  }

  const currentPlan = sellerProfile?.plan_type || 'gratis';
  const planInfo = PLAN_INFO[currentPlan] || PLAN_INFO['gratis'];
  const isSubscriber = currentPlan !== 'gratis';
  const planExpiry = sellerProfile?.plan_expiry ? new Date(sellerProfile.plan_expiry) : null;
  const planExpired = planExpiry && planExpiry < new Date();
  const hasActivePlan = isSubscriber && !planExpired;

  // Planos superiores ao atual
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  const upgradePlans = PLANS.filter(p => PLAN_ORDER.indexOf(p.id) > currentPlanIndex);

  // ── Assinante com plano ativo ────────────────────────────────────
  if (hasActivePlan && !fromLimit) {
    const PlanIcon = planInfo.icon;
    return (
      <div className="px-4 pt-5 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Minha assinatura</h1>
            <p className="text-xs text-muted-foreground">Plano atual e benefícios</p>
          </div>
        </div>

        {/* Plano ativo */}
        <div className={`rounded-3xl p-5 mb-6 border ${planInfo.bg} border-opacity-50`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${planInfo.bg}`}>
              <PlanIcon className={`h-7 w-7 ${planInfo.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plano ativo</p>
              <h2 className={`text-2xl font-black ${planInfo.color}`}>{planInfo.name}</h2>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">ATIVO</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/60 rounded-2xl p-3 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground">{planInfo.limit ?? '∞'}</p>
              <p className="text-[10px] text-muted-foreground">anúncios</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-3 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground">{planInfo.days} dias</p>
              <p className="text-[10px] text-muted-foreground">por anúncio</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground">
                {planExpiry ? planExpiry.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">renova em</p>
            </div>
          </div>
        </div>

        {/* Upgrade disponível */}
        {upgradePlans.length > 0 && (
          <>
            <p className="text-sm font-extrabold text-foreground mb-3">Fazer upgrade</p>
            <div className="space-y-3">
              {upgradePlans.map(plan => {
                const Icon = plan.icon;
                return (
                  <div key={plan.id} className={`relative bg-card border rounded-3xl p-5 ${plan.popular ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                        RECOMENDADO
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${plan.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-foreground">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground">{plan.features[0]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-foreground">{plan.price}</p>
                        <p className="text-[10px] text-muted-foreground">{plan.period.substring(1)}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={loading}
                      className={`w-full h-10 rounded-2xl font-bold text-sm ${plan.btnColor}`}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Fazer upgrade para ${plan.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {currentPlan === 'ouro' && (
          <div className="text-center py-8">
            <Crown className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="font-extrabold text-foreground">Você já tem o melhor plano!</p>
            <p className="text-sm text-muted-foreground mt-1">Aproveite todos os benefícios do plano Ouro.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Sem assinatura ativa ou vindo do fluxo de limite ──────────────
  // Filtra planos superiores ao atual se vier de limite atingido
  const plansToShow = fromLimit ? upgradePlans : PLANS;

  return (
    <div className="px-4 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            {fromLimit ? 'Limite atingido' : 'Planos e assinaturas'} <CreditCard className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            {fromLimit ? 'Escolha um plano superior ou pague avulso' : 'Escolha o plano ideal para o seu perfil'}
          </p>
        </div>
      </div>

      {/* Banner de limite atingido */}
      {fromLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">
              Você atingiu o limite do plano {planInfo.name}
            </p>
          </div>
          <p className="text-xs text-amber-700">
            Faça upgrade para publicar mais anúncios simultaneamente.
          </p>
        </div>
      )}

      {/* Plano grátis expirado ou cancelado */}
      {planExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-bold text-red-700">Seu plano {planInfo.name} expirou</p>
          <p className="text-xs text-red-600 mt-0.5">Renove ou escolha outro plano para continuar publicando.</p>
        </div>
      )}

      <div className="space-y-4 max-w-md mx-auto">
        {plansToShow.map(plan => {
          const Icon = plan.icon;
          return (
            <div key={plan.id} className={`relative bg-card border rounded-3xl p-5 ${plan.popular ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">MAIS POPULAR</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${plan.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">Assinatura mensal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-foreground">{plan.price}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">por mês</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              {plan.overage && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                  <p className="text-[10px] font-bold text-amber-700">⚡ Excedente: {plan.overage}</p>
                </div>
              )}

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading}
                className={`w-full h-11 rounded-2xl font-bold text-sm ${plan.btnColor}`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Assinar ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-6">
        Pagamento seguro via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  );
}