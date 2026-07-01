"use client";

import React, { useState, useMemo } from "react";
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
  FileSpreadsheet,
  AlertTriangle,
  LogOut,
  User,
  Share2,
  DollarSign,
  Check
} from "lucide-react";
import Link from "next/link";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import {
  useGetJobPublicApiV1JobsPublicJobIdGet,
  useCandidateApplyPublicApiV1JobsPublicJobIdApplyPost,
  useListCandidateApplicationsApiV1JobsPublicMyApplicationsGet,
  useListJobsPublicApiV1JobsPublicListGet
} from "@repo/orval-config/src/api/job/jobs/jobs";
import { useGetCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";
import { CandidateTopbar } from "@/app/[tenant]/components/candidate-topbar";
import { CandidateSidebar } from "@/app/[tenant]/components/candidate-sidebar";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements_json: Record<string, string> | null;
  start_time: string | null;
  end_time: string | null;
  pipeline_stages: string[] | null;
  created_at: string;
  jobCategory?: string;
  experienceLevel?: string;
  employmentType?: string;
  workplaceModel?: string;
  location?: { city: string; state?: string; country: string } | null;
  department?: string;
  roleDescription?: { roleSummary?: string; keyResponsibilities?: string[] } | null;
  candidateQualifications?: { mustHaveRequirements?: string[]; preferredQualifications?: string[] } | null;
  compensationAndBenefits?: { salaryMin?: number; salaryMax?: number; currency?: string; compensationType?: string; benefitsSummary?: string[] } | null;
  applicationLogistics?: { applicationDeadline?: string } | null;
}

interface MappedJob {
  id: string;
  title: string;
  location: string;
  country: string;
  continent: string;
  type: string;
  experience: string;
  jobNo: string;
  skillRequired: string;
  qualifications: string;
  about: string;
  postedAt: string;
  category: string;
}

