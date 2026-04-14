"use client"
import React from 'react'
import { motion, Variants } from "framer-motion";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";

// Reusable animation variants
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

export default function PricingSection() {
  const { data: plansData, isLoading: plansLoading } = useListPlansApiV1SuperadminPlansGet();

  // Filter only subscription plans
  const subscriptionPlans = plansData?.filter((plan: any) => plan.type === 'subscription') || [];

  // Find prices for each interval
  const monthlyPrice = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'month' && p.interval_count === 1)
  )?.prices?.find((p: any) => p.interval === 'month' && p.interval_count === 1);

  const quarterlyPrice = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'month' && p.interval_count === 3)
  )?.prices?.find((p: any) => p.interval === 'month' && p.interval_count === 3);

  const yearlyPrice = subscriptionPlans.find((plan: any) => 
    plan.prices?.some((p: any) => p.interval === 'year')
  )?.prices?.find((p: any) => p.interval === 'year');

  // Map API plans to landing page format
  const landingPlans = [
    {
      name: "Starter",
      description: "Perfect for small teams",
      price: monthlyPrice ? `Rs ${monthlyPrice.amount / 100}` : "Rs 0",
      interval: "/mo",
      features: ["Up to 3 active jobs", "Basic pipeline management"],
      buttonText: "Get Started",
      buttonVariant: "outline" as const
    },
    {
      name: "Growth",
      description: "For scaling companies",
      price: quarterlyPrice ? `Rs ${quarterlyPrice.amount / 100}` : "Rs 2799",
      interval: "/quarter",
      features: ["Unlimited active jobs", "Automated scheduling", "Custom pipelines"],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      description: "Advanced needs & security",
      price: yearlyPrice ? `Rs ${yearlyPrice.amount / 100}` : "Custom",
      interval: yearlyPrice ? "/yr" : "",
      features: ["SSO & Advanced Security", "Dedicated Account Manager"],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <section id="pricing" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        {/* Main animated container triggering when scrolled into view */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground text-lg">
              Start for free, upgrade when you need more power.
            </motion.p>
          </div>
          
          {plansLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading plans...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center mt-8">
              {landingPlans.map((plan, index) => (
                <motion.div key={plan.name} variants={fadeInUp}>
                  <Card className={plan.popular ? "border-primary relative shadow-xl md:scale-105 z-10 bg-background" : ""}>
                    {plan.popular && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="text-4xl font-bold pt-4">{plan.price}{plan.interval && <span className="text-lg text-muted-foreground font-normal">{plan.interval}</span>}</div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <p key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="size-4 text-primary"/> {feature}
                        </p>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button variant={plan.buttonVariant} className="w-full hover:cursor-pointer">
                        {plan.buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}