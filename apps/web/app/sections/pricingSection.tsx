"use client"
import React from 'react'
import { motion, Variants } from "framer-motion";

import { Button } from "@repo/ui/components/ui/button";
import { CheckCircle2, Loader2, Layers } from "lucide-react";
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// Modern Glassmorphic Skeleton
const PricingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-center mt-12 relative z-10">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className={`relative p-8 rounded-[2.5rem] border border-border/40 bg-card/20 backdrop-blur-xl flex flex-col h-full ${i === 2 ? "md:scale-105 z-20 border-border/80" : "z-10"}`}
        >
          {/* Icon Skeleton */}
          <div className="size-10 rounded-xl bg-muted/50 animate-pulse mb-6" />
          
          {/* Header Skeleton */}
          <div className="space-y-4 mb-8">
            <div className="h-7 w-1/2 bg-muted/50 rounded-md animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/30 rounded-md animate-pulse" />
              <div className="h-4 w-4/5 bg-muted/30 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Price Skeleton */}
          <div className="h-12 w-2/3 bg-muted/50 rounded-lg animate-pulse mb-8" />

          {/* Features Skeleton */}
          <div className="space-y-4 mb-10 flex-1">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-muted/50 animate-pulse shrink-0" />
                <div className="h-3 w-5/6 bg-muted/30 rounded-md animate-pulse" />
              </div>
            ))}
          </div>

          {/* Button Skeleton */}
          <div className="h-12 w-full bg-muted/50 rounded-full animate-pulse mt-auto" />
        </div>
      ))}
    </div>
  );
};

export default function PricingSection() {
  const { data: plansData, isLoading: plansLoading } = useListPlansApiV1SuperadminPlansGet();

  const subscriptionPlans = plansData?.filter((plan: any) => plan.type === "subscription") || [];

  const getIntervalLabel = (price: any) => {
    if (!price?.interval) return "";
    if (price.interval === "month") {
      if (price.interval_count === 3) return "/quarter";
      if (price.interval_count === 6) return "/6mo";
      return "/mo";
    }
    if (price.interval === "year") {
      return "/yr";
    }
    return `/${price.interval}`;
  };

  const landingPlans = subscriptionPlans.map((plan: any, index: number) => {
    const activePrice = plan.prices?.find((price: any) => price.active) ?? plan.prices?.[0];
    const formattedPrice = activePrice?.amount != null ? `Rs ${activePrice.amount / 100}` : "Custom";
    const intervalLabel = getIntervalLabel(activePrice);
    const isPopular = plan.name?.toLowerCase().includes("quarter");

    return {
      id: plan.product_id,
      name: plan.name || `Subscription ${index + 1}`,
      description: plan.description || "Ideal for teams needing advanced recruitment and customization options.",
      price: formattedPrice,
      interval: intervalLabel,
      features: [
        "Dedicated isolated schema provisioning",
        "Access to Centralized Resume Bank",
        "Includes base AI credits for parsing",
        "Self-serve seat & credit management",
        "24/7 Priority Support"
      ],
      buttonText: activePrice?.amount != null ? "Get Started" : "Contact Sales",
      buttonVariant: isPopular ? "default" as const : "outline" as const,
      popular: isPopular
    };
  });

  return (
    <section className="bg-background py-32 relative overflow-hidden">
      
      {/* Subtle Background Elements to enhance the glassmorphism */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="text-center mb-20">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Transparent, atomic billing.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Manage seats and top up AI usage credits securely with our event-sourcing ledger system. No hidden fees.
            </motion.p>
          </div>
          
          {plansLoading ? (
            <PricingSkeleton />
          ) : landingPlans.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No subscription plans could be loaded at this time.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center mt-8"
            >
              {landingPlans.map((plan) => (
                <motion.div key={plan.id} variants={fadeInUp} className="h-full">
                  <div className={`relative h-full p-8 rounded-[2.5rem] border flex flex-col transition-all duration-300 ${
                    plan.popular 
                      ? "bg-card/40 border-primary/40 shadow-2xl backdrop-blur-2xl md:scale-105 z-20" 
                      : "bg-card/10 border-border/40 backdrop-blur-xl z-10 hover:bg-card/20"
                  }`}>
                    
                    {/* Ambient Glow for Popular Card */}
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-primary/15 blur-[60px] rounded-t-[2.5rem] pointer-events-none -z-10" />
                    )}

                    {/* Top Icon */}
                    <div className="mb-6">
                      <div className={`size-12 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Layers className="size-6" />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-3">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold tracking-tight text-foreground">{plan.price}</span>
                        {plan.interval && (
                          <span className="text-muted-foreground font-medium">{plan.interval}</span>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 mb-10 flex-1">
                      <p className="text-sm font-semibold text-foreground mb-6">Features include:</p>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className={`size-5 shrink-0 mt-0.5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`}/> 
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto pt-4">
                      <Button 
                        variant={plan.buttonVariant} 
                        className={`w-full h-12 rounded-full font-semibold text-base hover:cursor-pointer ${
                          !plan.popular ? "bg-transparent border-border/50 hover:bg-muted/30" : ""
                        }`}
                        onClick={()=> window.location.href="/signup"}
                      >
                        {plan.buttonText}
                      </Button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}