"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowRight, ShieldCheck, CheckCircle2,
  Mail, Building2, KeyRound, Shield, AlertTriangle, RefreshCw, Pencil, X
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "react-toastify";

import { useSetupTenantSsoTenantsSsoSetupPost } from "@repo/orval-config/src/api/default/default";
import { getTenantSsoConfigApiV1TenantsSsoConfigGet, useUpdateTenantSsoConfigApiV1TenantsSsoConfigPut } from "@repo/orval-config/src/api/tenants/tenants";
import { AccentBar, SectionCard } from "./_shared";

// ─────────────────────────────────────────────────────────────────────────────
type AuthMethod = "password" | "sso" | null;
type IdpType    = "microsoft" | "google" | "okta" | null;

const validateRequired = (val: string, fieldName: string) => {
  const r = z.string().min(1, `${fieldName} is required`).safeParse(val);
  return r.success ? undefined : r.error.issues[0]?.message;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SecurityTab() {
  const router = useRouter();

  const [initializing,    setInitializing]    = useState(true);
  const [selectedMethod,  setSelectedMethod]  = useState<AuthMethod>(null);
  const [selectedIdp,     setSelectedIdp]     = useState<IdpType>(null);
  const [savingPassword,  setSavingPassword]  = useState(false);
  const [globalError,     setGlobalError]     = useState<string | null>(null);
  const [isUpdateMode,    setIsUpdateMode]    = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);

  const ssoMutation = useSetupTenantSsoTenantsSsoSetupPost();
  const ssoUpdateMutation = useUpdateTenantSsoConfigApiV1TenantsSsoConfigPut();

  const form = useForm({
    defaultValues: { tenant_id: "", client_id: "", client_secret: "" },
    onSubmit: async ({ value }) => {
      setGlobalError(null);

      try {
        if (isUpdateMode) {
          // ── 1. CONSTRUCT PUT PAYLOAD (UPDATE) ──
          const updatePayload: Record<string, any> = {
            client_id: value.client_id,
            tenant_id: value.tenant_id
          };

          // SAFETY CHECK: Only send the secret if the user actually typed a new one.
          // Do not send the placeholder back to the database!
          if (value.client_secret && value.client_secret !== "***REDACTED***") {
            updatePayload.client_secret = value.client_secret;
          }

          await ssoUpdateMutation.mutateAsync({ data: updatePayload });
          toast.success("SSO configuration updated successfully!");
          setIsEditing(false); // Lock the form again after successful update
          return;
        }

        // ── 2. CONSTRUCT POST PAYLOAD (SETUP) ──
        let payload = {
          sso_client_id:         value.client_id,
          sso_client_secret:     value.client_secret,
          sso_issuer_url:        "",
          sso_authorization_url: "",
          sso_token_url:         "",
          sso_jwks_url:          "",
        };

        if (selectedIdp === "microsoft") {
          const tid = value.tenant_id;
          payload = {
            ...payload,
            sso_issuer_url:        `https://login.microsoftonline.com/${tid}/v2.0`,
            sso_authorization_url: `https://login.microsoftonline.com/${tid}/oauth2/v2.0/authorize`,
            sso_token_url:         `https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`,
            sso_jwks_url:          `https://login.microsoftonline.com/${tid}/discovery/v2.0/keys`,
          };
        }
        
        await ssoMutation.mutateAsync({ data: payload });
        toast.success("SSO configured successfully!");
        router.push("/dashboard/employees/invite");

      } catch (err: any) {
        setGlobalError(
          err?.response?.data?.detail ?? "Failed to set up SSO. Please verify your credentials."
        );
      }
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getTenantSsoConfigApiV1TenantsSsoConfigGet();
        
        if (data.sso_configured) {
          setSelectedMethod("sso");
          setIsUpdateMode(true);
          setIsEditing(false); // Ensure it's locked initially
          
          if (data.provider) {
            const pType = data.provider.provider_type?.toLowerCase() || "";
            const tokenUrl = data.provider.token_url || "";
            
            // Map known providers
            if (pType === "microsoft" || tokenUrl.includes("microsoftonline.com")) {
              setSelectedIdp("microsoft");
              
              // Extract the tenant_id from the token_url safely
              if (data.provider.token_url) {
                const urlParts = data.provider.token_url.split("login.microsoftonline.com/");
                if (urlParts.length > 1) {
                  const extractedTenantId = urlParts[1].split("/")[0];
                  form.setFieldValue("tenant_id", extractedTenantId);
                }
              }
            }

            // Auto-fill Client ID & Secret
            if (data.provider.client_id) {
              form.setFieldValue("client_id", data.provider.client_id);
            }
            if (data.provider.client_secret) {
              form.setFieldValue("client_secret", data.provider.client_secret);
            }
          }
        } else {
          setSelectedMethod("password");
        }
      } catch {
        toast.error("Failed to load authentication settings.");
        setSelectedMethod("password");
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const handleSavePasswordAuth = async () => {
    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingPassword(false);
    toast.success("Authentication preferences saved!");
    router.push("/dashboard/employees/invite");
  };

  // Helper boolean to determine if inputs should be disabled
  const isFormLocked = isUpdateMode && !isEditing;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">

      {/* ── Auth Method Card ──────────────────────────────────────────────── */}
      <SectionCard>
        <AccentBar />

        <div className="border-b border-border px-6 py-5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
            <ShieldCheck className="size-3" /> Authentication
          </div>
          <h2 className="text-base font-semibold text-card-foreground">Authentication Method</h2>
          <p className="text-sm text-muted-foreground">Choose how your employees access the workspace.</p>
        </div>

        <div className="p-6">
          {initializing ? (
            <div className="flex items-center justify-center gap-3 py-10">
              <Loader2 className="size-6 animate-spin text-chart-2" />
              <p className="text-sm text-muted-foreground">Loading settings…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <button
                type="button"
                onClick={() => { setSelectedMethod("password"); setSelectedIdp(null); }}
                className={[
                  "relative text-left rounded-xl border p-4 transition-all hover:cursor-pointer",
                  selectedMethod === "password"
                    ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                    : "border-border bg-card hover:bg-muted/60",
                ].join(" ")}
              >
                {selectedMethod === "password" && (
                  <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
                )}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
                    <Mail className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">Email & Password</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Standard authentication managed directly by our platform.
                </p>
                <ul className="space-y-1.5">
                  {["Quickest setup time", "Automated password reset flows"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-card-foreground">
                      <CheckCircle2 className="size-3 shrink-0 text-muted-foreground" /> {f}
                    </li>
                  ))}
                </ul>
              </button>

              {/* SSO */}
              <button
                type="button"
                onClick={() => setSelectedMethod("sso")}
                className={[
                  "relative text-left rounded-xl border p-4 transition-all hover:cursor-pointer",
                  selectedMethod === "sso"
                    ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                    : "border-border bg-card hover:bg-muted/60",
                ].join(" ")}
              >
                {selectedMethod === "sso" && (
                  <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
                )}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">Single Sign-On (SSO)</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Connect your existing Identity Provider via OIDC.
                </p>
                <ul className="space-y-1.5">
                  {["Centralized access control", "Enforce your own MFA policies"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-card-foreground">
                      <CheckCircle2 className="size-3 shrink-0 text-muted-foreground" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            </div>
          )}
        </div>

        {/* Footer — password save */}
        <AnimatePresence>
          {selectedMethod === "password" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                <Button
                  onClick={handleSavePasswordAuth}
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90
                             font-medium text-sm px-5 py-2 rounded-xl shadow-sm hover:cursor-pointer"
                >
                  {savingPassword
                    ? <><Loader2 className="size-4 animate-spin" /> Saving…</>
                    : <>Save Preferences <ArrowRight className="size-4" /></>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Step 1: Choose IDP ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMethod === "sso" && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SectionCard>
              <AccentBar />
              <div className="border-b border-border px-6 py-5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                  <Building2 className="size-3" /> Step 1
                </div>
                <h2 className="text-base font-semibold text-card-foreground">Identity Provider</h2>
                <p className="text-sm text-muted-foreground">Select the platform your organization uses.</p>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() => setSelectedIdp("microsoft")}
                  className={[
                    "relative text-left rounded-xl border p-4 transition-all",
                    !isFormLocked && "hover:cursor-pointer",
                    selectedIdp === "microsoft"
                      ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                      : "border-border bg-card hover:bg-muted/60",
                    isFormLocked && selectedIdp !== "microsoft" && "opacity-50"
                  ].join(" ")}
                >
                  {selectedIdp === "microsoft" && (
                    <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
                  )}
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background mb-3">
                    <span className="text-base font-bold text-foreground">M</span>
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">Microsoft Entra</p>
                </button>

                {["Google Workspace", "Okta"].map((name) => (
                  <div
                    key={name}
                    className="rounded-xl border border-border bg-muted/30 p-4 opacity-50 cursor-not-allowed"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background mb-3">
                      <span className="text-base font-bold text-muted-foreground">{name[0]}</span>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{name}</p>
                    <span className="mt-1 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 2: Credentials Form ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMethod === "sso" && selectedIdp && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SectionCard>
              <AccentBar />
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                    <KeyRound className="size-3" /> Step 2
                  </div>
                  <h2 className="text-base font-semibold text-card-foreground">Application Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Create an App Registration in your Identity Provider to get these values.
                  </p>
                </div>
                
                {/* ── Edit Button (Only visible if already configured) ── */}
                {isUpdateMode && (
                  <Button
                    type="button"
                    variant={isEditing ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:cursor-pointer transition-all py-1 px-2 rounded-xl"
                  >
                    {isEditing ? (
                      <><X className="size-4 mr-2" /> Cancel</>
                    ) : (
                      <><Pencil className="size-4 mr-2" /> Edit</>
                    )}
                  </Button>
                )}
              </div>

              <form
                id="sso-form"
                onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
              >
                <div className="p-6 space-y-5">
                  {globalError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                      <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
                      <p className="text-sm text-destructive">{globalError}</p>
                    </div>
                  )}

                  {/* Tenant ID — Microsoft only */}
                  {selectedIdp === "microsoft" && (
                    <form.Field
                      name="tenant_id"
                      validators={{ onChange: ({ value }) => validateRequired(value, "Tenant ID") }}
                    >
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Microsoft Tenant ID
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="e.g., cee5328c-2ee6-45ad-a480-3a304681dfb7"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {field.state.meta.errors.length > 0 && !isFormLocked && (
                            <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  )}

                  {/* Client ID + Secret */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <form.Field
                      name="client_id"
                      validators={{ onChange: ({ value }) => validateRequired(value, "Client ID") }}
                    >
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Client ID
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="App Client ID"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {field.state.meta.errors.length > 0 && !isFormLocked && (
                            <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="client_secret"
                      validators={{ onChange: ({ value }) => validateRequired(value, "Client Secret") }}
                    >
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Client Secret
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type={isFormLocked ? "password" : "text"} // Show text if editing, password if locked
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="App Client Secret Value"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {field.state.meta.errors.length > 0 && !isFormLocked && (
                            <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3.5" /> {isUpdateMode ? "Endpoints mapped automatically" : "Endpoints mapped automatically"}
                  </div>
                  <Button
                    type="submit"
                    form="sso-form"
                    disabled={isFormLocked || form.state.isSubmitting || ssoMutation.isPending || ssoUpdateMutation.isPending}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90
                               font-medium text-sm px-5 py-2 rounded-xl shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {form.state.isSubmitting || ssoMutation.isPending || ssoUpdateMutation.isPending
                      ? <><Loader2 className="size-4 animate-spin" /> Verifying…</>
                      : isUpdateMode 
                        ? <><RefreshCw className="size-4" /> Update Configuration</>
                        : <><CheckCircle2 className="size-4" /> Save Configuration</>
                    }
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}