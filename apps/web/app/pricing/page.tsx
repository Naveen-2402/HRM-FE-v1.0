"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Zap, Building2, Briefcase, 
  Loader2, ArrowRight 
} from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useCreateCheckoutSessionApiV1BillingCheckoutPost } from "@repo/orval-config/src/api/billing/billing";

// Define your pricing tiers. 
const PRICING_PLANS = [
  {
    name: "Basic",
    description: "Perfect for growing teams scaling their operations.",
    price: "Rs 999/-",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_MONTHLY_PRICE_ID,
    icon: Zap,
    features: [
      "Up to 50 employees",
      "Standard support",
      "Advanced reporting",
      "Custom roles"
    ],
    recommended: true,
  },
  {
    name: "Pro",
    description: "Advanced security and control for large organizations.",
    price: "Rs 2700/-",
    interval: "/quarter",
    priceId: process.env.NEXT_PUBLIC_QUARTERLY_PRICE_ID,
    icon: Building2,
    features: [
      "Unlimited employees",
      "24/7 priority support",
      "Single Sign-On (SSO)",
      "Custom integrations",
      "Dedicated account manager"
    ],
    recommended: false,
  },
  {
    name: "Enterprise",
    description: "Advanced security and control for large organizations.",
    price: "Rs 9000/-",
    interval: "/year",
    priceId: process.env.NEXT_PUBLIC_YEARLY_PRICE_ID,
    icon: Building2,
    features: [
      "Unlimited employees",
      "24/7 priority support",
      "Single Sign-On (SSO)",
      "Custom integrations",
      "Dedicated account manager"
    ],
    recommended: false,
  }
];

export default function OnboardingPricingPage() {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const checkoutMutation = useCreateCheckoutSessionApiV1BillingCheckoutPost();

  const handleSelectPlan = async (priceId: string) => {
    setProcessingPlanId(priceId);
    try {
      const response = await checkoutMutation.mutateAsync({ data: { price_id: priceId } });
      if (response.data.checkout_url) {
        // Redirect seamlessly to Stripe Checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error("Failed to initiate checkout. Please try again.");
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      
      {/* Minimalistic Header */}
      <header className="h-20 px-8 flex items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="size-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">HRM</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl"
        >
          {/* Page Titles */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Choose your plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Select the plan that fits your growing team. You can always change this later in your settings.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative flex flex-col bg-card transition-all ${
                  plan.recommended 
                    ? "border-primary ring-2 ring-primary shadow-xl" 
                    : "border-border shadow-sm hover:shadow-md hover:border-border/80"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="p-8 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${plan.recommended ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                      <plan.icon className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-card-foreground">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base text-muted-foreground min-h-[48px]">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6 flex items-baseline text-card-foreground">
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-2 text-base font-medium text-muted-foreground">{plan.interval}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 className="size-5 text-primary shrink-0 mr-3" />
                        <span className="text-base text-card-foreground leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="p-8 pt-0 mt-auto">
                  <Button 
                    onClick={() => handleSelectPlan(plan.priceId)}
                    disabled={checkoutMutation.isPending}
                    variant={plan.recommended ? "default" : "secondary"}
                    className={`w-full hover:cursor-pointer h-14 text-lg font-semibold ${
                      plan.recommended 
                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {processingPlanId === plan.priceId ? (
                      <><Loader2 className="mr-3 size-5 animate-spin" /> Preparing Checkout...</>
                    ) : (
                      <>
                        Select {plan.name} <ArrowRight className="ml-2 size-5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

        </motion.div>
      </main>

    </div>
  );
}