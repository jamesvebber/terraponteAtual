import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle2, Loader2, Zap, Shield } from "lucide-react";
import PlanSelection from "@/components/PlanSelection";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe('pk_test_51TMTVMKUpjZIh8bE7YnKa8KFJGFbQBx1s5lZ99rDCFNNLWUuGqMMcUybpLwzW9GGCEcc0MQJWk09dE9pXbi8gBfo00vXtPz5Ns');

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoadingAuth, sellerProfile, checkAppState } = useAuth();
  const [activating, setActivating] = useState(false);

  const success = searchParams.get('success');
  const planId = searchParams.get('plan');
  const cancelled = searchParams.get('cancelled');

  const activationRef = React.useRef(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    
    // Use a ref to ensure this effect only runs once per page load
    if (success === 'true' && planId && isAuthenticated && user && !activationRef.current) {
      activationRef.current = true;
      activatePlan(planId);
    }
    if (cancelled === 'true' && !activationRef.current) {
      activationRef.current = true;
      toast.info("Pagamento cancelado. Você pode tentar novamente.");
    }
  }, [success, planId, cancelled, user, isLoadingAuth, isAuthenticated]);

  const activatePlan = async (planIdToActivate) => {
    if (activating) return;
    setActivating(true);
    try {
      const data = {
        plan_type: planIdToActivate,
        plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_started_at: new Date().toISOString(),
        owner_email: user.email
      };

      if (sellerProfile) {
        await base44.entities.SellerProfile.update(sellerProfile.id, data);
      } else {
        await base44.entities.SellerProfile.create({
          ...data,
          seller_name: user.full_name || user.email,
          seller_type: 'Produtor'
        });
      }

      toast.success(`Plano ${planIdToActivate} ativado com sucesso! 🎉`);
      checkAppState();
    } catch (error) {
      console.error("Error activating plan:", error);
      toast.error("Erro ao ativar plano. Tente novamente.");
    } finally {
      setActivating(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    toast.info(`Selecionado: ${plan.name} - ${plan.price}`);
    
    if (!user) {
      toast.warning("Você precisa fazer login primeiro");
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!plan.stripe_price_id) {
      toast.info("Ativando plano gratuito...");
      await activatePlan(plan.id);
      navigate("/vender");
      return;
    }

    toast.info("Iniciando pagamento...");
    
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
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao conectar com o Stripe. Tente novamente.");
    }
  };

  if (success === 'true' && (isLoadingAuth || activating)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-extrabold text-foreground mb-2">
          {isLoadingAuth ? "Restaurando sua sessão..." : "Ativando seu plano..."}
        </h2>
        <p className="text-sm text-muted-foreground">Aguarde um momento.</p>
      </div>
    );
  }

  if (success === 'true' && !activating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2">Pagamento Confirmado! 🎉</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Seu plano <strong className="text-foreground">{planId?.toUpperCase()}</strong> foi ativado com sucesso.
        </p>
        <Button
          className="h-12 px-8 rounded-xl font-bold"
          onClick={() => navigate('/vender')}
        >
          Criar meu anúncio agora
        </Button>
        <button
          onClick={() => navigate('/profile')}
          className="mt-3 text-sm text-muted-foreground underline"
        >
          Ir para meu perfil
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Planos e Assinaturas <CreditCard className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Escolha o plano ideal para o seu perfil</p>
        </div>
      </div>

      {sellerProfile?.plan_type && sellerProfile.plan_type !== 'bronze' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">Plano de assinatura: {sellerProfile.plan_type.toUpperCase()}</p>
            <p className="text-xs text-green-600">Válido até {new Date(sellerProfile.plan_expiry).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <p className="text-sm font-bold text-blue-800">Assinatura Mensal</p>
        </div>
        <p className="text-xs text-blue-700">
          Ideal para quem anuncia frequentemente. Annúncios ficam automaticamente no seu plano.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <PlanSelection 
          currentType={sellerProfile?.seller_type === 'Loja' ? 'business' : 'producer'} 
          onSelect={handleSelectPlan} 
        />
      </div>
    </div>
  );
}
