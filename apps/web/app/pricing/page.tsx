"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  CheckCircle2, Zap, Building2, Briefcase, 
  Loader2, ArrowRight, ShieldCheck, HelpCircle, Clock
} from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useCreateCheckoutSessionApiV1BillingCheckoutPost, useCreateTrialApiV1BillingTrialPost } from "@repo/orval-config/src/api/billing/billing";
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";

// Staggered animation container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

// Function to map API plans to UI format
const mapPlansToUI = (plansData: any[]) => {
  if (!plansData) return [];

  // Filter only subscription plans
  const subscriptionPlans = plansData.filter((plan: any) => plan.type === 'subscription');

  // Find prices for each plan type
  const monthlyPlan = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'month' && p.interval_count === 1)
  );
  const quarterlyPlan = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'month' && p.interval_count === 3)
  );
  const yearlyPlan = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'year')
  );

  const monthlyPrice = monthlyPlan?.prices?.find((p: any) => p.interval === 'month' && p.interval_count === 1);
  const quarterlyPrice = quarterlyPlan?.prices?.find((p: any) => p.interval === 'month' && p.interval_count === 3);
  const yearlyPrice = yearlyPlan?.prices?.find((p: any) => p.interval === 'year');

  return [
    {
      name: "Free Trial",
      description: "Experience the full power of our platform firsthand. No credit card required.",
      price: "Rs 0",
      interval: "/24 hours",
      priceId: "trial",
      isTrial: true,
      icon: Clock,
      features: [
        "Full access to Pro features",
        "Instant activation",
        "No credit card required",
        "Invite team members",
        "Explore integrations"
      ],
      recommended: false,
      gradient: "from-accent via-accent/50 to-transparent"
    },
    {
      name: "Basic",
      description: "Perfect for growing teams scaling their HR operations.",
      price: monthlyPrice ? `Rs ${monthlyPrice.amount / 100}` : "Rs 999",
      interval: "/month",
      priceId: monthlyPrice?.price_id || process.env.NEXT_PUBLIC_MONTHLY_PRICE_ID,
      isTrial: false,
      icon: Zap,
      features: [
        "Up to 50 employees",
        "Standard support",
        "Advanced reporting",
        "Custom roles",
        "Payroll integration"
      ],
      recommended: false,
      gradient: "from-primary/10 via-primary/5 to-transparent"
    },
    {
      name: "Pro",
      description: "Unlock advanced security, control, and performance.",
      price: quarterlyPrice ? `Rs ${quarterlyPrice.amount / 100}` : "Rs 2700",
      interval: "/quarter",
      priceId: quarterlyPrice?.price_id || process.env.NEXT_PUBLIC_QUARTERLY_PRICE_ID,
      isTrial: false,
      icon: Building2,
      features: [
        "Unlimited employees",
        "24/7 priority support",
        "Single Sign-On (SSO)",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced compliance tools"
      ],
      recommended: true,
      gradient: "from-primary/20 via-primary/10 to-transparent"
    },
    {
      name: "Enterprise",
      description: "Bespoke solutions for very large, complex organizations.",
      price: yearlyPrice ? `Rs ${yearlyPrice.amount / 100}` : "Rs 9000",
      interval: "/year",
      priceId: yearlyPrice?.price_id || process.env.NEXT_PUBLIC_YEARLY_PRICE_ID || "enterprise_contact",
      isTrial: false,
      icon: ShieldCheck,
      features: [
        "Everything in Pro",
        "On-premise deployment",
        "Custom SLA",
        "White-labeling",
        "Dedicated success engineer"
      ],
      recommended: false,
      gradient: "from-secondary via-secondary/50 to-transparent"
    }
  ];
};

