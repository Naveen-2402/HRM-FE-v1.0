"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, ArrowLeft, Building2, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";

import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";
import { useSetupTenantSsoTenantsSsoSetupPost } from "@repo/orval-config/src/api/default/default";

// Manual validation helpers
const validateRequired = (val: string, fieldName: string) => {
  const result = z.string().min(1, `${fieldName} is required`).safeParse(val);
  return result.success ? undefined : result?.error?.issues[0]?.message;
};

// Types
type IdpType = "microsoft" | "google" | "okta" | null;

export default function SSOSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIdp, setSelectedIdp] = useState<IdpType>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const ssoMutation = useSetupTenantSsoTenantsSsoSetupPost();

  const form = useForm({
    defaultValues: {
      tenant_id: "",
      client_id: "",
      client_secret: "",
    },
    onSubmit: async ({ value }) => {
      setGlobalError(null);
      
      try {
        let ssoPayload = {
          sso_client_id: value.client_id,
          sso_client_secret: value.client_secret,
          sso_issuer_url: "",
          sso_authorization_url: "",
          sso_token_url: "",
          sso_jwks_url: "",
        };

        // Automatically map Microsoft Entra ID (Azure AD) URLs using just the Tenant ID
        if (selectedIdp === "microsoft") {
          const tid = value.tenant_id;
          ssoPayload = {
            ...ssoPayload,
            sso_issuer_url: `https://login.microsoftonline.com/${tid}/v2.0`,
            sso_authorization_url: `https://login.microsoftonline.com/${tid}/oauth2/v2.0/authorize`,
            sso_token_url: `https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`,
            sso_jwks_url: `https://login.microsoftonline.com/${tid}/discovery/v2.0/keys`,
          };
        } 
        // Note: You can add `else if (selectedIdp === "google")` mapping logic here later

        await ssoMutation.mutateAsync({ data: ssoPayload });

        toast.success("SSO Configured Successfully!");
        
        // Success! Route to the bulk employee upload page
        router.push("/dashboard/employees/invite");

      } catch (error: any) {
        setGlobalError(error?.response?.data?.detail || "Failed to setup SSO. Please verify your credentials.");
      }
    },
  });

  return (
    <div className="min-h-[80vh] bg-background text-foreground flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-3xl">
        
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4 hover:cursor-pointer text-muted-foreground hover:text-foreground pl-0"
            onClick={() => step === 2 ? setStep(1) : router.back()}
          >
            <ArrowLeft className="mr-2 size-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configure Single Sign-On</h1>
          <p className="text-muted-foreground mt-2">
            Step {step} of 2: {step === 1 ? "Choose your Identity Provider" : "Enter OIDC Credentials"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: CHOOSE IDP */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Card 
                onClick={() => setSelectedIdp("microsoft")}
                className={`transition-all hover:cursor-pointer ${selectedIdp === "microsoft" ? "ring-2 ring-ring bg-accent" : "hover:bg-muted bg-card border-border"}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-card-foreground">
                    <div className="size-8 bg-[#00a4ef] rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    Microsoft Entra ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">Automatically map endpoints using your Microsoft Tenant ID.</CardDescription>
                </CardContent>
              </Card>

              {/* Add placeholders for other providers to make it look robust */}
              <Card className="opacity-60 bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-card-foreground">
                    <div className="size-8 bg-muted rounded-md flex items-center justify-center">G</div>
                    Google Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">Coming soon.</CardDescription>
                </CardContent>
              </Card>

              <Card className="opacity-60 bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-card-foreground">
                    <div className="size-8 bg-muted rounded-md flex items-center justify-center">O</div>
                    Okta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">Coming soon.</CardDescription>
                </CardContent>
              </Card>

              <div className="col-span-full mt-6 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={() => setStep(2)}
                  disabled={!selectedIdp}
                  className="bg-primary text-primary-foreground hover:cursor-pointer"
                >
                  Next Step <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CREDENTIALS FORM */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="bg-muted/30 border-b border-border pb-6">
                  <CardTitle className="mt-4 flex items-center text-card-foreground">
                    <KeyRound className="mr-3 size-5 text-primary" />
                    Enter Application Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    You need to create an App Registration in your Identity Provider to get these values.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <form
                    id="sso-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                    className="space-y-6"
                  >
                    {globalError && (
                      <div className="p-4 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm font-medium flex gap-2">
                        <span className="font-bold">!</span>
                        {globalError}
                      </div>
                    )}

                    {/* Organization ID (Read Only Visual) */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Organization ID (Auto-detected)</Label>
                      <Input disabled value="***********" className="h-9 bg-muted text-muted-foreground border-input" />
                    </div>

                    {/* Microsoft Specific: Tenant ID */}
                    {selectedIdp === "microsoft" && (
                      <form.Field
                        name="tenant_id"
                        validators={{ onChange: ({ value }) => validateRequired(value, "Tenant ID") }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-foreground font-semibold">Microsoft Tenant ID</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g., cee5328c-2ee6-45ad-a480-3a304681dfb7"
                              className="h-10 border-input bg-background text-foreground focus-visible:ring-ring"
                            />
                            <div className="h-4">
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-xs font-medium text-destructive">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Client ID */}
                      <form.Field
                        name="client_id"
                        validators={{ onChange: ({ value }) => validateRequired(value, "Client ID") }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-foreground font-semibold">Client ID</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="App Client ID"
                              className="h-10 border-input bg-background text-foreground focus-visible:ring-ring"
                            />
                            <div className="h-4">
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-xs font-medium text-destructive">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      />

                      {/* Client Secret */}
                      <form.Field
                        name="client_secret"
                        validators={{ onChange: ({ value }) => validateRequired(value, "Client Secret") }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-foreground font-semibold">Client Secret</Label>
                            <Input
                              id={field.name}
                              name={field.name}
                              type="password"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="App Client Secret Value"
                              className="h-10 border-input bg-background text-foreground focus-visible:ring-ring"
                            />
                            <div className="h-4">
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-xs font-medium text-destructive">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border pt-6 flex justify-between">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Shield className="mr-2 size-4" /> Endpoints map automatically.
                  </p>
                  <Button 
                    type="submit" 
                    form="sso-form" // Links button to form above
                    disabled={form.state.isSubmitting || ssoMutation.isPending}
                    className="bg-primary text-primary-foreground hover:cursor-pointer"
                  >
                    {form.state.isSubmitting || ssoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" /> Save Configuration
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}