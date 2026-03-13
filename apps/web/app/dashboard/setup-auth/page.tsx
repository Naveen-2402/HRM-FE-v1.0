"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, ArrowRight, CheckCircle2, Users, Building2 } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

type AuthMethod = "password" | "sso" | null;

export default function SetupAuthPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedMethod) return;
    
    setIsSubmitting(true);
    
    // Simulate a brief loading state for UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (selectedMethod === "sso") {
      // Route them to the SSO configuration form (which hits your /tenants/sso/setup backend endpoint)
      router.push("/dashboard/setup-auth/sso-config");
    } else {
      // If standard email/password, they are ready to invite employees
      router.push("/dashboard/employees/invite");
    }
  };

  return (
    <div className="min-h-[80vh] bg-background text-foreground flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl flex flex-col items-center"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ShieldCheck className="size-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Secure your workspace
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            How would you like your employees to sign in to the HRM platform? You can change this later in your security settings.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
          
          {/* Option 1: Standard Email & Password */}
          <Card 
            onClick={() => setSelectedMethod("password")}
            className={`relative overflow-hidden border-border bg-card transition-all hover:cursor-pointer ${
              selectedMethod === "password" 
                ? "ring-2 ring-ring bg-accent" 
                : "hover:bg-muted"
            }`}
          >
            {selectedMethod === "password" && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="size-6 text-foreground" />
              </div>
            )}
            <CardHeader>
              <div className="size-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Mail className="size-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl text-card-foreground">Email & Password</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Standard authentication managed directly by our platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Quickest setup time
                </li>
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Automated password reset flows
                </li>
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Perfect for small to medium teams
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Option 2: Enterprise SSO */}
          <Card 
            onClick={() => setSelectedMethod("sso")}
            className={`relative overflow-hidden border-border bg-card transition-all hover:cursor-pointer ${
              selectedMethod === "sso" 
                ? "ring-2 ring-ring bg-accent" 
                : "hover:bg-muted"
            }`}
          >
            {selectedMethod === "sso" && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="size-6 text-foreground" />
              </div>
            )}
            <CardHeader>
              <div className="size-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Building2 className="size-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl text-card-foreground">Single Sign-On (SSO)</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Connect your existing Identity Provider via OIDC or SAML.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Centralized access control
                </li>
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Works with Azure AD, Google Workspace, Okta
                </li>
                <li className="flex items-center text-sm text-card-foreground">
                  <CheckCircle2 className="mr-3 size-4 text-muted-foreground" />
                  Enforce your own 2FA/MFA policies
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* Action Button */}
        <div className="w-full flex justify-center border-t border-border pt-8">
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={!selectedMethod || isSubmitting}
            className="w-full max-w-sm h-14 text-lg font-semibold bg-primary text-primary-foreground hover:cursor-pointer"
          >
            {isSubmitting ? (
              "Saving preferences..."
            ) : (
              <>
                Continue Configuration <ArrowRight className="ml-2 size-5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}