export default function OnboardingPricingPage() {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [isTrialLoading, setIsTrialLoading] = useState(false);

  const checkoutMutation = useCreateCheckoutSessionApiV1BillingCheckoutPost();
  const trialMutation = useCreateTrialApiV1BillingTrialPost();
  const { data: plansData, isLoading: plansLoading } = useListPlansApiV1SuperadminPlansGet();

  const { redirectToTenantDashboard } = useTenantRedirect();

  const pricingPlans = mapPlansToUI(plansData || []);

  const handleSelectPlan = async (priceId: string | undefined) => {
    if (!priceId) return;
    setProcessingPlanId(priceId);
    
    if (priceId === "enterprise_contact") {
        toast.info("Please contact our sales team for Enterprise pricing.");
        setTimeout(() => setProcessingPlanId(null), 1000);
        return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({ data: { price_id: priceId } });
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (error:any) {
      toast.error(error?.response?.data?.detail || "Failed to initiate checkout. Please try again.");
      setProcessingPlanId(null);
    }
  };

  const handleStartTrial = async () => {
    setIsTrialLoading(true);
    try {
      const response = await trialMutation.mutateAsync();
      const endDate = new Date(response.trial_ends_at).toLocaleString();
      
      toast.success(`Trial activated! Full access granted until ${endDate}.`);
      
      setTimeout(() => {
        redirectToTenantDashboard();
      }, 2000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to activate trial. You may already have an active subscription.";
      toast.error(errorMessage);
    } finally {
      setIsTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-20 px-8 flex items-center shrink-0 shadow-sm">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Briefcase className="size-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-foreground">AgentsFactory HRM</span>
            </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-[1400px] mx-auto"
        >
          {/* @ts-ignore */}
          <motion.div variants={itemVariants} className="text-center mb-16 md:mb-24">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-6 bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">
              Elevate your workforce.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Select the optimal plan to activate your workspace. Scales seamlessly as your organization grows.
            </p>
          </motion.div>

          {/* Pricing Grid - Updated to 4 columns */}
          {plansLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading plans...</span>
            </div>
          ) : (
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch">
              {pricingPlans.map((plan) => (
              <motion.div key={plan.name} variants={itemVariants} className="h-full">
                <Card 
                  className={`group relative flex flex-col h-full bg-card/60 backdrop-blur-sm transition-all duration-300 ${
                    plan.recommended 
                      ? "border-primary ring-2 ring-primary shadow-2xl scale-105" 
                      : "border-border shadow-lg hover:shadow-xl hover:border-border/80 hover:scale-102"
                  }`}
                >
                  
                  <div className={`absolute inset-0 bg-gradient-to-b ${plan.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-xl`} />

                  {plan.recommended && (
                    <div className="text-center absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg z-10">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className="relative p-8 border-b border-border/50 z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl shadow-inner ${plan.recommended ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                        <plan.icon className="size-6" />
                      </div>
                      <CardTitle className="text-2xl font-extrabold tracking-tight text-card-foreground">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-md text-muted-foreground min-h-[48px] leading-relaxed">
                      {plan.description}
                    </CardDescription>
                    
                    <div className="mt-6 flex items-baseline text-card-foreground transition-all group-hover:scale-105 duration-300">
                      <span className="text-5xl font-extrabold tracking-tighter text-foreground">{plan.price}</span>
                      {plan.interval && (
                        <span className="ml-2 text-md font-medium text-muted-foreground">{plan.interval}</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative p-8 flex-1 z-10">
                    <ul className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle2 className="size-5 text-primary shrink-0 mr-3 transition-transform group-hover:scale-110 duration-300" />
                          <span className="text-md text-card-foreground leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="relative p-8 pt-0 mt-auto z-10">
                    <Button 
                      onClick={() => plan.isTrial ? handleStartTrial() : handleSelectPlan(plan.priceId)}
                      disabled={isTrialLoading || processingPlanId !== null || checkoutMutation.isPending}
                      variant={plan.recommended ? "default" : "outline"}
                      className={`w-full hover:cursor-pointer h-14 text-lg font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg ${
                        plan.recommended 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-background border-input hover:bg-accent text-foreground"
                      }`}
                    >
                      {plan.isTrial && isTrialLoading ? (
                        <><Loader2 className="mr-3 size-5 animate-spin" /> Activating...</>
                      ) : processingPlanId === plan.priceId ? (
                        <><Loader2 className="mr-3 size-5 animate-spin" /> Finalizing...</>
                      ) : (
                        <>
                          {plan.isTrial ? "Start Free Trial" : "Get Started"} <ArrowRight className="ml-3 size-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}