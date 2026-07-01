"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "react-toastify";
import { X, UploadCloud, FileCheck } from "lucide-react";
import axios from "axios";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { validateWith } from "@repo/ui/lib/validators";
import {
  useSaveCandidateMeApiV1CandidatesMePost,
  useCandidateMeUploadSasApiV1CandidatesMeUploadSasPost
} from "@repo/orval-config/src/api/candidate/candidates/candidates";

// ── Zod schemas ──
const nameSchema = z.string().min(2, "Full name must be at least 2 characters");
const phoneSchema = z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits");
const keyRoleSchema = z.string().min(2, "Target role must be at least 2 characters");
const linkedinSchema = z.string().url("Please enter a valid URL").regex(
  /^https?:\/\/(www\.)?linkedin\.com\/.+/i,
  "Must be a valid LinkedIn URL (e.g. https://linkedin.com/in/...)"
);
const githubSchema = z.string().url("Please enter a valid URL").regex(
  /^https?:\/\/(www\.)?github\.com\/.+/i,
  "Must be a valid GitHub URL (e.g. https://github.com/...)"
);
const emailSchema = z.string().min(1, "Email is required").email("Please enter a valid email address");
const skillSchema = z.string().min(1, "Skill must be at least 1 character");

const skillsSchema = z.array(z.string()).min(1, "At least one skill is required");
const resumeSchema = z.string().min(1, "Resume is required");

const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  keyRole: keyRoleSchema,
  experience: z.number().min(0, "Experience years must be positive"),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  skills: skillsSchema,
  education: z.string().optional(),
  resumeUrl: resumeSchema,
});

type ProfileFields = z.infer<typeof profileSchema>;

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantDetails: any;
  existingProfile: any;
  refetchProfile: () => void;
}

/** Reusable required-field asterisk */
const RequiredMark = () => <span className="text-red-400 ml-0.5">*</span>;

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

