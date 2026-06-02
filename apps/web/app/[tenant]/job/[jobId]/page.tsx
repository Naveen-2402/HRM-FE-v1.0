"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building,
  ArrowLeft, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Briefcase,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { 
  useGetJobPublicApiV1JobsPublicJobIdGet, 
  useCandidateApplyPublicApiV1JobsPublicJobIdApplyPost,
  useListCandidateApplicationsApiV1JobsPublicMyApplicationsGet
} from "@repo/orval-config/src/api/job/jobs/jobs";
import { useGetCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements_json: Record<string, string> | null;
  start_time: string | null;
  end_time: string | null;
  pipeline_stages: string[] | null;
  created_at: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const jobId = params.jobId as string;

  const { isAuthenticated, user } = useAuthStore();

  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [evaluationId, setEvaluationId] = useState<number | null>(null);

  // Orval Query: Get Tenant Details
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    {
      query: {
        enabled: !!tenant,
      }
    } as any
  );

  const tenantDetails = tenantQuery.data as any;

  // Orval Query: Get Public Job Details
  const jobQuery = useGetJobPublicApiV1JobsPublicJobIdGet(
    Number(jobId),
    {
      request: {
        headers: {
          "X-Tenant-Id": tenantDetails?.id || "",
        }
      },
      query: {
        enabled: !!tenantDetails?.id && !!jobId,
      }
    } as any
  );

  const job = jobQuery.data as Job | undefined;

  // Orval Query: Get Candidate Profile (Me)
  const profileQuery = useGetCandidateMeApiV1CandidatesMeGet({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || "",
      }
    },
    query: {
      enabled: isAuthenticated && !!tenantDetails?.id,
      retry: false,
    }
  } as any);

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

  const applications = (appsQuery.data as any[]) || [];
  const existingApp = applications.find((app: any) => app.job_id === Number(jobId));
  const alreadyApplied = !!existingApp;

  const applyMutation = useCandidateApplyPublicApiV1JobsPublicJobIdApplyPost({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || "",
      }
    }
  } as any);

  const handleApply = async () => {
    if (!tenantDetails || !job) return;

    // 1. Redirect if not logged in
    if (!isAuthenticated || !user?.realm_access?.roles?.includes("candidate")) {
      toast.info("Please log in to apply");
      router.push(`/${tenant}/candidate/login?redirect=/${tenant}/job/${jobId}`);
      return;
    }

    try {
      setApplying(true);

      // 2. Check if candidate profile exists
      if (profileQuery.isError || !profileQuery.data || (profileQuery.data as any)?.detail === "Profile not found") {
        toast.info("Please complete your profile to apply");
        router.push(`/${tenant}/candidate/profile?redirect=/${tenant}/job/${jobId}`);
        return;
      }

      // 3. Submit application using mutation
      const applyRes = await applyMutation.mutateAsync({
        jobId: Number(jobId)
      } as any);

      const applyData = applyRes as any;
      setEvaluationId(applyData?.evaluation_id);
      setAppliedSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      console.error("Error applying to job:", err);
      const msg = err?.response?.data?.detail || "Application failed";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  const loading = tenantQuery.isLoading || jobQuery.isLoading || (isAuthenticated && (profileQuery.isLoading || appsQuery.isLoading));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="size-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="font-bold text-sm">Loading position details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-350">
        <AlertCircle className="size-10 text-red-500" />
        <p className="font-bold text-sm">Job position not found or no longer active.</p>
        <Button onClick={() => router.push(`/${tenant}`)} className="text-xs bg-indigo-600">
          Back to Job Board
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background glowing rings */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push(`/${tenant}`)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Job Board
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Portal:</span>
            <span className="text-xs bg-slate-900 text-indigo-400 border border-slate-800 px-2 py-0.5 rounded-md font-semibold">
              {tenantDetails ? tenantDetails.name : "Active"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-5xl mx-auto px-4 w-full flex-1 py-12 grid gap-8 lg:grid-cols-3 relative">
        
        {/* Left Column: Job Description and requirements */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                <MapPin className="size-3.5 text-indigo-400" />
                Remote / Hybrid
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                <Clock className="size-3.5 text-indigo-400" />
                Full-time Position
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                <Calendar className="size-3.5 text-indigo-400" />
                Published {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div className="p-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/20 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="size-5 text-indigo-400" />
              Role Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Requirements Section */}
          {job.requirements_json && Object.keys(job.requirements_json).length > 0 && (
            <div className="p-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/20 backdrop-blur-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-400" />
                Extracted Skills & Requirements
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(job.requirements_json).map(([skill, details]) => (
                  <div 
                    key={skill}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 flex flex-col justify-between"
                  >
                    <span className="text-sm font-black text-indigo-400">{skill}</span>
                    <span className="text-xs text-slate-400 mt-1 font-medium">{details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Application Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/30 backdrop-blur-2xl space-y-6">
            <h4 className="text-base font-black text-slate-100">Application Status</h4>
            
            <AnimatePresence mode="wait">
              {alreadyApplied || appliedSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-6"
                >
                  <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-100">
                      {appliedSuccess ? "Application Submitted!" : "You've Already Applied"}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                      {appliedSuccess 
                        ? "Thank you for applying. Your profile has been sent to the hiring managers."
                        : "Your application is active and being reviewed by the hiring team."}
                    </p>
                  </div>
                  {(evaluationId || existingApp?.evaluation_id) && (
                    <div className="text-[11px] text-slate-400 font-bold bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      Evaluation Reference: #{evaluationId || existingApp?.evaluation_id}
                    </div>
                  )}
                  {existingApp && (
                    <div className="space-y-2 text-xs font-bold text-slate-500 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-left">
                      <div className="flex justify-between items-center">
                        <span>Application Status:</span>
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                          existingApp.selection_status === "HIRED"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : existingApp.selection_status === "REJECTED"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        }`}>
                          {existingApp.selection_status || "PENDING EVALUATION"}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={() => router.push(`/${tenant}/candidate/dashboard`)}
                    className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl"
                  >
                    Go to Dashboard
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Submit your global candidate profile and resume details directly to this company. 
                    Your credentials will remain completely secure.
                  </p>

                  <div className="space-y-2 text-xs font-bold text-slate-500 bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <div className="flex justify-between">
                      <span>Application Type:</span>
                      <span className="text-slate-300">Self Applied</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Authentication:</span>
                      <span className={isAuthenticated ? "text-emerald-400" : "text-amber-500"}>
                        {isAuthenticated ? "Connected" : "Required"}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                  >
                    {applying ? (
                      <>
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Apply to this Position
                        <Sparkles className="size-4 text-white" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600">
        <div className="max-w-5xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {tenantDetails ? tenantDetails.name : "Company"}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
