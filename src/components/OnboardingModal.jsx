import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, ShoppingBag, PlusCircle, ChevronRight } from "lucide-react";

const STORAGE_KEY = "tp_onboarded_v1";

const STEPS = [
  {
    emoji: "🌾",
    title: "Bem-vindo ao TerraPonte!",
    subtitle: "O mercado do agro da sua região",
    description: "Compre, venda e encontre insumos perto de você — direto pelo WhatsApp.",
  },
  {
    icon: Store,
    color: "bg-primary/10 text-primary",
    title: "Mercado",
    subtitle: "Comprar e vender produtos",
    description: "Veja anúncios de gado, leite, hortifruti, máquinas e muito mais de produtores locais.",
  },
  {
    icon: ShoppingBag,
    color: "bg-accent/30 text-accent-foreground",
    title: "Insumos",
    subtitle: "Lojas e preços de insumos",
    description: "Compare preços de ração, adubo, sal mineral e outros insumos em lojas da sua região.",
  },
  {
    icon: PlusCircle,
    color: "bg-green-100 text-green-700",
    title: "Anunciar",
    subtitle: "Vender seu produto",
    description: "Publique um anúncio em segundos e receba contato direto dos compradores pelo WhatsApp.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={dismiss} />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl px-6 pt-6 pb-8 z-10"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center select-none"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Icon / Emoji */}
            <div className="flex justify-center mb-5">
              {current.emoji ? (
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <span className="text-5xl">{current.emoji}</span>
                </div>
              ) : (
                <div className={`h-20 w-20 rounded-3xl flex items-center justify-center ${current.color}`}>
                  <current.icon className="h-10 w-10" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-center mb-8">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{current.subtitle}</p>
              <h2 className="text-2xl font-extrabold text-foreground mb-3">{current.title}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{current.description}</p>
            </div>

            {/* Action */}
            <button
              onClick={next}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base flex items-center justify-center gap-2 select-none active:scale-[0.98] transition-transform"
            >
              {isLast ? "Começar agora" : "Próximo"}
              <ChevronRight className="h-5 w-5" />
            </button>

            {step > 0 && (
              <button onClick={dismiss} className="w-full mt-3 text-sm text-muted-foreground font-medium select-none">
                Pular
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}