function mapJobToMappedJob(job: Job): MappedJob {
  const category = job.jobCategory || "General";
  const experience = job.experienceLevel || "Mid-level";
  const type = job.employmentType || "Full-time";
  
  const city = job.location?.city || "";
  const country = job.location?.country || "Anywhere";
  
  let location = job.workplaceModel || "Remote";
  if (city) {
    location = `${city} (${job.workplaceModel || "On-site"})`;
  }

  let continent = "Global";
  const countryLower = country.toLowerCase();
  if (["usa", "us", "canada", "united states"].some(c => countryLower.includes(c))) {
    continent = "North America";
  } else if (["uk", "united kingdom", "london", "germany", "france", "europe", "italy", "spain", "netherlands"].some(c => countryLower.includes(c))) {
    continent = "Europe";
  } else if (["india", "singapore", "japan", "china", "asia"].some(c => countryLower.includes(c))) {
    continent = "Asia";
  } else if (["australia"].some(c => countryLower.includes(c))) {
    continent = "Oceania";
  } else if (["brazil", "argentina"].some(c => countryLower.includes(c))) {
    continent = "South America";
  }

  let skillRequired = "See job description for specific requirements.";
  if (job.candidateQualifications?.mustHaveRequirements && job.candidateQualifications.mustHaveRequirements.length > 0) {
    skillRequired = job.candidateQualifications.mustHaveRequirements.join(", ");
  } else if (job.requirements_json && typeof job.requirements_json === 'object' && !Array.isArray(job.requirements_json)) {
    const reqKeys = Object.keys(job.requirements_json);
    if (reqKeys.length > 0) {
      skillRequired = reqKeys.join(", ");
    }
  }

  let qualifications = "Relevant degree or equivalent practical experience required.";
  if (job.candidateQualifications?.preferredQualifications && job.candidateQualifications.preferredQualifications.length > 0) {
    qualifications = job.candidateQualifications.preferredQualifications.join(", ");
  }

  const about = job.roleDescription?.roleSummary || job.description || "No description provided.";

  return {
    id: String(job.id),
    title: job.title || "Untitled Position",
    location,
    country,
    continent,
    type,
    experience,
    jobNo: `JOB-${job.id}`,
    category,
    skillRequired,
    qualifications,
    about,
    postedAt: job.created_at || new Date().toISOString()
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const jobId = params.jobId as string;

  const { isAuthenticated, user, logout } = useAuthStore();
  const isCandidate = user?.realm_access?.roles?.includes("candidate");

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

  // Fetch other tenant jobs for Similar Roles
  const jobsQuery = useListJobsPublicApiV1JobsPublicListGet({
    request: { headers: { "X-Tenant-Id": tenantDetails?.id || "" } },
    query: { enabled: !!tenantDetails?.id } as any
  });

  const rawJobs = (jobsQuery.data as Job[]) || [];

  const mappedJob = useMemo(() => job ? mapJobToMappedJob(job) : null, [job]);

  const mappedJobs = useMemo(() => {
    return rawJobs.map(mapJobToMappedJob);
  }, [rawJobs]);

  const similarRoles = useMemo(() => {
    if (!mappedJob) return [];
    return mappedJobs
      .filter((j) => j.id !== mappedJob.id && j.category === mappedJob.category)
      .slice(0, 3);
  }, [mappedJobs, mappedJob]);

  const handleShareJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${tenant}/job/${jobId}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success("Link copied to clipboard!"))
        .catch(() => toast.error("Failed to copy link."));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link.");
      }
      textArea.remove();
    }
  };

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

  const existingProfile = profileQuery.data as any;
  const isProfileIncomplete = profileQuery.isSuccess && (!existingProfile ||
    !existingProfile.name ||
    !existingProfile.key_role ||
    existingProfile.experience_years === undefined ||
    existingProfile.experience_years === null ||
    !existingProfile.resume_blob_url);

  const isProfileMissing = isAuthenticated && isCandidate && (
    (profileQuery.isError && (profileQuery.error as any)?.response?.status === 404) ||
    isProfileIncomplete
  );

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

  const loading = tenantQuery.isLoading || jobQuery.isLoading || jobsQuery.isLoading || (isAuthenticated && (profileQuery.isLoading || appsQuery.isLoading));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="font-bold text-sm">Loading position details...</p>
      </div>
    );
  }

  if (!job || !mappedJob) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="size-10 text-destructive" />
        <p className="font-bold text-sm">Job position not found or no longer active.</p>
        <Button onClick={() => router.push(`/${tenant}`)} className="text-xs bg-primary text-primary-foreground cursor-pointer">
          Back to Job Board
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">

      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(var(--primary),0.1),transparent_50%)] pointer-events-none" />

      {/* Candidate Topbar */}
      <CandidateTopbar
        tenant={tenant}
        tenantName={tenantDetails?.name || "Company Portal"}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={() => { logout(); toast.info("Logged out successfully"); }}
        onSignIn={() => router.push(`/${tenant}/candidate/login`)}
        onSignUp={() => router.push(`/${tenant}/candidate/register`)}
        onMyApplications={() => router.push(`/${tenant}/candidate/dashboard`)}
        onProfile={() => router.push(`/${tenant}/candidate/profile`)}
        onBrandClick={() => router.push(`/${tenant}`)}
      />

      {/* ── Candidate Sidebar ── */}
      <CandidateSidebar tenant={tenant} isProfileMissing={!!isProfileMissing} />

      {/* Global Missing Profile Banner (Fixed under Topbar) */}
      {isProfileMissing && (
        <div className="fixed top-16 left-0 w-full z-[55] bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-md">
          <AlertTriangle className="size-4" />
          <span>
            You haven't completed your profile.{" "}
            <Link href={`/${tenant}/candidate/profile?edit=true`} className="underline font-bold hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors">
              Complete here.
            </Link>
          </span>
        </div>
      )}

      {/* Main Content Grid */}
      <main className={`max-w-7xl mx-auto px-6 w-full flex-1 ${isProfileMissing ? 'pt-[152px]' : 'pt-32'} pb-12 relative z-10 transition-all duration-300 ${isAuthenticated && isCandidate ? 'pl-24 lg:pl-28' : ''}`}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.push(`/${tenant}`)}
            className="group flex items-center gap-2 text-sm text-primary font-medium hover:opacity-80 transition-opacity mb-10 cursor-pointer"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform " /> Back to open roles
          </button>

          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="size-3.5" /> {mappedJob.category}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-tighter text-foreground mb-6 leading-[1.1]">
              {mappedJob.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium mb-6">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> {mappedJob.location}, {mappedJob.country}</span>
              <span className="flex items-center gap-2"><Clock className="size-4 text-primary" /> {mappedJob.type}</span>
              <span className="flex items-center gap-2"><User className="size-4 text-primary" /> {mappedJob.experience}</span>
              <span className="text-muted-foreground border border-border px-3 py-1 rounded-md bg-muted/50">ID: {mappedJob.jobNo}</span>
            </div>

            {/* Already Applied Status Banner */}
            {(alreadyApplied || appliedSuccess) && (
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-6 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <strong>You have applied to this role.</strong>
                </span>
                <span className="hidden sm:inline text-muted-foreground">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`inline-flex items-center text-xs font-black px-3 py-1 rounded-md border ${
                    existingApp?.selection_status === "HIRED"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : existingApp?.selection_status === "REJECTED"
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-primary/10 border-primary/20 text-primary"
                  }`}>
                    {(existingApp?.selection_status || "PENDING").replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-border mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            <div className="lg:col-span-2 space-y-12 text-foreground/90 text-lg leading-relaxed">
              {/* About the Role */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6">About the Role</h2>
                {job?.roleDescription?.roleSummary ? (
                  <p className="text-muted-foreground mb-4 font-semibold">{job.roleDescription.roleSummary}</p>
                ) : null}
              </section>

              {/* Key Responsibilities */}
              {job?.roleDescription?.keyResponsibilities && job.roleDescription.keyResponsibilities.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Key Responsibilities</h2>
                  <ul className="space-y-4">
                    {job.roleDescription.keyResponsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm md:text-base">
                        <Check className="mt-1 size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6">Requirements</h2>
                <div className="space-y-6">
                  {job?.candidateQualifications?.mustHaveRequirements && job.candidateQualifications.mustHaveRequirements.length > 0 ? (
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wider text-primary/80">Must-Have Qualifications</h3>
                      <ul className="space-y-3">
                        {job.candidateQualifications.mustHaveRequirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm md:text-base">
                            <div className="mt-2.5 size-1.5 rounded-full bg-primary shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="mt-2 size-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">Core Skills:</strong> <span className="text-muted-foreground">{mappedJob.skillRequired}</span></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-2 size-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">Experience:</strong> <span className="text-muted-foreground">{mappedJob.experience} of industry matching experience.</span></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-2 size-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">Education:</strong> <span className="text-muted-foreground">{mappedJob.qualifications}</span></span>
                      </li>
                    </ul>
                  )}

                  {job?.candidateQualifications?.preferredQualifications && job.candidateQualifications.preferredQualifications.length > 0 && (
                    <div className="pt-4">
                      <h3 className="text-base font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Preferred Qualifications</h3>
                      <ul className="space-y-3">
                        {job.candidateQualifications.preferredQualifications.map((pref, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm md:text-base">
                            <div className="mt-2.5 size-1.5 rounded-full bg-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{pref}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              {/* Compensation & Benefits */}
              {((job?.compensationAndBenefits?.salaryMin || job?.compensationAndBenefits?.salaryMax) || 
                (job?.compensationAndBenefits?.benefitsSummary && job.compensationAndBenefits.benefitsSummary.length > 0)) && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Compensation & Benefits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {((job.compensationAndBenefits?.salaryMin || job.compensationAndBenefits?.salaryMax)) && (
                      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          <DollarSign className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm text-muted-foreground font-semibold">Salary Range</h4>
                          <p className="text-lg font-bold text-foreground mt-1">
                            {job.compensationAndBenefits.salaryMin ? `${job.compensationAndBenefits.currency || "USD"} ${job.compensationAndBenefits.salaryMin.toLocaleString()}` : ""}
                            {job.compensationAndBenefits.salaryMin && job.compensationAndBenefits.salaryMax ? " - " : ""}
                            {job.compensationAndBenefits.salaryMax ? `${job.compensationAndBenefits.currency || "USD"} ${job.compensationAndBenefits.salaryMax.toLocaleString()}` : ""}
                          </p>
                          {job.compensationAndBenefits.compensationType && (
                            <span className="inline-block mt-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                              {job.compensationAndBenefits.compensationType}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {job.compensationAndBenefits?.benefitsSummary && job.compensationAndBenefits.benefitsSummary.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-4 uppercase tracking-wider text-primary/80">Perks & Benefits</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.compensationAndBenefits.benefitsSummary.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm md:text-base border border-border/50 p-4 rounded-xl bg-muted/10">
                            <Sparkles className="size-4 text-amber-500 shrink-0" />
                            <span className="text-muted-foreground font-medium">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right Column: Sticky Sidebar with Actions and Job Overview */}
            <div className="lg:col-span-1 lg:sticky lg:top-32 self-start space-y-8">
              {/* Job Overview Card */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-foreground mb-4">Job Overview</h3>
                <div className="space-y-3">
                  {job?.department && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-semibold text-foreground">{job.department}</span>
                    </div>
                  )}
                  {job?.jobCategory && !job?.department && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-semibold text-foreground">{job.jobCategory}</span>
                    </div>
                  )}
                  {job?.employmentType && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Job Type</span>
                      <span className="font-semibold text-foreground">{job.employmentType}</span>
                    </div>
                  )}
                  {job?.workplaceModel && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Workplace</span>
                      <span className="font-semibold text-foreground">{job.workplaceModel}</span>
                    </div>
                  )}
                  {job?.experienceLevel && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-semibold text-foreground">{job.experienceLevel}</span>
                    </div>
                  )}
                  {job?.applicationLogistics?.applicationDeadline && (
                    <div className="flex justify-between items-center text-sm py-2">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-semibold text-foreground">
                        {new Date(job.applicationLogistics.applicationDeadline).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                {!alreadyApplied && !appliedSuccess ? (
                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-12 rounded-full shadow-premium transition-all hover:scale-[1.02] active:scale-95 text-sm w-full cursor-pointer flex items-center justify-center gap-2"
                  >
                    {applying ? (
                      <>
                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Apply to this Position
                        <Sparkles className="size-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push(`/${tenant}/candidate/dashboard`)}
                    className="w-full h-11 text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground rounded-full shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                  </Button>
                )}

                <button
                  onClick={(e) => handleShareJob(e, mappedJob.id)}
                  className="w-full h-11 rounded-full border border-border flex items-center justify-center hover:bg-muted bg-card transition-colors text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold"
                >
                  <Share2 className="size-3.5 mr-2" /> Share Position
                </button>
              </div>

              {/* Similar Roles */}
              <div className="pt-2">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  Similar Roles
                </h3>
                {similarRoles.length > 0 ? (
                  <div className="space-y-4">
                    {similarRoles.map(simJob => (
                      <div
                        key={simJob.id}
                        onClick={() => router.push(`/${tenant}/job/${simJob.id}`)}
                        className="group p-5 rounded-2xl glass-card hover:border-primary/30 transition-all cursor-pointer shadow-sm bg-card/50"
                      >
                        <h4 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {simJob.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{simJob.location}</span>
                          <span>•</span>
                          <span>{simJob.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic border border-border p-5 rounded-2xl bg-muted/30">
                    No other open roles in this department right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card py-8 text-center text-sm font-medium text-muted-foreground mt-auto relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <p>© {new Date().getFullYear()} {tenantDetails ? tenantDetails.name : "Company Portal"}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
