"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useTenantRedirect } from "@/hooks/useTenantRedirect";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { redirectToTenantDashboard } = useTenantRedirect();
  
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (sessionId) {
      console.log("Stripe Checkout Session:", sessionId);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          redirectToTenantDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-2xl bg-card text-card-foreground text-center overflow-hidden">
          {/* Top Banner Area */}
          <div className="bg-emerald-600/10 py-12 flex justify-center border-b border-emerald-200/50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="size-24 text-primary" strokeWidth={1.5} />
            </motion.div>
          </div>
          
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="text-3xl font-extrabold tracking-tight">Payment Successful!</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-3 leading-relaxed">
              Your subscription is now active. Thank you for upgrading your workspace.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Redirecting to your dashboard in <span className="font-bold text-primary">{countdown}</span> seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}