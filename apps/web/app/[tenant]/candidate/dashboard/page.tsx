"use client";

import React, { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  XCircle,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import {
  useGetCandidateMeApiV1CandidatesMeGet,
  getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet
} from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { useListCandidateApplicationsApiV1JobsPublicMyApplicationsGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";

interface CandidateProfile {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  key_role: string;
  experience_years: number;
  skills: string[];
  education: string;
  resume_blob_url: string;
  status: string;
  state?: string;
  upload_enabled?: boolean;
  profile_banner?: string | null;
}

interface Application {
  evaluation_id: number;
  job_id: number;
  job_title: string;
  job_description: string;
  source: string;
  current_stage_index: number;
  stage_status: string;
  selection_status: string;
  display_status?: string;
  human_decision: boolean;
  created_at: string;
  pipeline_stages?: string[];
}

function CandidateDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  const { isAuthenticated, user, logout } = useAuthStore();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (isAuthenticated && !user) return; // Wait for rehydration
    if (!isAuthenticated || !user?.realm_access?.roles?.includes("candidate")) {
      router.push(`/${tenant}/candidate/login`);
    }
  }, [isAuthenticated, user, tenant, router]);

  // Orval Query: Tenant details by subdomain
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    {
      query: {
        enabled: !!tenant,
      }
    } as any
  );

  const tenantDetails = tenantQuery.data as any;

  // Orval Query: Candidate Profile details
  const profileQuery = useGetCandidateMeApiV1CandidatesMeGet({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || "",
      }
    },
    query: {
      enabled: !!tenantDetails?.id && isAuthenticated,
      retry: false,
    }
  } as any);

  const profile = profileQuery.data as CandidateProfile | undefined;

  const [fetchingSas, setFetchingSas] = React.useState(false);

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile || !tenantDetails) return;
    try {
      setFetchingSas(true);
      const sasRes = (await getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet(
        profile.id,
        { file_path: profile.resume_blob_url },
        {
          headers: {
            "X-Tenant-Id": tenantDetails.id,
          }
        }
      )) as any;

      const data = sasRes.data || sasRes;
      if (data?.download_url) {
        window.open(data.download_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Failed to generate secure viewing link");
      }
    } catch (err) {
      console.error("Error generating viewing link:", err);
      toast.error("Failed to generate secure viewing link");
    } finally {
      setFetchingSas(false);
    }
  };

  // Handle missing profile redirect
  useEffect(() => {
    if (profileQuery.isError && (profileQuery.error as any)?.response?.status === 404) {
      toast.info("Please fill out your candidate profile first");
      router.push(`/${tenant}/candidate/profile`);
    }
  }, [profileQuery.isError, profileQuery.error, tenant, router]);

  // Orval Query: Candidate Job applications list
  const appsQuery = useListCandidateApplicationsApiV1JobsPublicMyApplicationsGet({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || "",
      }
    },
    query: {
      enabled: !!tenantDetails?.id && isAuthenticated,
    }
  } as any);

  const applications = (appsQuery.data as Application[]) || [];
  const loading = tenantQuery.isLoading || profileQuery.isLoading || appsQuery.isLoading;

  // Status helpers
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "HIRED":
        return {
          label: "Hired",
          icon: CheckCircle,
          className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          dotColor: "bg-emerald-500"
        };
      case "REJECTED":
        return {
          label: "Not Selected",
          icon: XCircle,
          className: "bg-destructive/10 text-destructive border-destructive/20",
          dotColor: "bg-destructive"
        };
      default:
        return {
          label: "In Review",
          icon: Clock,
          className: "bg-primary/10 text-primary border-primary/20",
          dotColor: "bg-primary"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-semibold text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>

      {/* Background glowing rings */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Dashboard Layout */}
      <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 flex-1 pt-8 pb-16 flex flex-col items-start">

        {/* Applications Container (Aligned to 'A' in AgentsFactory) */}
        <div className="w-full space-y-8 md:pl-9">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Your Applications</h2>
              <p className="text-sm text-muted-foreground mt-2">Track your job application progress</p>
            </div>
          </div>

          {/* Applications Grid */}
          {applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="size-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="size-7 text-muted-foreground/50" />
              </div>
              <h4 className="font-bold text-foreground text-sm">No applications yet</h4>
              <p className="text-muted-foreground text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                You haven't submitted any job applications to {tenantDetails ? tenantDetails.name : "this company"} yet. Browse available positions to get started.
              </p>
              <Button
                onClick={() => router.push(`/${tenant}`)}
                className="mt-5 text-xs rounded-full px-6 gap-2 cursor-pointer"
              >
                Find Open Jobs <ArrowRight className="size-3.5" />
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {applications.map((app, index) => {
                const statusConfig = getStatusConfig(app.selection_status);
                const StatusIcon = statusConfig.icon;
                const stages = app.pipeline_stages || ["Resume Screen", "Technical", "Manager Review", "Offer"];
                const totalStages = stages.length;
                const completedStages = app.current_stage_index + (app.stage_status === "CLEARED" ? 1 : 0);
                const progressPercent = Math.round((completedStages / totalStages) * 100);

                return (
                  <motion.div
                    key={app.evaluation_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-2xl border border-border bg-card hover:bg-card/80 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
                  >
                    {/* Card Header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              JOB-{app.job_id}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              Applied {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {app.source && (
                              <>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground capitalize">
                                  via {app.source}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-foreground line-clamp-1">
                            {app.job_title}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusConfig.className}`}>
                          <StatusIcon className="size-3.5" />
                          {statusConfig.label}
                        </div>
                      </div>

                      {/* Pipeline Progress */}
                      <div className="mt-5 space-y-3">
                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground tabular-nums w-8 text-right">
                            {progressPercent}%
                          </span>
                        </div>

                        {/* Stage Steps */}
                        <div className="flex items-center justify-between w-full pt-1">
                          {stages.map((stage, idx) => {
                            const isCleared = idx < app.current_stage_index || (idx === app.current_stage_index && app.stage_status === "CLEARED");
                            const isActive = idx === app.current_stage_index && app.stage_status !== "CLEARED";

                            return (
                              <div key={stage} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                <div className={`size-6 rounded-full border-[1.5px] flex items-center justify-center transition-all ${isCleared
                                  ? "bg-emerald-500 border-emerald-400 text-white"
                                  : isActive
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary border-border text-muted-foreground/40"
                                  }`}>
                                  {isCleared ? (
                                    <CheckCircle className="size-3.5" />
                                  ) : isActive ? (
                                    <div className="size-2 bg-primary rounded-full animate-pulse" />
                                  ) : (
                                    <div className="size-2 bg-muted-foreground/30 rounded-full" />
                                  )}
                                </div>
                                <span className={`text-[10px] sm:text-[11px] leading-tight font-semibold text-center select-none truncate w-full px-0.5 ${isCleared ? "text-emerald-500" : isActive ? "text-primary" : "text-muted-foreground/50"
                                  }`}>
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </>
  );
}

export default function CandidateDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-semibold text-sm">Opening Candidate Dashboard...</p>
      </div>
    }>
      <CandidateDashboardContent />
    </Suspense>
  );
}
