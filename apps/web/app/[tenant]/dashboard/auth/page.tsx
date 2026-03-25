"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Mail, ArrowRight, CheckCircle2, 
  Building2, KeyRound, Loader2, Shield 
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";

import { toast } from "react-toastify";
import { useSetupTenantSsoTenantsSsoSetupPost } from "@repo/orval-config/src/api/default/default";
import { getTenantSsoStatusApiV1TenantsSsoStatusGet } from "@repo/orval-config/src/api/tenants/tenants";

type AuthMethod = "password" | "sso" | null;
type IdpType = "microsoft" | "google" | "okta" | null;

const validateRequired = (val: string, fieldName: string) => {
  const result = z.string().min(1, `${fieldName} is required`).safeParse(val);
  return result.success ? undefined : result?.error?.issues[0]?.message;
};

export default function AuthSettingsPage() {
  const router = useRouter();
  
  // States
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>(null);
  const [selectedIdp, setSelectedIdp] = useState<IdpType>(null);
  const [isSavingPasswordAuth, setIsSavingPasswordAuth] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const ssoMutation = useSetupTenantSsoTenantsSsoSetupPost();

  // Fetch initial SSO status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getTenantSsoStatusApiV1TenantsSsoStatusGet();
        const ssoConfigured = data.sso_configured;
                
        setSelectedMethod(ssoConfigured ? "sso" : "password");
      } catch (error) {
        toast.error("Failed to load current authentication settings.");
        setSelectedMethod("password"); // Fallback default
      } finally {
        setIsInitializing(false);
      }
    };

    fetchStatus();
  }, []);

  const handleSavePasswordAuth = async () => {
    setIsSavingPasswordAuth(true);
    // Simulate API call to save "password" as the auth method or disable SSO
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSavingPasswordAuth(false);
    toast.success("Authentication preferences saved!");
    router.push("/dashboard/employees/invite");
  };

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

        await ssoMutation.mutateAsync({ data: ssoPayload });
        toast.success("SSO Configured Successfully!");
        router.push("/dashboard/employees/invite");

      } catch (error: any) {
        setGlobalError(error?.response?.data?.detail || "Failed to setup SSO. Please verify your credentials.");
      }
    },
  });

  if (isInitializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex flex-col items-center justify-start py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl px-4 flex flex-col items-center space-y-12"
      >
        {/* --- MAIN AUTH SELECTION --- */}
        <div className="w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="size-6 text-primary" />
              Authentication Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how your employees access the workspace.
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card 
              onClick={() => {
                setSelectedMethod("password");
                setSelectedIdp(null); // Reset SSO flow if they swap back
              }}
              className={`relative border-border bg-card transition-all hover:cursor-pointer ${
                selectedMethod === "password" 
                  ? "ring-2 ring-ring bg-accent" 
                  : "hover:bg-muted"
              }`}
            >
              {selectedMethod === "password" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="size-5 text-foreground" />
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold text-card-foreground">Email & Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <CardDescription className="text-xs text-muted-foreground mb-3">
                  Standard authentication managed directly by our platform.
                </CardDescription>
                <ul className="space-y-1.5">
                  <li className="flex items-center text-xs text-card-foreground">
                    <CheckCircle2 className="mr-2 size-3.5 text-muted-foreground" /> Quickest setup time
                  </li>
                  <li className="flex items-center text-xs text-card-foreground">
                    <CheckCircle2 className="mr-2 size-3.5 text-muted-foreground" /> Automated password reset flows
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              onClick={() => setSelectedMethod("sso")}
              className={`relative border-border bg-card transition-all hover:cursor-pointer ${
                selectedMethod === "sso" 
                  ? "ring-2 ring-ring bg-accent" 
                  : "hover:bg-muted"
              }`}
            >
              {selectedMethod === "sso" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="size-5 text-foreground" />
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="size-4 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-base font-semibold text-card-foreground">Single Sign-On (SSO)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <CardDescription className="text-xs text-muted-foreground mb-3">
                  Connect your existing Identity Provider via OIDC.
                </CardDescription>
                <ul className="space-y-1.5">
                  <li className="flex items-center text-xs text-card-foreground">
                    <CheckCircle2 className="mr-2 size-3.5 text-muted-foreground" /> Centralized access control
                  </li>
                  <li className="flex items-center text-xs text-card-foreground">
                    <CheckCircle2 className="mr-2 size-3.5 text-muted-foreground" /> Enforce your own MFA policies
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Save Button for standard Auth */}
          <AnimatePresence>
            {selectedMethod === "password" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full flex justify-start pt-6 overflow-hidden"
              >
                <Button 
                  onClick={handleSavePasswordAuth}
                  disabled={isSavingPasswordAuth}
                  className="bg-primary text-primary-foreground font-medium hover:cursor-pointer"
                >
                  {isSavingPasswordAuth ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Saving...</>
                  ) : (
                    <>Save Preferences</>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- STEP 1: CHOOSE IDP (ONLY VISIBLE IF SSO SELECTED) --- */}
        <AnimatePresence>
          {selectedMethod === "sso" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full border-t border-border pt-12"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Step 1: Choose Identity Provider</h2>
                <p className="text-muted-foreground">Select the platform your organization uses.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  onClick={() => setSelectedIdp("microsoft")}
                  className={`transition-all hover:cursor-pointer ${
                    selectedIdp === "microsoft" 
                      ? "ring-2 ring-ring bg-accent" 
                      : "hover:bg-muted bg-card border-border"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-card-foreground">
                      <div className="size-8 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">M</span>
                      </div>
                      Microsoft Entra
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-muted-foreground">
                      <div className="size-8 bg-secondary rounded-md flex items-center justify-center">G</div>
                      Google Workspace
                    </CardTitle>
                    <CardDescription className="text-muted-foreground pt-2">Coming soon</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-muted-foreground">
                      <div className="size-8 bg-secondary rounded-md flex items-center justify-center">O</div>
                      Okta
                    </CardTitle>
                    <CardDescription className="text-muted-foreground pt-2">Coming soon</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STEP 2: CREDENTIALS FORM (ONLY VISIBLE IF IDP SELECTED) --- */}
        <AnimatePresence>
          {selectedMethod === "sso" && selectedIdp && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full pt-6"
            >
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="bg-muted border-b border-border pb-6">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <CardTitle className="mt-4 flex items-center text-card-foreground">
                        <KeyRound className="mr-3 size-5 text-foreground" />
                        Step 2: Enter Application Details
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        Create an App Registration in your Identity Provider to get these values.
                      </CardDescription>
                    </div>
                  </div>
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
                      <div className="p-4 rounded-md bg-destructive border border-border text-primary-foreground text-sm font-medium flex gap-2">
                        <span className="font-bold">!</span>
                        {globalError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Organization ID (Auto-detected)</Label>
                      <Input disabled value="***********" className="h-9 bg-muted text-muted-foreground border-input" />
                    </div>

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
                                <p className="text-xs font-medium text-destructive-foreground">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <p className="text-xs font-medium text-destructive-foreground">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      />

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
                                <p className="text-xs font-medium text-destructive-foreground">
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
                <CardFooter className="bg-muted border-t border-border pt-6 flex justify-between">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Shield className="mr-2 size-4" /> Endpoints map automatically.
                  </p>
                  <Button 
                    type="submit" 
                    form="sso-form"
                    disabled={form.state.isSubmitting || ssoMutation.isPending}
                    className="bg-primary text-primary-foreground hover:cursor-pointer"
                  >
                    {form.state.isSubmitting || ssoMutation.isPending ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Verifying...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 size-4" /> Save Configuration</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}