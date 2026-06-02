"use client";

import React, { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building,
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
  MapPin
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="size-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="font-bold text-sm">Synchronizing candidate dossier...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background glowing rings */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building className="size-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hover:cursor-pointer" onClick={() => router.push(`/${tenant}`)}>
              {tenantDetails ? tenantDetails.name : "Company Portal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/${tenant}`)}
              className="text-xs hover:bg-slate-900 rounded-lg text-slate-300"
            >
              Browse Open Jobs
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { logout(); toast.info("Logged out successfully"); }}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 w-full flex-1 py-12 grid gap-8 lg:grid-cols-4">
        
        {/* Left Column: Candidate profile overview */}
        {profile && (
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20 backdrop-blur-xl space-y-6 relative overflow-hidden">
              
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 to-violet-500" />
              
              {/* Profile Header */}
              <div className="text-center space-y-2">
                <div className="size-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 font-black text-xl">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-100">{profile.name}</h3>
                  <span className="text-[10px] bg-slate-950 text-indigo-400 px-2 py-0.5 rounded-md font-bold border border-slate-800">
                    {profile.key_role}
                  </span>
                </div>
              </div>

              {/* Overview list */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-slate-600" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.phone_number && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 text-slate-600" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Briefcase className="size-4 text-slate-600" />
                  <span>{profile.experience_years} Years Experience</span>
                </div>
              </div>

              {/* Resume Access Link */}
              {profile.resume_blob_url && (
                <button 
                  onClick={handleViewPdf}
                  disabled={fetchingSas}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/30 text-xs font-black text-indigo-400 transition-all hover:cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="size-4" />
                    {fetchingSas ? "Generating link..." : "View Uploaded PDF"}
                  </span>
                  <ExternalLink className="size-3.5" />
                </button>
              )}
            </div>

            {/* Profile Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20 backdrop-blur-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Skills Verified</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span 
                      key={skill}
                      className="text-[10px] font-bold bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-855"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column: Applications tracking list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Your Applications</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              {applications.length} Position{applications.length !== 1 && "s"} Total
            </span>
          </div>

          <div className="space-y-6">
            {applications.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-850 rounded-[2rem] bg-slate-900/10">
                <Briefcase className="size-10 text-slate-700 mx-auto mb-3" />
                <h4 className="font-bold text-slate-350 text-sm">No applications yet</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto font-medium">
                  You haven't submitted any job applications to {tenantDetails ? tenantDetails.name : "this company"} yet.
                </p>
                <Button 
                  onClick={() => router.push(`/${tenant}`)}
                  className="mt-4 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Find Open Jobs
                </Button>
              </div>
            ) : (
              applications.map((app) => (
                <div 
                  key={app.evaluation_id}
                  className="p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20 hover:bg-slate-900/35 transition-all duration-300 space-y-6"
                >
                  {/* Top card metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-100">{app.job_title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Applied on {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">Status:</span>
                      <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                        app.selection_status === "HIRED"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : app.selection_status === "REJECTED"
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      }`}>
                        {app.selection_status || "PENDING EVALUATION"}
                      </span>
                    </div>
                  </div>

                  {/* Stage evaluation timeline */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recruitment Progress</h4>
                    
                    <div className="relative flex items-start justify-between w-full max-w-lg pt-4 pb-2">
                      {/* Connecting Line */}
                      <div className="absolute left-0 right-0 top-7 -translate-y-1/2 h-0.5 bg-slate-800 pointer-events-none" />
                      
                      {/* Dynamic Stage Timelines */}
                      {(app.pipeline_stages || ["Resume Screen", "Technical", "Manager Match", "Offer"]).map((stage, idx) => {
                        const isCleared = idx < app.current_stage_index || (idx === app.current_stage_index && app.stage_status === "CLEARED");
                        const isActive = idx === app.current_stage_index && app.stage_status !== "CLEARED";
                        
                        return (
                          <div key={stage} className="relative flex flex-col items-center gap-2 z-10">
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isCleared 
                                ? "bg-emerald-500 border-emerald-400 text-slate-950" 
                                : isActive 
                                ? "bg-indigo-500 border-indigo-400 text-white animate-pulse" 
                                : "bg-slate-950 border-slate-800 text-slate-600"
                            }`}>
                              {isCleared ? (
                                <CheckCircle className="size-3.5" />
                              ) : (
                                <Clock className="size-3.5" />
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 text-center select-none truncate max-w-[80px]">
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {tenantDetails ? tenantDetails.name : "Company"}. Candidate Dashboard Panel.</p>
        </div>
      </footer>
    </div>
  );
}

export default function CandidateDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-300">
        <div className="size-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="font-bold text-sm">Opening Candidate Dashboard...</p>
      </div>
    }>
      <CandidateDashboardContent />
    </Suspense>
  );
}
