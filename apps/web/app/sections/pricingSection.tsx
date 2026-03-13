"use client"
import React from 'react'
import { motion, Variants } from "framer-motion";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { CheckCircle2 } from "lucide-react";

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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center mt-8">
            
            {/* Starter Tier */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Perfect for small teams</CardDescription>
                  <div className="text-4xl font-bold pt-4">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Up to 3 active jobs</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Basic pipeline management</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full hover:cursor-pointer">Get Started</Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Growth Tier (Most Popular) */}
            <motion.div variants={fadeInUp}>
              <Card className="border-primary relative shadow-xl md:scale-105 z-10 bg-background">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle>Growth</CardTitle>
                  <CardDescription>For scaling companies</CardDescription>
                  <div className="text-4xl font-bold pt-4">$99<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Unlimited active jobs</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Automated scheduling</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Custom pipelines</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full hover:cursor-pointer">Start Free Trial</Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Advanced needs & security</CardDescription>
                  <div className="text-4xl font-bold pt-4">Custom</div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> SSO & Advanced Security</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Dedicated Account Manager</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full hover:cursor-pointer">Contact Sales</Button>
                </CardFooter>
              </Card>
            </motion.div>
            
          </div>
        </motion.div>
      </div>
    </section>
  )
}