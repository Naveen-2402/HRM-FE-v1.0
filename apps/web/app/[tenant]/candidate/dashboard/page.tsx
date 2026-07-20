"use client";

import React, { useEffect, Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
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
  Loader2,
  Video,
  CalendarClock,
  RefreshCw
} from "lucide-react";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import {
  useGetCandidateMeApiV1CandidatesMeGet,
  getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet
} from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { useListCandidateApplicationsApiV1JobsPublicMyApplicationsGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useListInterviewsApiV1InterviewsGet } from "@repo/orval-config/src/api/interview/interviews/interviews";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";
import { SlotBookingModal } from "../components/SlotBookingModal";
import { customInstance } from "@repo/orval-config/src/axios-setup";
import { getClientAuthToken, isCandidateToken } from "@repo/utils";

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

  const { isAuthenticated, user } = useAuthStore();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (isAuthenticated && !user) return; // Wait for rehydration
    const token = getClientAuthToken();
    const isCandidate = (token && isCandidateToken(token)) || user?.realm_access?.roles?.includes("candidate") || (user as any)?.iss?.includes("hrm-candidates");
    if (!isAuthenticated || !isCandidate) {
      router.push(`/${tenant}/candidate/login?redirect=${window.location.pathname}`);
    }
  }, [isAuthenticated, user, tenant, router]);

  // Timer state to update join button disabled status dynamically
  const [now, setNow] = React.useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isJoinDisabled = (iv: any) => {
    if (iv.title?.toLowerCase().includes("ai interview")) return false;
    if (!iv.scheduled_start) return true;
    const startTime = new Date(iv.scheduled_start).getTime();
    return now < startTime - 5 * 60 * 1000;
  };

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

  // Modal control states
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [activeMagicLinkToken, setActiveMagicLinkToken] = React.useState<string | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<number | null>(null);

  const handleConfirmInterview = async (interviewId: number) => {
    try {
      setConfirmingId(interviewId);
      await customInstance({
        url: `/api/v1/interviews/${interviewId}/confirm`,
        method: "POST",
        headers: {
          "X-Tenant-Id": tenantDetails?.id || "",
        }
      } as any);
      toast.success("Interview timing confirmed!");
      refetchInterviews();
    } catch (err) {
      console.error("Failed to confirm interview timing:", err);
      toast.error("Failed to confirm interview timing");
    } finally {
      setConfirmingId(null);
    }
  };

  // Orval Query: Candidate interviews list
  const { data: interviewsResponse, isLoading: isLoadingInterviews, isFetching: isFetchingInterviews, refetch: refetchInterviews } = useListInterviewsApiV1InterviewsGet(
    {},
    {
      query: {
        enabled: !!tenantDetails?.id && isAuthenticated,
      },
      request: {
        headers: {
          "X-Tenant-Id": tenantDetails?.id || "",
        },
      },
    } as any
  );

  const interviewsList = useMemo(() => {
    return Array.isArray(interviewsResponse) ? (interviewsResponse as any[]) : [];
  }, [interviewsResponse]);

  // Build a job_id -> job_title lookup from the already-fetched applications list
  const jobTitleMap = useMemo(() => {
    const map: Record<number, string> = {};
    applications.forEach((app) => {
      if (app.job_id && app.job_title) map[app.job_id] = app.job_title;
    });
    return map;
  }, [applications]);

  const bookedInterviews = useMemo(() => {
    return interviewsList.filter(iv =>
      iv.status === "BOOKED" ||
      iv.status === "ACTIVE" ||
      iv.status === "RESCHEDULED" ||
      (iv.title?.toLowerCase().includes("ai interview") && (iv.status === "AWAITING_BOOKING" || iv.status === "SCHEDULED" || !iv.status))
    );
  }, [interviewsList]);

  const pendingInterviews = useMemo(() => {
    return interviewsList.filter(iv =>
      ((iv.status === "AWAITING_BOOKING" || iv.status === "RESCHEDULE_APPROVED" || iv.status === "INTERVIEWER_NO_SHOW") && iv.magic_link_token) &&
      !iv.title?.toLowerCase().includes("ai interview")
    );
  }, [interviewsList]);

  const loading = tenantQuery.isLoading || profileQuery.isLoading || appsQuery.isLoading || isLoadingInterviews;

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
            <button
              onClick={() => {
                appsQuery.refetch();
                refetchInterviews();
              }}
              disabled={appsQuery.isFetching || isFetchingInterviews}
              className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer transition-all hover:bg-secondary/80 flex items-center gap-2 disabled:opacity-50"
            >
              {appsQuery.isFetching || isFetchingInterviews ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Refresh"}
            </button>
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
              <p className="text-muted-foreground text-xs mt-1.5 max-w-sm mx-auto leading-relaxed mb-6">
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
            <div className="grid grid-cols-1 gap-6">
              {applications.map((app, index) => {
                const statusInfo = getStatusConfig(app.selection_status);
                const IconComponent = statusInfo.icon;
                const rawStages = app.pipeline_stages || ["Applied", "Screening", "Interview", "Offer"];
                const stages = rawStages.map((stage: any) =>
                  typeof stage === "string" ? stage : (stage?.name || "Unknown Round")
                );

                // Estimate progress based on current index
                const progressPercent = Math.round(((app.current_stage_index + (app.stage_status === "CLEARED" ? 1 : 0)) / stages.length) * 100);

                const completedCount = app.current_stage_index + (app.stage_status === "CLEARED" ? 1 : 0);
                const fillPercent = stages.length > 1 ? Math.min((completedCount / (stages.length - 1)) * 100, 100) : 0;
                const stepWidthPercent = 100 / stages.length;
                const lineOffsetPercent = stepWidthPercent / 2;

                const appPendingInterviews = pendingInterviews.filter(iv => iv.job_id === app.job_id);
                const appBookedInterviews = bookedInterviews.filter(iv => iv.job_id === app.job_id);

                return (
                  <motion.div
                    key={app.evaluation_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6"
                  >
                    {/* Left: Job & Status */}
                    <div className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusInfo.className}`}>
                          <IconComponent className="size-3.5" />
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between w-full">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">{app.job_title}</h3>
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                            <Layers className="size-3.5" />
                            Current Stage: <span className="font-semibold text-foreground">{stages[app.current_stage_index] || "Under Review"}</span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 sm:max-w-[240px] w-full sm:w-auto">
                          {appPendingInterviews.length > 0 && (
                            <div className="space-y-3">
                              {appPendingInterviews.map((iv) => {
                                const isAwaitingBooking = iv.status === "AWAITING_BOOKING" || iv.status === "RESCHEDULE_APPROVED" || iv.status === "INTERVIEWER_NO_SHOW";
                                return (
                                  <div key={iv.id} className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-warning uppercase tracking-wider flex items-center gap-1">
                                        <CalendarClock className="size-3" />
                                        Round {iv.round_number + 1} {isAwaitingBooking ? "Action Required" : "Confirm Schedule"}
                                      </span>
                                    </div>
                                    {!isAwaitingBooking && iv.scheduled_start && (
                                      <p className="text-xs font-semibold text-foreground">
                                        Proposed Timing: {format(new Date(iv.scheduled_start), "PPP p")}
                                      </p>
                                    )}
                                    {isAwaitingBooking ? (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setActiveMagicLinkToken(iv.magic_link_token);
                                          setIsBookingOpen(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer bg-warning hover:bg-warning/90 text-warning-foreground shadow-sm text-xs h-8"
                                      >
                                        <Calendar className="size-3.5" />
                                        {iv.status === "INTERVIEWER_NO_SHOW" ? "Rebook Interview" : "Select Date & Time"}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        disabled={confirmingId === iv.id}
                                        onClick={() => handleConfirmInterview(iv.id)}
                                        className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-8"
                                      >
                                        {confirmingId === iv.id ? (
                                          <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle className="size-3.5" />
                                        )}
                                        Accept Timing
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {appBookedInterviews.length > 0 && (
                            <div className="space-y-3">
                              {appBookedInterviews.map((iv) => (
                                <div key={iv.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                      <Video className="size-3" />
                                      {iv.title?.toLowerCase().includes("ai interview") ? "AI Interview Pending" : `Upcoming Interview (Round ${iv.round_number + 1})`}
                                    </span>
                                  </div>
                                  {iv.scheduled_start && !iv.title?.toLowerCase().includes("ai interview") && (
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      {format(new Date(iv.scheduled_start), "PPP p")}
                                    </p>
                                  )}
                                  {iv.title?.toLowerCase().includes("ai interview") && (
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                      You can start this interview at any time before the deadline.
                                    </p>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => router.push(`/${tenant}/candidate/interviews/${iv.id}`)}
                                    disabled={isJoinDisabled(iv)}
                                    title={isJoinDisabled(iv) ? "Room opens 5 minutes before scheduled time" : "Join Interview Room"}
                                    className="w-full flex items-center justify-center gap-2 font-bold disabled:cursor-not-allowed cursor-pointer text-xs h-8 mt-1"
                                  >
                                    <Video className="size-3.5" />
                                    {iv.title?.toLowerCase().includes("ai interview") ? "Start AI Interview" : "Join Room"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Pipeline Progress Tracker */}
                    <div className="flex-1 md:max-w-md w-full">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                          <span>Application Progress</span>
                          <span className="text-primary flex items-center gap-1 font-mono">
                            <TrendingUp className="size-3.5" />
                            {progressPercent}%
                          </span>
                        </div>

                        {/* Stage Steps */}
                        <div className="relative flex items-center justify-between w-full pt-1">
                          {stages.length > 1 && (
                            <>
                              {/* Background Line */}
                              <div
                                className="absolute top-[16px] h-[2px] bg-secondary"
                                style={{
                                  left: `${lineOffsetPercent}%`,
                                  right: `${lineOffsetPercent}%`
                                }}
                              />
                              {/* Filled Progress Line */}
                              <div
                                className="absolute top-[16px] h-[2px] bg-emerald-500 transition-all duration-500"
                                style={{
                                  left: `${lineOffsetPercent}%`,
                                  width: `${(fillPercent / 100) * (100 - stepWidthPercent)}%`
                                }}
                              />
                            </>
                          )}

                          {stages.map((stage, idx) => {
                            const isCleared = idx < app.current_stage_index || (idx === app.current_stage_index && app.stage_status === "CLEARED");
                            const isActive = idx === app.current_stage_index && app.stage_status !== "CLEARED";

                            return (
                              <div key={stage} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 relative z-10">
                                <div className={`size-6 rounded-full border-[1.5px] flex items-center justify-center transition-all relative z-10 ${isCleared
                                  ? "bg-emerald-500 border-emerald-400 text-white"
                                  : isActive
                                    ? "bg-card border-primary text-primary"
                                    : "bg-card border-border text-muted-foreground/40"
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

      {activeMagicLinkToken && (
        <SlotBookingModal
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setActiveMagicLinkToken(null);
          }}
          magicLinkToken={activeMagicLinkToken}
          tenantId={tenantDetails?.id || ""}
          onSuccess={refetchInterviews}
        />
      )}
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
