"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  FileCheck,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useParams } from "next/navigation";

import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { AccentBar, SectionCard } from "@/components/_shared";
import { getClientAuthToken } from "@repo/utils";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";

// Interview Agent Admin API — port 8090 (exposed in docker-compose)
const INTERVIEW_AGENT_URL =
  process.env.NEXT_PUBLIC_INTERVIEW_AGENT_URL || "http://localhost:8090";

export default function AiContextTab() {
  // Resolve the real tenant UUID from the subdomain — same pattern used across
  // interviews, jobs, and candidates pages. user?.tenant_id is not in the JWT.
  const params = useParams();
  const tenantSubdomain = params?.tenant as string | undefined;

  const { data: tenantDetails } = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenantSubdomain!,
    { query: { enabled: !!tenantSubdomain } } as any
  );
  const tenantId = (tenantDetails as any)?.id as string | undefined;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasExistingContext, setHasExistingContext] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  // Persisted filename so it survives navigation (file state resets on remount)
  const [storedFilename, setStoredFilename] = useState<string | null>(null);

  const FILENAME_STORAGE_KEY = tenantId ? `ai_context_filename_${tenantId}` : null;

  // ── Auth headers ─────────────────────────────────────────────────────────────
  const authHeaders = () => {
    const headers: Record<string, string> = {};
    const token = getClientAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // ── Check if context already exists once tenantId is resolved ────────────────
  useEffect(() => {
    if (!tenantId) {
      // tenantDetails not fetched yet — keep checking state
      return;
    }
    // Restore persisted filename from localStorage
    const key = `ai_context_filename_${tenantId}`;
    const saved = localStorage.getItem(key);
    if (saved) setStoredFilename(saved);

    const checkContext = async () => {
      try {
        // Use header-based endpoint so tenant UUID never appears in the URL
        const res = await axios.get(
          `${INTERVIEW_AGENT_URL}/internal/agent/tenant-context`,
          { headers: { ...authHeaders(), "X-Tenant-Id": tenantId }, timeout: 4000 }
        );
        const exists = res.data?.exists === true;
        setHasExistingContext(exists);
        // Clear stored filename if context was removed externally
        if (!exists) {
          localStorage.removeItem(key);
          setStoredFilename(null);
        }
      } catch {
        // network error / timeout → agent unreachable, default to upload UI
        setHasExistingContext(false);
      } finally {
        setChecking(false);
      }
    };
    checkContext();
  }, [tenantId]);

  // ── Upload handler ────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".md")) {
      toast.warning("Please upload a Markdown (.md) file.");
      return;
    }

    if (!tenantId) {
      toast.error("Tenant not resolved yet — please wait a moment and try again.");
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("tenant_id", tenantId);
      formData.append("file", selectedFile, selectedFile.name);

      await axios.post(
        `${INTERVIEW_AGENT_URL}/internal/agent/tenant-context`,
        formData,
        { headers: { ...authHeaders() } }
      );

      // Persist the original filename so it survives navigation
      const key = `ai_context_filename_${tenantId}`;
      localStorage.setItem(key, selectedFile.name);
      setStoredFilename(selectedFile.name);

      setHasExistingContext(true);
      toast.success(
        "Tenant context uploaded — the AI Interview Agent will use it for all future interviews."
      );
    } catch (err: any) {
      console.error("Error uploading context to interview agent:", err);
      const detail =
        err?.response?.data?.detail || err?.message || "Upload failed";
      toast.error(`Upload failed: ${detail}`);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!tenantId) return;
    setDeleting(true);
    try {
      // Use header-based endpoint so tenant UUID never appears in the URL
      await axios.delete(
        `${INTERVIEW_AGENT_URL}/internal/agent/tenant-context`,
        { headers: { ...authHeaders(), "X-Tenant-Id": tenantId } }
      );
      // Clear persisted filename
      if (FILENAME_STORAGE_KEY) {
        localStorage.removeItem(FILENAME_STORAGE_KEY);
      }
      setStoredFilename(null);
      setHasExistingContext(false);
      setFile(null);
      toast.success("Tenant context removed.");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err?.message || "Delete failed";
      toast.error(`Delete failed: ${detail}`);
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const isResolvingTenant = !tenantId;
  const isActive = hasExistingContext || !!file;
  // Priority: file just selected > filename stored in localStorage > fallback
  const displayName = file ? file.name : (storedFilename ?? "Company context");

  return (
    <div className="space-y-6">
      <SectionCard>
        <AccentBar />
        <div className="border-b border-border px-6 py-5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <FileText className="size-3.5" /> AI Interview Context
          </div>
          <h2 className="text-base font-semibold text-card-foreground">
            Tenant Context Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload the company&apos;s &quot;About&quot; information in Markdown (.md)
            format. This context is sent directly to the AI Interview Agent and
            used in every interview for this tenant.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Context File (.md)</Label>
              <label
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 rounded-xl cursor-pointer transition-all ${
                  uploading || isResolvingTenant ? "pointer-events-none opacity-70" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isResolvingTenant || checking ? (
                    <RefreshCw className="size-6 text-muted-foreground animate-spin mb-2" />
                  ) : uploading ? (
                    <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                  ) : isActive ? (
                    <>
                      <FileCheck className="size-8 text-primary mb-2" />
                      <p className="text-sm font-bold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-success" /> Active — used by AI
                        Interview Agent
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-semibold text-foreground">
                        Upload Company Context
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports .md files · Max 512 KB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".md,text/markdown"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading || isResolvingTenant || checking}
                />
              </label>
            </div>
          </div>

          {/* Status banner */}
          {isActive && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-success/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Context is active</p>
                  <p className="text-xs text-muted-foreground">
                    The uploaded context will be automatically provided to the AI agent during all
                    interviews for this tenant.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                {deleting ? (
                  <div className="size-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Remove
              </Button>
            </div>
          )}

          {/* Help text */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">What to include in your context file:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1">
              <li>Company overview &amp; mission</li>
              <li>Products / services offered</li>
              <li>Team structure &amp; culture</li>
              <li>Engineering stack or domain specialties</li>
            </ul>
            <p className="mt-2 text-[10px]">
              This file is stored per-tenant in the AI Interview Agent&apos;s storage and loaded
              during plan generation before each interview session.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
