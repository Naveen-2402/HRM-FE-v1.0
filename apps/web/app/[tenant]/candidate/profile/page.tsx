"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Phone,
  Briefcase,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useGetCandidateMeApiV1CandidatesMeGet, getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";

function CandidateProfileFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;

  const { user, setProfileModalOpen } = useAuthStore();

  const [fetchingSas, setFetchingSas] = useState(false);

  // Orval Query: Tenant details
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
      enabled: !!tenantDetails?.id && !!user,
      retry: false,
    }
  } as any);

  const existingProfile = profileQuery.data as any;
  const isLoadingProfile = profileQuery.isLoading;

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    const resumeUrl = existingProfile?.resume_blob_url;
    if (!resumeUrl || !tenantDetails?.id) return;

    const candidateId = existingProfile?.id || 0;

    try {
      setFetchingSas(true);
      const sasRes = (await getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet(
        candidateId,
        { file_path: resumeUrl },
        { headers: { "X-Tenant-Id": tenantDetails.id } }
      )) as any;

      const data = sasRes.data || sasRes;
      if (data?.download_url) {
        window.open(data.download_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Failed to generate secure viewing link");
      }
    } catch (err) {
      console.error("Error generating viewing link:", err);
      toast.error("Failed to generate secure viewing link. Profile might need to be saved first.");
    } finally {
      setFetchingSas(false);
    }
  };

  if (isLoadingProfile) {
    return null;
  }

