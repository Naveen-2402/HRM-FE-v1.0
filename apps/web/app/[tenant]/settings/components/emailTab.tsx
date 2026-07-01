"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowRight, ShieldCheck, CheckCircle2,
  Mail, Building2, KeyRound, Shield, AlertTriangle, RefreshCw, Pencil, X, Send
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "react-toastify";

import {
  useGetEmailConfigApiV1EmailConfigGet,
  useSaveEmailConfigApiV1EmailConfigPut,
  useTestEmailConfigApiV1EmailConfigTestPost
} from "@repo/orval-config/src/api/notification/email-configuration/email-configuration";
import { ProviderType } from "@repo/orval-config/src/api/notification/model/providerType";
import { AccentBar, SectionCard } from "@/components/_shared";

export default function EmailTab() {
  const { data: config, isLoading: isFetching, refetch } = useGetEmailConfigApiV1EmailConfigGet();
  const saveMutation = useSaveEmailConfigApiV1EmailConfigPut();
  const testMutation = useTestEmailConfigApiV1EmailConfigTestPost();

  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [clientId, setClientId] = useState("");
  const [microsoftTenantId, setMicrosoftTenantId] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Sync state with fetched configuration
  useEffect(() => {
    if (config) {
      setProviderType(config.provider_type);
      setClientId(config.client_id || "");
      setMicrosoftTenantId(config.microsoft_tenant_id || "");
      setRefreshToken(config.has_refresh_token ? "***REDACTED***" : "");
      setSmtpHost(config.smtp_host || "");
      setSmtpPort(config.smtp_port || 587);
      setSmtpUsername(config.smtp_username || "");
      setPassword(config.has_password ? "***REDACTED***" : "");
      setIsEditing(false);
    } else {
      setProviderType(null);
      setIsEditing(true);
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerType) {
      toast.error("Please select a provider type");
      return;
    }

    const payload: any = {
      provider_type: providerType,
    };

    if (providerType === "Microsoft_Graph") {
      payload.client_id = clientId;
      payload.microsoft_tenant_id = microsoftTenantId;
      if (refreshToken && refreshToken !== "***REDACTED***") {
        payload.refresh_token = refreshToken;
      }
    } else if (providerType === "Google_OAuth") {
      payload.client_id = clientId;
      if (refreshToken && refreshToken !== "***REDACTED***") {
        payload.refresh_token = refreshToken;
      }
    } else if (providerType === "Custom_SMTP") {
      payload.smtp_host = smtpHost;
      payload.smtp_port = Number(smtpPort);
      payload.smtp_username = smtpUsername;
      if (password && password !== "***REDACTED***") {
        payload.password = password;
      }
    }

    try {
      await saveMutation.mutateAsync({ data: payload });
      toast.success("Email configuration saved successfully!");
      refetch();
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to save email configuration.");
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error("Please enter a destination email address");
      return;
    }

    setIsTesting(true);
    try {
      await testMutation.mutateAsync({
        data: { to_email: testEmailAddress }
      });
      toast.success("Test email sent successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to send test email.");
    } finally {
      setIsTesting(false);
    }
  };

  const isFormLocked = !!config && !isEditing;

  if (isFetching) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 className="size-6 animate-spin text-chart-2" />
        <p className="text-sm text-muted-foreground">Loading email settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* ── Step 1: Choose Provider ────────────────────────────────────────── */}
      <SectionCard>
        <AccentBar />
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
              <Mail className="size-3" /> Step 1
            </div>
            <h2 className="text-base font-semibold text-card-foreground">Outgoing Email Provider</h2>
            <p className="text-sm text-muted-foreground">
              Select the service type to send emails from your organization.
            </p>
          </div>
          {config && (
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
                <><Pencil className="size-4 mr-2" /> Edit Config</>
              )}
            </Button>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Microsoft Graph */}
          <button
            type="button"
            disabled={isFormLocked}
            onClick={() => setProviderType("Microsoft_Graph")}
            className={[
              "relative text-left rounded-xl border p-4 transition-all",
              !isFormLocked && "hover:cursor-pointer",
              providerType === "Microsoft_Graph"
                ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                : "border-border bg-card hover:bg-muted/60",
              isFormLocked && providerType !== "Microsoft_Graph" && "opacity-50"
            ].join(" ")}
          >
            {providerType === "Microsoft_Graph" && (
              <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
            )}
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background mb-3">
              <span className="text-base font-bold text-foreground">M365</span>
            </div>
            <p className="text-sm font-semibold text-card-foreground">Microsoft Graph</p>
            <p className="text-[11px] text-muted-foreground mt-1">Send via M365 API using secure OAuth</p>
          </button>

          {/* Google OAuth */}
          <button
            type="button"
            disabled={isFormLocked}
            onClick={() => setProviderType("Google_OAuth")}
            className={[
              "relative text-left rounded-xl border p-4 transition-all",
              !isFormLocked && "hover:cursor-pointer",
              providerType === "Google_OAuth"
                ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                : "border-border bg-card hover:bg-muted/60",
              isFormLocked && providerType !== "Google_OAuth" && "opacity-50"
            ].join(" ")}
          >
            {providerType === "Google_OAuth" && (
              <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
            )}
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background mb-3">
              <span className="text-base font-bold text-foreground">G</span>
            </div>
            <p className="text-sm font-semibold text-card-foreground">Google OAuth</p>
            <p className="text-[11px] text-muted-foreground mt-1">Send via Gmail API using secure OAuth</p>
          </button>

          {/* Custom SMTP */}
          <button
            type="button"
            disabled={isFormLocked}
            onClick={() => setProviderType("Custom_SMTP")}
            className={[
              "relative text-left rounded-xl border p-4 transition-all",
              !isFormLocked && "hover:cursor-pointer",
              providerType === "Custom_SMTP"
                ? "border-foreground/30 bg-muted ring-1 ring-foreground/20"
                : "border-border bg-card hover:bg-muted/60",
              isFormLocked && providerType !== "Custom_SMTP" && "opacity-50"
            ].join(" ")}
          >
            {providerType === "Custom_SMTP" && (
              <CheckCircle2 className="absolute top-3 right-3 size-4 text-foreground" />
            )}
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background mb-3">
              <span className="text-base font-bold text-foreground">SMTP</span>
            </div>
            <p className="text-sm font-semibold text-card-foreground">Custom SMTP</p>
            <p className="text-[11px] text-muted-foreground mt-1">Send via your legacy SMTP relay service</p>
          </button>
        </div>
      </SectionCard>

      {/* ── Step 2: Credentials Form ──────────────────────────────────────── */}
      <AnimatePresence>
        {providerType && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SectionCard>
              <AccentBar />
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                  <KeyRound className="size-3" /> Step 2
                </div>
                <h2 className="text-base font-semibold text-card-foreground">Provider Credentials</h2>
                <p className="text-sm text-muted-foreground">
                  Provide credentials for {providerType.replace("_", " ")} integration.
                </p>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-6 space-y-5">
                  {/* Microsoft Graph Fields */}
                  {providerType === "Microsoft_Graph" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Microsoft Client ID
                        </Label>
                        <Input
                          required
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          disabled={isFormLocked}
                          placeholder="Application (client) ID"
                          className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Microsoft Tenant ID
                        </Label>
                        <Input
                          required
                          value={microsoftTenantId}
                          onChange={(e) => setMicrosoftTenantId(e.target.value)}
                          disabled={isFormLocked}
                          placeholder="Directory (tenant) ID"
                          className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          OAuth Refresh Token
                        </Label>
                        <Input
                          required
                          type={refreshToken === "***REDACTED***" ? "password" : "text"}
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          disabled={isFormLocked}
                          placeholder="Enter Graph refresh token"
                          className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* Google OAuth Fields */}
                  {providerType === "Google_OAuth" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Google Client ID
                        </Label>
                        <Input
                          required
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          disabled={isFormLocked}
                          placeholder="Google OAuth Client ID"
                          className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          OAuth Refresh Token
                        </Label>
                        <Input
                          required
                          type={refreshToken === "***REDACTED***" ? "password" : "text"}
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          disabled={isFormLocked}
                          placeholder="Enter Google refresh token"
                          className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* Custom SMTP Fields */}
                  {providerType === "Custom_SMTP" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            SMTP Host
                          </Label>
                          <Input
                            required
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="e.g. smtp.mailgun.org"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            SMTP Port
                          </Label>
                          <Input
                            required
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            disabled={isFormLocked}
                            placeholder="587"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            SMTP Username
                          </Label>
                          <Input
                            required
                            value={smtpUsername}
                            onChange={(e) => setSmtpUsername(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="Username / email address"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            SMTP Password
                          </Label>
                          <Input
                            required
                            type={password === "***REDACTED***" ? "password" : "text"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isFormLocked}
                            placeholder="SMTP Password"
                            className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3.5" /> Outgoing mail is securely encrypted with AES-256
                  </div>
                  <Button
                    type="submit"
                    disabled={isFormLocked || saveMutation.isPending}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90
                               font-medium text-sm px-5 py-2 rounded-xl shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveMutation.isPending ? (
                      <><Loader2 className="size-4 animate-spin" /> Saving…</>
                    ) : config ? (
                      <><RefreshCw className="size-4" /> Update Configuration</>
                    ) : (
                      <><CheckCircle2 className="size-4" /> Save Configuration</>
                    )}
                  </Button>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Test Configuration ────────────────────────────────────── */}
      <AnimatePresence>
        {config && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SectionCard>
              <AccentBar />
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                  <Send className="size-3" /> Step 3
                </div>
                <h2 className="text-base font-semibold text-card-foreground">Test Mail Delivery</h2>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify that your credentials and integration are working correctly.
                </p>
              </div>

              <form onSubmit={handleTestEmail}>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Destination Email Address
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        required
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="you@example.com"
                        className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={isTesting}
                        className="inline-flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90
                                   font-medium text-sm px-5 py-2 rounded-xl shadow-sm hover:cursor-pointer disabled:opacity-50"
                      >
                        {isTesting ? (
                          <><Loader2 className="size-4 animate-spin" /> Sending…</>
                        ) : (
                          <><Send className="size-4" /> Send Test Email</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
