"use client";

import React, { useState } from "react";
import { 
  Github, 
  ExternalLink, 
  Shield, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff,
  Database,
  RefreshCw
} from "lucide-react";
import { toast } from "react-toastify";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { 
  useGetTenantGithubPatApiV1TenantsIntegrationsGithubGet,
  useUpdateTenantGithubPatApiV1TenantsIntegrationsGithubPut 
} from "@repo/orval-config/src/api/tenant/tenants/tenants";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { AccentBar, SectionCard } from "@/components/_shared";

import { validateWith } from "@repo/ui/lib/validators";

const githubPatSchema = z.string()
  .min(1, "GitHub PAT is required")
  .startsWith("ghp_", "GitHub PAT must start with 'ghp_'");

export default function GithubTab() {
  const [showPat, setShowPat] = useState(false);

  // ── Data Fetching ──
  const { data: config, isLoading, refetch, isFetching } = useGetTenantGithubPatApiV1TenantsIntegrationsGithubGet();
  
  // ── Mutation ──
  const updateMutation = useUpdateTenantGithubPatApiV1TenantsIntegrationsGithubPut();

  const form = useForm({
    defaultValues: {
      github_pat: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync({
          data: { github_pat: value.github_pat.trim() },
        });
        toast.success("GitHub PAT updated successfully.");
        form.reset(); // Clear input
        refetch(); // Refresh status
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || "Failed to update GitHub PAT.");
      }
    },
  });

  const configData = config as any;
  const isConfigured = configData?.configured;
  const integration = configData?.github_integration;

  return (
    <div className="space-y-6">
      {/* ── 1. Status Overview (Only if configured) ── */}
      {isConfigured && integration && (
        <SectionCard>
          <AccentBar />
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Activity className="size-3.5" /> Integration Status
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {integration.status === "valid" ? (
                    <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
                      <CheckCircle2 className="size-3.5" />
                      Active & Valid
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive border border-destructive/20">
                      <AlertCircle className="size-3.5" />
                      {integration.status || "Error"}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground font-medium">
                    Validated: {integration.validated_at || "Never"}
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()}
                disabled={isFetching}
                className="size-9 rounded-xl hover:cursor-pointer disabled:opacity-70"
                title="Check Status"
              >
                <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">API Quota Remaining</p>
                <p className="text-2xl font-bold text-foreground">{integration.remaining?.toLocaleString() ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Reset: {integration.rate_reset_at || "N/A"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Capacity</p>
                <p className="text-2xl font-bold text-foreground">~{integration.estimated_resumes ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Resumes approx.</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Token Expiry</p>
                <p className="text-2xl font-bold text-foreground">{integration.expires_at ? "Dated" : "Classic"}</p>
                <p className="text-[10px] text-muted-foreground">{integration.expires_at || "No expiry set"}</p>
              </div>
            </div>

            {integration.message && (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <Shield className="size-4 mt-0.5 text-chart-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {integration.message}
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── 2. Configuration Form ── */}
      <SectionCard>
        <div className="border-b border-border px-6 py-5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-1">
            <Github className="size-3.5" /> GitHub Integration
          </div>
          <h2 className="text-base font-semibold text-card-foreground">Configure Personal Access Token</h2>
          <p className="text-sm text-muted-foreground">
            Provide a GitHub PAT to enable deep-dive repository analysis for candidate profiles.
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }} 
          className="p-6 space-y-6"
        >
          <div className="space-y-4 max-w-2xl">
            <form.Field
              name="github_pat"
              validators={{
                onChange: ({ value }) => validateWith(githubPatSchema)(value),
                onBlur: ({ value }) => validateWith(githubPatSchema)(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-medium">Personal Access Token (PAT)</Label>
                  <div className="relative group">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPat ? "text" : "password"}
                      placeholder={integration?.masked_pat || "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-12 h-11 rounded-xl border-border focus:ring-chart-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPat(!showPat)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                    >
                      {showPat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs font-medium text-destructive mt-1.5 animate-in slide-in-from-top-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
                    <Database className="size-3" />
                    Your token is encrypted and stored securely.
                  </p>
                </div>
              )}
            </form.Field>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="size-4 text-chart-2" />
                Required Scopes
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For complete analysis, ensure your PAT has <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">repo</code> scope.
                You can create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-chart-2 hover:underline inline-flex items-center gap-1">GitHub Settings <ExternalLink className="size-3" /></a>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-border mt-6">
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || updateMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 rounded-xl shadow-sm hover:cursor-pointer"
                >
                  {updateMutation.isPending || isSubmitting ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : null}
                  {isConfigured ? "Update Token" : "Save Integration"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