const formatEducation = (education: any): string => {
  if (!education) return "";
  if (typeof education === "string") return education;
  if (Array.isArray(education)) {
    return education
      .map((edu: any) => {
        if (!edu || typeof edu !== "object") return String(edu);
        const parts = [];
        if (edu.Degree && edu.Degree !== "Not mentioned") parts.push(edu.Degree);
        if (edu.Institution && edu.Institution !== "Not mentioned") parts.push(edu.Institution);
        if (edu.Graduation_Year && edu.Graduation_Year !== "Not mentioned") parts.push(`(${edu.Graduation_Year})`);
        return parts.join(", ").replace(", (", " (");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof education === "object") {
    const parts = [];
    if (education.Degree && education.Degree !== "Not mentioned") parts.push(education.Degree);
    if (education.Institution && education.Institution !== "Not mentioned") parts.push(education.Institution);
    if (education.Graduation_Year && education.Graduation_Year !== "Not mentioned") parts.push(`(${education.Graduation_Year})`);
    return parts.join(", ").replace(", (", " (");
  }
  return String(education);
};

  const viewValues = {
    name: existingProfile?.name || user?.name || "",
    phone: existingProfile?.phone_number || "",
    keyRole: existingProfile?.key_role || "",
    experience: existingProfile?.experience_years ? parseInt(existingProfile.experience_years) : 0,
    linkedin: existingProfile?.linkedin_url || "",
    github: existingProfile?.github_url || "",
    skills: existingProfile?.skills || [],
    education: formatEducation(existingProfile?.education) || "",
    resumeUrl: existingProfile?.resume_blob_url || ""
  };
  const currentResumeUrl = viewValues.resumeUrl;

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300 relative z-10 pb-20 px-4 sm:px-6 lg:px-8 -mt-6">

      <div className="bg-background rounded-[2rem] shadow-sm overflow-hidden -mt-4">
        <div className="px-6 sm:px-5 pb-5">

          {/* Header Row for Edit Button */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setProfileModalOpen(true)}
              variant="outline"
              className="rounded-full px-6 gap-2 h-11 text-sm font-bold shadow-sm transition-all hover:bg-muted cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* LEFT SIDEBAR: Identity & Contact */}
            <div className="lg:col-span-4 space-y-6 relative z-10 pt-8 lg:pt-0">
              {/* Avatar Box */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-md flex flex-col items-center text-center space-y-4">
                <div className="w-full space-y-2 pt-2">
                  <h1 className="font-extrabold text-3xl text-foreground break-words tracking-tight">{viewValues.name || "Add your name"}</h1>

                  <div className="inline-flex items-center gap-2 text-sm bg-primary/10 text-primary px-5 py-2 rounded-full font-bold">
                    <Briefcase className="size-4" />
                    {viewValues.keyRole || "Target Role Unspecified"}
                  </div>
                </div>

                <div className="w-full h-px bg-border my-2"></div>

                <div className="w-full text-sm font-medium text-left px-2 mb-4">
                  <div className="flex items-center gap-4 justify-between bg-primary/5 p-3 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="size-4 text-primary" />
                      </div>
                      <span className="font-bold text-foreground">Experience</span>
                    </div>
                    <span className="font-black text-lg text-primary">{viewValues.experience} <span className="text-sm font-bold text-primary/70">yrs</span></span>
                  </div>
                </div>

                <div className="w-full space-y-4 text-sm font-medium text-muted-foreground text-left px-2">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Mail className="size-4 text-foreground" />
                    </div>
                    <span className="truncate">{user?.email || existingProfile?.email}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Phone className="size-4 text-foreground" />
                    </div>
                    <span className="truncate">{viewValues.phone || "No phone added"}</span>
                  </div>
                </div>

                {/* Resume Action */}
                <div className="w-full pt-4">
                  {currentResumeUrl ? (
                    <button
                      onClick={handleViewPdf}
                      disabled={fetchingSas}
                      className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-md gap-2 cursor-pointer"
                    >
                      <FileText className="size-4" />
                      {fetchingSas ? "Opening..." : "View Resume"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold transition-transform active:scale-95 shadow-sm gap-2 cursor-pointer"
                    >
                      <FileText className="size-4" />
                      Upload Resume
                    </button>
                  )}
                </div>
              </div>

              {/* Social Links Box */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social Links</h4>

                <div className="space-y-4">
                  <div>
                    <a href={viewValues.linkedin || "#"} target={viewValues.linkedin ? "_blank" : "_self"} rel="noreferrer" className="flex items-center gap-4 group">
                      <div className="size-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Globe className="size-4 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">LinkedIn</p>
                        <p className="text-xs text-muted-foreground truncate">{viewValues.linkedin || "Not provided"}</p>
                      </div>
                    </a>
                  </div>

                  <div>
                    <a href={viewValues.github || "#"} target={viewValues.github ? "_blank" : "_self"} rel="noreferrer" className="flex items-center gap-4 group">
                      <div className="size-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Globe className="size-4 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">GitHub</p>
                        <p className="text-xs text-muted-foreground truncate">{viewValues.github || "Not provided"}</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN CONTENT: Expertise */}
            <div className="lg:col-span-8 space-y-8 pt-8 lg:pt-0">

              {/* Skills Universe */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="size-5 text-primary" />
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">Skills Universe</h3>
                </div>

                <div className="pt-2">
                  <div className="flex flex-wrap gap-3">
                    {viewValues.skills && viewValues.skills.length > 0 ? (
                      viewValues.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="text-sm font-extrabold bg-primary/10 text-primary border border-primary/20 px-5 py-2.5 rounded-xl cursor-default shadow-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic py-2">No skills listed yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Education Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="size-5 text-primary" />
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">Education</h3>
                </div>

                <div className="relative pt-2 sm:pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50 hidden sm:block"></div>

                  <div className="relative z-10">
                    <div className="absolute -left-[22px] top-2 size-3 rounded-full bg-primary ring-4 ring-primary/20 hidden sm:block"></div>
                    <p className="text-foreground text-lg leading-relaxed font-semibold whitespace-pre-wrap">
                      {viewValues.education || <span className="text-muted-foreground italic font-normal text-base">No education details added yet.</span>}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CandidateProfilePage() {
  const params = useParams();
  const tenant = params.tenant as string;

  // Orval Query: Tenant details (for topbar)
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    { query: { enabled: !!tenant } } as any
  );
  
  return (
    <>
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex items-start justify-center w-full p-4 pt-16">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-xs font-semibold">Loading setup wizard...</p>
          </div>
        }>
          <CandidateProfileFormContent />
        </Suspense>
      </div>
    </>
  );
}
