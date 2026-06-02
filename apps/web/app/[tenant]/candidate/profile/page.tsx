"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building,
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
  X
} from "lucide-react";
import axios from "axios";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useSaveCandidateMeApiV1CandidatesMePost, useCandidateMeUploadSasApiV1CandidatesMeUploadSasPost } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
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

  const [step, setStep] = useState(1);
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

        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          router.push(`/${tenant}/candidate/dashboard`);
        }
      } catch (err: any) {
        console.error("Error saving profile:", err);
        toast.error(err?.response?.data?.detail || "Failed to save profile");
      }
    },
  });

  // Pre-fill values from authenticated user details
  useEffect(() => {
    if (user) {
      form.setFieldValue("name", user.name || `${user.first_name || ""} ${user.family_name || ""}`.trim());
    }
  }, [user]);

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
      toast.error("Failed to upload resume to Azure Storage");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    const values = form.state.values;

    if (step === 1) {
      // Validate Step 1 locally with Zod
      const check = step1Schema.safeParse({
        name: values.name,
        phone: values.phone,
        keyRole: values.keyRole,
        experience: Number(values.experience),
      });

      if (!check.success) {
        const errorMsg = check.error.issues[0]?.message || "Please fill in all required fields";
        toast.warning(errorMsg);
        return;
      }
    }

    if (step === 2) {
      if (!values.resumeUrl) {
        toast.warning("Please upload your resume in PDF format to proceed");
        return;
      }
    }

    setStep(step + 1);
  };

  const loading = saveMutation.isPending;

  return (
    <div className="w-full max-w-2xl p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-2xl space-y-8 relative">
      
      {/* Decorative top accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      {/* Steps Indicator */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Step {step} of 3</span>
          <h2 className="text-xl font-black text-white">
            {step === 1 && "Personal & Professional Overview"}
            {step === 2 && "Resume Upload"}
            {step === 3 && "Education & Skills Setup"}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step 
                  ? "w-8 bg-indigo-500" 
                  : s < step 
                  ? "w-2 bg-emerald-500" 
                  : "w-2 bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Onboarding Wizard Steps */}
      <div className="min-h-[280px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Jane Doe"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-655"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-660 size-4" />
                    <Input 
                      value={user?.email || ""}
                      disabled
                      placeholder="jane.doe@example.com"
                      className="pl-10 bg-slate-950/40 border-slate-800/80 rounded-xl text-sm text-slate-505 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="phone">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field name="keyRole">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Target Role *</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Senior Fullstack Engineer"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="experience">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Years of Experience</Label>
                    <Input 
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      className="bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm"
                    />
                  </div>
                )}
              </form.Field>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex flex-col items-center"
            >
              <p className="text-xs text-slate-400 font-semibold text-center max-w-md leading-relaxed">
                Please upload your resume in PDF format. Our AI scanning model will automatically parse your experience and align it with company open roles.
              </p>

              <form.Field name="resumeUrl">
                {(field) => (
                  <div className="w-full">
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-850 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 rounded-[1.5rem] cursor-pointer transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <>
                            <div className="size-8 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
                            <p className="text-xs text-slate-400 font-bold">Uploading PDF directly to cloud...</p>
                          </>
                        ) : field.state.value ? (
                          <>
                            <FileCheck className="size-10 text-emerald-400 mb-3 animate-pulse" />
                            <p className="text-xs font-bold text-slate-200">
                              {file ? file.name : "Resume Uploaded"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">Click or drag new PDF to overwrite</p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="size-10 text-slate-600 mb-3" />
                            <p className="text-xs font-bold text-slate-300">Select PDF resume</p>
                            <p className="text-[10px] text-slate-500 mt-1">PDF format only, maximum size 10MB</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.values.resumeUrl}>
                {(resumeUrl) => resumeUrl && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="size-4" /> Ready for submission
                  </div>
                )}
              </form.Subscribe>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="linkedin">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">LinkedIn Profile URL</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field name="github">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">GitHub Profile URL</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://github.com/username"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="education">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Highest Level of Education</Label>
                    <Input 
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Master of Computer Science - Stanford University"
                      className="bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-650"
                    />
                  </div>
                )}
              </form.Field>

              {/* Skills Tags Builder */}
              <form.Field name="skills">
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400">Skills & Tech Stack</Label>
                    
                    <div className="flex gap-2">
                      <Input 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="React, PyTorch, Go..."
                        className="bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm flex-1 placeholder:text-slate-650"
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
                        className="bg-slate-950 border border-slate-800 text-slate-355 hover:bg-slate-900 rounded-xl px-4 flex items-center justify-center shrink-0"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {field.state.value.map((skill) => (
                        <span 
                          key={skill}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg"
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => {
                              field.handleChange(field.state.value.filter(s => s !== skill));
                            }}
                            className="text-indigo-400 hover:text-indigo-200 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      {field.state.value.length === 0 && (
                        <span className="text-[10px] text-slate-505 font-semibold italic">No skills listed yet</span>
                      )}
                    </div>
                  </div>
                )}
              </form.Field>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
        <Button
          disabled={step === 1 || loading}
          onClick={() => setStep(step - 1)}
          variant="ghost"
          className="text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl"
        >
          <ChevronLeft className="size-4 mr-1.5" /> Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={handleContinue}
            className="text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl px-5 flex items-center gap-1.5"
          >
            Continue <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={() => form.handleSubmit()}
            disabled={loading}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 font-bold"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                Save & Finish <Sparkles className="size-4 text-white animate-pulse" />
              </>
            )}
          </Button>
        )}
      </div>

    </div>
  );
}

export default function CandidateProfilePage() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating brand link */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Building className="size-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-300">
          {tenant.toUpperCase()} Portal
        </span>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-semibold">Loading setup wizard...</p>
        </div>
      }>
        <CandidateProfileFormContent />
      </Suspense>

    </div>
  );
}