export function CreateProfileModal({ isOpen, onClose, tenantDetails, existingProfile, refetchProfile }: CreateProfileModalProps) {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState<string | undefined>(undefined);
  const [resumeError, setResumeError] = useState<string | undefined>(undefined);

  const sasMutation = useCandidateMeUploadSasApiV1CandidatesMeUploadSasPost({
    request: { headers: { "X-Tenant-Id": tenantDetails?.id || "" } }
  } as any);

  const saveMutation = useSaveCandidateMeApiV1CandidatesMePost({
    request: { headers: { "X-Tenant-Id": tenantDetails?.id || "" } }
  } as any);

  const form = useForm({
    defaultValues: {
      name: existingProfile?.name || user?.name || `${user?.first_name || ""} ${user?.family_name || ""}`.trim(),
      email: existingProfile?.email || user?.email || "",
      phone: existingProfile?.phone_number || "",
      keyRole: existingProfile?.key_role || "",
      experience: parseInt(existingProfile?.experience_years) || 0,
      linkedin: existingProfile?.linkedin_url || "",
      github: existingProfile?.github_url || "",
      skills: existingProfile?.skills || [],
      education: formatEducation(existingProfile?.education) || "",
      resumeUrl: existingProfile?.resume_blob_url || ""
    } as ProfileFields,
    onSubmit: async ({ value }) => {
      if (!tenantDetails?.id) return;

      try {
        const payload = {
          name: value.name,
          email: value.email,
          phone_number: value.phone,
          key_role: value.keyRole,
          experience_years: String(value.experience),
          linkedin_url: value.linkedin,
          github_url: value.github,
          skills: value.skills,
          education: value.education,
          resume_blob_url: value.resumeUrl
        };

        await saveMutation.mutateAsync({ data: payload as any });
        toast.success("Profile saved successfully!");
        await refetchProfile();
        onClose();
      } catch (err: any) {
        console.error("Error saving profile:", err);
        toast.error(err?.response?.data?.detail || "Failed to save profile");
      }
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !tenantDetails?.id) return;

    if (selectedFile.type !== "application/pdf") {
      toast.warning("Please upload a PDF file");
      return;
    }

    setFile(selectedFile);
    try {
      setUploading(true);
      const sasRes = (await sasMutation.mutateAsync({
        data: { filename: selectedFile.name }
      })) as any;

      const { upload_url, blob_path } = (sasRes.data || sasRes) as any;

      await axios.put(upload_url, selectedFile, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": selectedFile.type
        }
      });

      form.setFieldValue("resumeUrl", blob_path);
      setResumeError(undefined);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading resume:", err);
      toast.error("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  /** Validate and add a skill tag */
  const handleAddSkill = (field: any) => {
    const trimmed = newSkill.trim();
    const error = validateWith(skillSchema)(trimmed);
    if (error) {
      setSkillError(error);
      return;
    }
    if (field.state.value.includes(trimmed)) {
      setSkillError("Skill already added");
      return;
    }
    field.handleChange([...field.state.value, trimmed]);
    setNewSkill("");
    setSkillError(undefined);
  };

  const loading = saveMutation.isPending;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl border border-border relative flex flex-col"
        >
          <div className="sticky top-0 bg-card/90 backdrop-blur-sm z-20 px-8 py-6 border-b border-border">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Complete Your Profile</h2>
            <p className="text-muted-foreground text-sm mt-1">Tell us about yourself to discover the best opportunities.</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => validateWith(nameSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Full Name<RequiredMark /></Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="Jane Doe"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Email */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => validateWith(emailSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Email<RequiredMark /></Label>
                    <Input
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="you@example.com"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Phone Number */}
              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) => validateWith(phoneSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Phone Number<RequiredMark /></Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="9876543210"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Target Role */}
              <form.Field
                name="keyRole"
                validators={{
                  onChange: ({ value }) => validateWith(keyRoleSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Target Role<RequiredMark /></Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Years of Experience */}
              <form.Field name="experience">
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Years of Experience<RequiredMark /></Label>
                    <Input
                      type="number"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Math.max(0, Number(e.target.value)))}
                      className="bg-secondary/50"
                    />
                  </div>
                )}
              </form.Field>

              {/* LinkedIn URL */}
              <form.Field
                name="linkedin"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return undefined;
                    return validateWith(linkedinSchema)(value);
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">LinkedIn URL</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="https://linkedin.com/in/..."
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="github"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return undefined;
                    return validateWith(githubSchema)(value);
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">GitHub URL</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-secondary/50"
                      placeholder="https://github.com/..."
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Education Details */}
            <form.Field
              name="education"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return undefined;
                  return validateWith(z.string().min(2, "Education must be at least 2 characters"))(value);
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Education Details</Label>
                  <textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="E.g. B.S. in Computer Science - University of Tech"
                    className="w-full min-h-[100px] p-4 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Skills */}
            <form.Field
              name="skills"
              validators={{
                onChange: ({ value }) => validateWith(skillsSchema)(value),
              }}
            >
              {(field) => (
                <div className="space-y-4">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Skills<RequiredMark /></Label>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={newSkill}
                        onChange={(e) => {
                          setNewSkill(e.target.value);
                          if (skillError) setSkillError(undefined);
                        }}
                        placeholder="Type a skill and press Enter..."
                        className="bg-secondary/50 border-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(field);
                          }
                        }}
                      />
                      {skillError && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{skillError}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddSkill(field);
                      }}
                      className="px-6 cursor-pointer"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {field.state.value.map((skill) => (
                      <div key={skill} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-sm">
                        <span className="font-semibold text-foreground">{skill}</span>
                        <button type="button" onClick={() => field.handleChange(field.state.value.filter(s => s !== skill))} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Resume Upload */}
            <form.Field
              name="resumeUrl"
              validators={{
                onChange: ({ value }) => validateWith(resumeSchema)(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Resume (PDF)<RequiredMark /></Label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${field.state.meta.errors.length > 0 && !field.state.value ? 'border-red-400/50' : 'border-border'} hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 rounded-xl cursor-pointer transition-all`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                      ) : field.state.value ? (
                        <>
                          <FileCheck className="size-6 text-primary mb-2" />
                          <p className="text-sm font-bold text-foreground">{file ? file.name : "Resume Uploaded"}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="size-6 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold text-muted-foreground">Upload Resume (PDF)</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
                  </label>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <div className="sticky bottom-0 bg-card/90 backdrop-blur-sm p-6 border-t border-border flex justify-end gap-4 rounded-b-[2rem]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-6 rounded-xl font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Skip
            </Button>
            <Button onClick={() => form.handleSubmit()} disabled={loading} className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              {loading ? <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" /> : null}
              Save Profile
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
