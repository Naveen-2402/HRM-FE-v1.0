"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Zap, Building2, Briefcase, 
  Loader2, ArrowRight, ShieldCheck, HelpCircle
} from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";

import { useCreateCheckoutSessionApiV1BillingCheckoutPost, useCreateTrialApiV1BillingTrialPost } from "@repo/orval-config/src/api/billing/billing";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";

const PRICING_PLANS = [
  {
    name: "Basic",
    description: "Perfect for growing teams scaling their HR operations.",
    price: "Rs 999",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_MONTHLY_PRICE_ID,
    icon: Zap,
    features: [
      "Up to 50 employees",
      "Standard support",
      "Advanced reporting",
      "Custom roles",
      "Payroll integration"
    ],
    recommended: false,
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent"
  },
  {
    name: "Pro",
    description: "Unlock advanced security, control, and performance.",
    price: "Rs 2700",
    interval: "/quarter",
    priceId: process.env.NEXT_PUBLIC_QUARTERLY_PRICE_ID,
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
    gradient: "from-primary/10 via-primary/5 to-transparent"
  },
  {
    name: "Enterprise",
    description: "Bespoke solutions for very large, complex organizations.",
    price: "Rs 9000",
    interval: "/year",
    priceId: process.env.NEXT_PUBLIC_YEARLY_PRICE_ID || "enterprise_contact",
    icon: ShieldCheck,
    features: [
      "Everything in Pro",
      "On-premise deployment",
      "Custom SLA",
      "White-labeling",
      "Dedicated success engineer"
    ],
    recommended: false,
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent"
  }
];

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

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

export default function OnboardingPricingPage() {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [isTrialLoading, setIsTrialLoading] = useState(false);

  const checkoutMutation = useCreateCheckoutSessionApiV1BillingCheckoutPost();
  const trialMutation = useCreateTrialApiV1BillingTrialPost();

  const { redirectToTenantDashboard } = useTenantRedirect();

  const handleSelectPlan = async (priceId: string | undefined) => {
    if (!priceId) return;
    setProcessingPlanId(priceId);
    
    // Fallback for Enterprise if you don't have a specific price ID set
    if (priceId === "enterprise_contact") {
        toast.info("Please contact our sales team for Enterprise pricing.");
        setTimeout(() => setProcessingPlanId(null), 1000);
        return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({ data: { price_id: priceId } });
      console.log(response)
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (error) {
      toast.error("Failed to initiate checkout. Please try again.");
      setProcessingPlanId(null);
    }
  };

  const handleStartTrial = async () => {
    setIsTrialLoading(true);
    try {
      const response = await trialMutation.mutateAsync();
      
      // Format the date to be user-friendly (e.g., "Mar 27, 2026, 12:56 PM")
      const endDate = new Date(response.trial_ends_at).toLocaleString();
      
      toast.success(`Trial activated! Full access granted until ${endDate}.`);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        redirectToTenantDashboard();
      }, 2000);

    } catch (error: any) {
      // Handle the 400 rejection cases mentioned in your API specs
      const errorMessage = error.response?.data?.detail || "Failed to activate trial. You may already have an active subscription.";
      toast.error(errorMessage);
    } finally {
      setIsTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      
      {/* Sleek Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-20 px-8 flex items-center shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Briefcase className="size-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-foreground">Aactory HRM</span>
            </div>
            
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:cursor-pointer hover:text-foreground">
                    <HelpCircle className="mr-2 size-4" /> Help & Support
                </Button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-16 md:mb-24">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium rounded-full shadow-sm bg-muted/50 text-foreground border border-border/50">
                Step 2: Subscription Setup
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-6 bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">
              Elevate your workforce.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Select the optimal plan to activate your <span className="text-foreground font-semibold">dovel</span> workspace. Scales seamlessly as your organization grows.
            </p>
          </motion.div>

          {/* Pricing Grid - 1 Col on mobile, 3 Col on large screens */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10 items-stretch">
            {PRICING_PLANS.map((plan, index) => (
              <motion.div key={plan.name} variants={itemVariants} className="h-full">
                <Card 
                  className={`group relative flex flex-col h-full bg-card/60 backdrop-blur-sm transition-all duration-300 ${
                    plan.recommended 
                      ? "border-primary ring-2 ring-primary shadow-2xl scale-105" 
                      : "border-border shadow-lg hover:shadow-xl hover:border-border/80 hover:scale-102"
                  }`}
                >
                  
                  {/* Subtle Background Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${plan.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />

                  {plan.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-sm font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg z-10">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className="relative p-10 pb-8 border-b border-border/50 z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl shadow-inner ${plan.recommended ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                        <plan.icon className="size-7" />
                      </div>
                      <CardTitle className="text-3xl font-extrabold tracking-tight text-card-foreground">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-lg text-muted-foreground min-h-[56px] leading-relaxed">
                      {plan.description}
                    </CardDescription>
                    
                    <div className="mt-8 flex items-baseline text-card-foreground transition-all group-hover:scale-105 duration-300">
                      <span className="text-6xl font-extrabold tracking-tighter text-foreground">{plan.price}</span>
                      {plan.interval && (
                        <span className="ml-3 text-lg font-medium text-muted-foreground">{plan.interval}</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative p-10 flex-1 z-10">
                    <ul className="space-y-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle2 className="size-6 text-primary shrink-0 mr-4 transition-transform group-hover:scale-110 duration-300" />
                          <span className="text-lg text-card-foreground leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="relative p-10 pt-0 mt-auto z-10">
                    <Button 
                      onClick={() => handleSelectPlan(plan.priceId)}
                      disabled={checkoutMutation.isPending || (processingPlanId !== null)}
                      variant={plan.recommended ? "default" : "outline"}
                      className={`w-full hover:cursor-pointer h-16 text-xl font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg ${
                        plan.recommended 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-background border-input hover:bg-accent text-foreground"
                      }`}
                    >
                      {processingPlanId === plan.priceId ? (
                        <><Loader2 className="mr-3 size-6 animate-spin" /> Finalizing...</>
                      ) : (
                        <>
                          Get Started <ArrowRight className="ml-3 size-6 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Minimal footer note */}
          {/* Free Trial CTA */}
          <motion.div variants={itemVariants} className="text-center mt-20 flex flex-col items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Not ready to commit yet?
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Experience the full power of our platform firsthand. No credit card required.
              </p>
            </div>
            
            <Button
              onClick={handleStartTrial}
              disabled={isTrialLoading || processingPlanId !== null}
              variant="outline"
              size="lg"
              className="hover:cursor-pointer border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground shadow-sm transition-all"
            >
              {isTrialLoading ? (
                <><Loader2 className="mr-2 size-5 animate-spin" /> Activating Workspace...</>
              ) : (
                <><Zap className="mr-2 size-5 text-primary" /> Start 24-Hour Free Trial</>
              )}
            </Button>
          </motion.div>

        </motion.div>
      </main>

    </div>
  );
}