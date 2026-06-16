"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  FileCheck,
  Globe,
  Sparkles,
  CheckCircle,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useSaveCandidateMeApiV1CandidatesMePost, useCandidateMeUploadSasApiV1CandidatesMeUploadSasPost, useGetCandidateMeApiV1CandidatesMeGet, getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";

// Define Zod schemas for validation
const step1Schema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  keyRole: z.string().min(1, "Target role is required"),
  experience: z.number().min(0, "Experience years must be positive"),
});

const profileSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  keyRole: z.string().min(1, "Target role is required"),
  experience: z.number().min(0, "Experience years must be positive"),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  skills: z.array(z.string()),
  education: z.string().optional(),
  resumeUrl: z.string().min(1, "Resume is required"),
});

type ProfileFields = z.infer<typeof profileSchema>;

function CandidateProfileFormContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;
  const redirectUrl = searchParams.get("redirect");

  const { user } = useAuthStore();

  const isEditParam = searchParams.get("edit") === "true";

  const [isEditing, setIsEditing] = useState(isEditParam);

  useEffect(() => {
    if (isEditParam) setIsEditing(true);
  }, [isEditParam]);

  const [fetchingSas, setFetchingSas] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Orval Mutations instantiated with dynamic headers
  const sasMutation = useCandidateMeUploadSasApiV1CandidatesMeUploadSasPost({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || ""
      }
    }
  } as any);

  const saveMutation = useSaveCandidateMeApiV1CandidatesMePost({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || ""
      }
    }
  } as any);

  // TanStack Form Setup
  const form = useForm({
    defaultValues: {
      name: "",
      phone: "",
      keyRole: "",
      experience: 0,
      linkedin: "",
      github: "",
      skills: [] as string[],
      education: "",
      resumeUrl: ""
    } as ProfileFields,
    onSubmit: async ({ value }) => {
      if (!tenantDetails?.id) return;

      try {
        const payload = {
          name: value.name,
          email: user?.email || "",
          phone_number: value.phone,
          key_role: value.keyRole,
          experience_years: String(value.experience),
          linkedin_url: value.linkedin,
          github_url: value.github,
          skills: value.skills,
          education: value.education,
          resume_blob_url: value.resumeUrl
        };

        await saveMutation.mutateAsync({
          data: payload as any
        });

        toast.success("Profile saved successfully!");
        await profileQuery.refetch();
        setIsEditing(false); // return to view mode

        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      } catch (err: any) {
        console.error("Error saving profile:", err);
        toast.error(err?.response?.data?.detail || "Failed to save profile");
      }
    },
  });

  useEffect(() => {
    if (existingProfile) {
      form.setFieldValue("name", existingProfile.name || "");
      form.setFieldValue("phone", existingProfile.phone_number || "");
      form.setFieldValue("keyRole", existingProfile.key_role || "");
      form.setFieldValue("experience", parseInt(existingProfile.experience_years) || 0);
      form.setFieldValue("linkedin", existingProfile.linkedin_url || "");
      form.setFieldValue("github", existingProfile.github_url || "");
      form.setFieldValue("skills", existingProfile.skills || []);
      form.setFieldValue("education", existingProfile.education || "");
      form.setFieldValue("resumeUrl", existingProfile.resume_blob_url || "");
    } else if (user && !existingProfile) {
      form.setFieldValue("name", user.name || `${user.first_name || ""} ${user.family_name || ""}`.trim());
    }
  }, [existingProfile, user]);

  const revertForm = () => {
    if (existingProfile) {
      form.setFieldValue("name", existingProfile.name || "");
      form.setFieldValue("phone", existingProfile.phone_number || "");
      form.setFieldValue("keyRole", existingProfile.key_role || "");
      form.setFieldValue("experience", parseInt(existingProfile.experience_years) || 0);
      form.setFieldValue("linkedin", existingProfile.linkedin_url || "");
      form.setFieldValue("github", existingProfile.github_url || "");
      form.setFieldValue("skills", existingProfile.skills || []);
      form.setFieldValue("education", existingProfile.education || "");
      form.setFieldValue("resumeUrl", existingProfile.resume_blob_url || "");
    } else if (user) {
      form.setFieldValue("name", user.name || `${user.first_name || ""} ${user.family_name || ""}`.trim());
      form.setFieldValue("phone", "");
      form.setFieldValue("keyRole", "");
      form.setFieldValue("experience", 0);
      form.setFieldValue("linkedin", "");
      form.setFieldValue("github", "");
      form.setFieldValue("skills", []);
      form.setFieldValue("education", "");
      form.setFieldValue("resumeUrl", "");
    } else {
      form.reset();
    }
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !tenantDetails?.id) return;

    if (selectedFile.type !== "application/pdf") {
      toast.warning("Please upload a PDF file");
      return;
    }

    setFile(selectedFile);

    // Trigger direct SAS cloud upload
    try {
      setUploading(true);

      const sasRes = (await sasMutation.mutateAsync({
        data: { filename: selectedFile.name }
      })) as any;

      const { upload_url, blob_path } = (sasRes.data || sasRes) as any;

      // Upload file directly to Azure Storage (PUT)
      await axios.put(upload_url, selectedFile, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": selectedFile.type
        }
      });

      form.setFieldValue("resumeUrl", blob_path);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading resume:", err);
      const errorMsg = err?.response?.data?.detail?.message || err?.response?.data?.detail || "Failed to upload resume to Azure Storage";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    const resumeUrl = form.state.values.resumeUrl || existingProfile?.resume_blob_url;
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

  const loading = saveMutation.isPending;

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative size-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Assembling Profile...</p>
      </div>
    );
  }

  const { values } = form.state;
  const viewValues = {
    name: existingProfile?.name || user?.name || "",
    phone: existingProfile?.phone_number || "",
    keyRole: existingProfile?.key_role || "",
    experience: existingProfile?.experience_years ? parseInt(existingProfile.experience_years) : 0,
    linkedin: existingProfile?.linkedin_url || "",
    github: existingProfile?.github_url || "",
    skills: existingProfile?.skills || [],
    education: existingProfile?.education || "",
    resumeUrl: existingProfile?.resume_blob_url || ""
  };
  const currentResumeUrl = viewValues.resumeUrl;

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300 relative z-10 pb-20 px-4 sm:px-6 lg:px-8 -mt-6">

      {/* Edit Mode Sticky Action Bar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 pointer-events-auto">
              <span className="text-sm font-bold text-foreground">You are in Edit Mode</span>
              <div className="w-px h-6 bg-border mx-2"></div>
              <Button onClick={revertForm} variant="ghost" className="rounded-full px-5 text-sm font-bold text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button onClick={() => form.handleSubmit()} disabled={loading} className="rounded-full px-8 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground">
                {loading ? <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-background rounded-[2rem] shadow-sm overflow-hidden -mt-4">
        <div className="px-6 sm:px-5 pb-5">

          {/* Header Row for Edit Button */}
          {!isEditing && existingProfile && (
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="rounded-full px-6 gap-2 h-11 text-sm font-bold shadow-sm transition-all hover:bg-muted cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                Edit Profile
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* LEFT SIDEBAR: Identity & Contact */}
            <div className="lg:col-span-4 space-y-6 relative z-10 pt-8 lg:pt-0">
              {/* Avatar Box */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-md flex flex-col items-center text-center space-y-4">
                <div className="w-full space-y-2 pt-2">
                  {isEditing ? (
                    <form.Field name="name">
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="font-bold bg-secondary/50 text-center text-lg rounded-xl border-border/50"
                          />
                        </div>
                      )}
                    </form.Field>
                  ) : (
                    <h1 className="font-extrabold text-3xl text-foreground break-words tracking-tight">{viewValues.name || "Add your name"}</h1>
                  )}

                  {isEditing ? (
                    <form.Field name="keyRole">
                      {(field) => (
                        <div className="space-y-1.5 mt-4">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Role</Label>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="font-semibold bg-secondary/50 text-center text-sm rounded-xl border-border/50"
                            placeholder="e.g. Senior Engineer"
                          />
                        </div>
                      )}
                    </form.Field>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-sm bg-primary/10 text-primary px-5 py-2 rounded-full font-bold">
                      <Briefcase className="size-4" />
                      {viewValues.keyRole || "Target Role Unspecified"}
                    </div>
                  )}
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
                    {isEditing ? (
                      <form.Field name="experience">
                        {(field) => (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(Math.max(0, Number(e.target.value)))}
                              className="h-8 text-sm font-bold bg-background border-primary/30 w-16 text-center rounded-lg text-primary"
                            />
                            <span className="text-xs font-semibold text-muted-foreground">yrs</span>
                          </div>
                        )}
                      </form.Field>
                    ) : (
                      <span className="font-black text-lg text-primary">{viewValues.experience} <span className="text-sm font-bold text-primary/70">yrs</span></span>
                    )}
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
                    {isEditing ? (
                      <form.Field name="phone">
                        {(field) => (
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="h-9 text-sm bg-secondary/50 border-border/50 px-3 rounded-xl flex-1"
                            placeholder="Phone Number"
                          />
                        )}
                      </form.Field>
                    ) : (
                      <span className="truncate">{viewValues.phone || "No phone added"}</span>
                    )}
                  </div>
                </div>

                {/* Resume Action */}
                <div className="w-full pt-4">
                  {isEditing ? (
                    <form.Field name="resumeUrl">
                      {(field) => (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-2xl cursor-pointer transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                              <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                            ) : field.state.value ? (
                              <>
                                <FileCheck className="size-6 text-primary mb-2" />
                                <p className="text-xs font-bold text-foreground text-center px-4 truncate w-full">
                                  {file ? file.name : "Resume Uploaded"}
                                </p>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="size-6 text-primary/70 mb-2" />
                                <p className="text-xs font-bold text-primary/80">Upload New Resume (PDF)</p>
                              </>
                            )}
                          </div>
                          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
                        </label>
                      )}
                    </form.Field>
                  ) : (
                    currentResumeUrl && (
                      <button
                        onClick={handleViewPdf}
                        disabled={fetchingSas}
                        className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-md gap-2 cursor-pointer"
                      >
                        <FileText className="size-4" />
                        {fetchingSas ? "Opening..." : "View Resume"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Social Links Box */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social Links</h4>

                <div className="space-y-4">
                  <div>
                    {isEditing ? (
                      <form.Field name="linkedin">
                        {(field) => (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-2"><Globe className="size-3" /> LinkedIn</Label>
                            <Input
                              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="https://linkedin.com/in/..."
                              className="h-10 text-sm bg-secondary/50 rounded-xl border-border/50"
                            />
                          </div>
                        )}
                      </form.Field>
                    ) : (
                      <a href={viewValues.linkedin || "#"} target={viewValues.linkedin ? "_blank" : "_self"} rel="noreferrer" className="flex items-center gap-4 group">
                        <div className="size-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <Globe className="size-4 text-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">LinkedIn</p>
                          <p className="text-xs text-muted-foreground truncate">{viewValues.linkedin || "Not provided"}</p>
                        </div>
                      </a>
                    )}
                  </div>

                  <div>
                    {isEditing ? (
                      <form.Field name="github">
                        {(field) => (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-2"><Globe className="size-3" /> GitHub</Label>
                            <Input
                              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="https://github.com/..."
                              className="h-10 text-sm bg-secondary/50 rounded-xl border-border/50"
                            />
                          </div>
                        )}
                      </form.Field>
                    ) : (
                      <a href={viewValues.github || "#"} target={viewValues.github ? "_blank" : "_self"} rel="noreferrer" className="flex items-center gap-4 group">
                        <div className="size-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <Globe className="size-4 text-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">GitHub</p>
                          <p className="text-xs text-muted-foreground truncate">{viewValues.github || "Not provided"}</p>
                        </div>
                      </a>
                    )}
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

                {isEditing ? (
                  <form.Field name="skills">
                    {(field) => (
                      <div className="space-y-5 mt-4">
                        <div className="flex gap-3">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Type a skill and press Enter..."
                            className="bg-secondary/50 border-border/50 rounded-xl h-12 text-base"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSkill.trim() && !field.state.value.includes(newSkill.trim())) {
                                  field.handleChange([...field.state.value, newSkill.trim()]);
                                  setNewSkill("");
                                }
                              }
                            }}
                          />
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              if (newSkill.trim() && !field.state.value.includes(newSkill.trim())) {
                                field.handleChange([...field.state.value, newSkill.trim()]);
                                setNewSkill("");
                              }
                            }}
                            type="button"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-12"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {field.state.value.map((skill) => (
                            <div key={skill} className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2 shadow-sm group">
                              <span className="font-bold text-sm text-foreground">{skill}</span>
                              <button type="button" onClick={() => field.handleChange(field.state.value.filter(s => s !== skill))} className="text-muted-foreground hover:text-destructive transition-colors">
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form.Field>
                ) : (
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
                )}
              </div>

              {/* Education Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="size-5 text-primary" />
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">Education</h3>
                </div>

                <div className="relative pt-2 sm:pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50 hidden sm:block"></div>

                  {isEditing ? (
                    <form.Field name="education">
                      {(field) => (
                        <textarea
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="E.g. Master of Computer Science - Stanford University"
                          className="w-full min-h-[120px] p-5 bg-secondary/50 border border-border/50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all font-medium text-foreground relative z-10"
                        />
                      )}
                    </form.Field>
                  ) : (
                    <div className="relative z-10">
                      <div className="absolute -left-[22px] top-2 size-3 rounded-full bg-primary ring-4 ring-primary/20 hidden sm:block"></div>
                      <p className="text-foreground text-lg leading-relaxed font-semibold">
                        {viewValues.education || <span className="text-muted-foreground italic font-normal text-base">No education details added yet.</span>}
                      </p>
                    </div>
                  )}
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
  const tenantDetails = tenantQuery.data as any;
  const { isAuthenticated, user: authUser, logout } = useAuthStore();
  const router = useRouter();

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
