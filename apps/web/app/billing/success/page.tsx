"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { UserProfile } from "@/store/useAuthStore";
import { getClientAuthToken } from "@repo/utils";
import { jwtDecode } from "jwt-decode";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // We use a 4-second countdown to ensure your FastAPI webhook has time to update the DB
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Stripe usually appends ?session_id=cs_test_... to the URL on success.
    // You can capture it here if you need to fire a manual verification API call,
    // but relying on backend Webhooks is the standard, safest practice.
    const sessionId = searchParams.get("session_id");
    
    if (sessionId) {
      console.log("Stripe Checkout Session:", sessionId);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          const token = getClientAuthToken();

          if (!token) {
            console.log("Token not found");
            return
          }
                  
          // 1. Decode the Keycloak JWT to extract the user's profile and organization
          const decodedUser = jwtDecode<UserProfile>(token);
  
          // 2. Extract the Tenant Subdomain alias from the Keycloak token
          let tenantSubdomain = "";
          const orgClaim = decodedUser.organization;
  
          if (Array.isArray(orgClaim) && orgClaim.length > 0) {
            tenantSubdomain = orgClaim[0];
          } else if (typeof orgClaim === "object" && orgClaim !== null) {
            tenantSubdomain = Object.keys(orgClaim)[0] || "";
          }
  
          // 3. Redirect to the correct subdomain
          if (tenantSubdomain) {
            const hostname = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : "";
  
            const baseDomain = `${hostname}${port}`;
            
            // Hard redirect to force the browser to load the new subdomain context
            window.location.href = `http://${tenantSubdomain}.${baseDomain}/dashboard`;
          } else {
            // Fallback if they do not belong to an organization (e.g., a super admin)
            router.push("/dashboard");
          }
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