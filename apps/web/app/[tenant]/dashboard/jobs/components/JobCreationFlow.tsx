"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useCreateJobApiV1JobsPost } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useExecuteWorkflowApiV1OrchestrateExecutePost, useConfirmWorkflowApiV1OrchestrateConfirmPost } from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";
import { useUploadSasApiV1CandidatesUploadSasPost } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employees/employees";
import { useGetEnumValuesApiV1SuperadminEnumsGet } from "@repo/orval-config/src/api/superadmin/superadmin";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";
import { Dropdown } from "@/components/_shared/Dropdown";
import { DateTimePicker } from "@/components/_shared/DateTimePicker";
import { Country, State, City } from "country-state-city";
import { z } from "zod";
import { validateWith } from "@repo/ui/lib/validators";
import HiringRoundsPipelineBuilder from "./HiringRoundsPipelineBuilder";

// Zod validation schemas for job fields
const titleSchema = z.string().min(3, "Job title must be at least 3 characters.");
const employmentTypeSchema = z.string().min(1, "Employment type is required.");
const roleSummarySchema = z.string().min(10, "Role summary must be at least 10 characters.");
const citySchema = z.string().min(1, "City is required.");
const countrySchema = z.string().min(1, "Country is required.");
const applicationDeadlineSchema = z.string().min(1, "Application deadline is required.");

const salarySchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
    "Salary must be a non-negative number"
  );

const maxApplicantsSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
    "Max applicants must be a non-negative number"
  );

interface JobCreationFlowProps {
  onComplete: () => void;
}

export default function JobCreationFlow({ onComplete }: JobCreationFlowProps) {
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // API Mutations
  const { mutate: createJob, isPending: isCreating } = useCreateJobApiV1JobsPost();
  const { mutateAsync: executeWorkflow, isPending: isExecuting } = useExecuteWorkflowApiV1OrchestrateExecutePost();
  const { mutateAsync: confirmWorkflow, isPending: isConfirming } = useConfirmWorkflowApiV1OrchestrateConfirmPost();
  const { mutateAsync: getSasUrl } = useUploadSasApiV1CandidatesUploadSasPost();

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const isBusy = isExecuting || isConfirming || isUploadingFiles;

  // Fetch employees for HM / Recruiter
  const { data: employeesData } = useListEmployeesApiV1EmployeesGet({ skip: 0, limit: 100 });
  const employeesList = employeesData?.employees || [];

  // Fetch enums from superadmin service
  const { data: enums } = useGetEnumValuesApiV1SuperadminEnumsGet();

  const recruitingManagerOptions = [
    { label: "Select Recruiting Manager", value: "" },
    ...employeesList
      .filter((emp: any) => {
        const roleStr = (emp.tenant_role || emp.role || "").toLowerCase();
        return roleStr.includes("recruiting-manager") || roleStr.includes("recruiting manager") || roleStr.includes("recruiting_manager");
      })
      .map((emp: any) => ({
        label: `${emp.first_name} ${emp.last_name} (${emp.email})`,
        value: String(emp.id),
      })),
  ];

  // Map enum lists to DropdownOptions
  const jobCategoryOptions = [
    { label: "Select Category", value: "" },
    ...((enums as any)?.job_categories || [
      "Engineering", "Design", "Marketing", "Sales", "Product", "HR", "Finance", "Operations", "Other"
    ]).map((val: string) => ({ label: val, value: val }))
  ];

  const experienceLevelOptions = [
    { label: "Select Experience Level", value: "" },
    ...((enums as any)?.experience_levels || [
      "Internship", "Entry-level", "Associate", "Mid-level", "Senior", "Director", "Executive"
    ]).map((val: string) => ({ label: val, value: val }))
  ];

  const employmentTypeOptions = [
    { label: "Select Employment Type", value: "" },
    ...((enums as any)?.employment_types || [
      "Full-time", "Part-time", "Contract", "Internship", "Temporary"
    ]).map((val: string) => ({ label: val, value: val }))
  ];

  const workplaceModelOptions = [
    { label: "Select Workplace Model", value: "" },
    ...((enums as any)?.workplace_models || [
      "On-site", "Hybrid", "Remote"
    ]).map((val: string) => ({ label: val, value: val }))
  ];

  const compensationTypeOptions = [
    { label: "Select Compensation Type", value: "" },
    ...((enums as any)?.compensation_types || [
      "Hourly", "Salaried", "Commission"
    ]).map((val: string) => ({ label: val, value: val }))
  ];

  const form = useForm({
    defaultValues: {
      title: "",
      jobCategory: "",
      experienceLevel: "",
      employmentType: "",
      workplaceModel: "",
      department: "",
      city: "",
      state: "",
      country: "",
      roleSummary: "",
      keyResponsibilities: "",
      mustHaveRequirements: "",
      preferredQualifications: "",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      compensationType: "",
      benefitsSummary: "",
      applicationDeadline: "",
      pipeline_stages: [
        { name: "AI Screening" }
      ],
      max_outside_applicants: "",
      hiring_manager_id: ""
    },
    onSubmit: async ({ value }) => {
      // Validate Step 3 fields before submitting using Zod
      const countryRes = countrySchema.safeParse(value.country);
      if (!countryRes.success) {
        setError(countryRes.error?.issues[0]?.message || "Country is required.");
        form.validate("change");
        return;
      }
      const cityRes = citySchema.safeParse(value.city);
      if (!cityRes.success) {
        setError(cityRes.error?.issues[0]?.message || "City is required.");
        form.validate("change");
        return;
      }
      const deadlineRes = applicationDeadlineSchema.safeParse(value.applicationDeadline);
      if (!deadlineRes.success) {
        setError(deadlineRes.error?.issues[0]?.message || "Application deadline is required.");
        form.validate("change");
        return;
      }
      if (value.max_outside_applicants) {
        const maxAppRes = maxApplicantsSchema.safeParse(value.max_outside_applicants);
        if (!maxAppRes.success) {
          setError(maxAppRes.error?.issues[0]?.message || "Invalid max applicants.");
          form.validate("change");
          return;
        }
      }

      setError(null);

      const role_bindings: Record<string, string> = {};
      if (value.hiring_manager_id) role_bindings["hiring-manager"] = value.hiring_manager_id;

      // Construct API payload matching JSON Schema 100%
      const payload = {
        title: value.title,
        jobTitle: value.title,
        description: value.roleSummary,
        jobCategory: value.jobCategory || undefined,
        experienceLevel: value.experienceLevel || undefined,
        employmentType: value.employmentType,
        workplaceModel: value.workplaceModel || undefined,
        department: value.department || undefined,
        location: {
          city: value.city,
          state: value.state || undefined,
          country: value.country,
        },
        roleDescription: {
          roleSummary: value.roleSummary,
          keyResponsibilities: value.keyResponsibilities
            ? value.keyResponsibilities.split("\n").map(s => s.trim()).filter(Boolean)
            : [],
        },
        candidateQualifications: {
          mustHaveRequirements: value.mustHaveRequirements
            ? value.mustHaveRequirements.split("\n").map(s => s.trim()).filter(Boolean)
            : [],
          preferredQualifications: value.preferredQualifications
            ? value.preferredQualifications.split("\n").map(s => s.trim()).filter(Boolean)
            : [],
        },
        compensationAndBenefits: {
          salaryMin: value.salaryMin ? parseFloat(value.salaryMin) : undefined,
          salaryMax: value.salaryMax ? parseFloat(value.salaryMax) : undefined,
          currency: value.currency || "USD",
          compensationType: value.compensationType || undefined,
          benefitsSummary: value.benefitsSummary
            ? value.benefitsSummary.split("\n").map(s => s.trim()).filter(Boolean)
            : [],
        },
        applicationLogistics: value.applicationDeadline
          ? { applicationDeadline: new Date(value.applicationDeadline).toISOString() }
          : undefined,
        pipeline_stages: value.pipeline_stages && value.pipeline_stages.length > 0
          ? value.pipeline_stages
          : [{ name: "AI Screening" }],
        max_outside_applicants: value.max_outside_applicants ? parseInt(value.max_outside_applicants, 10) : undefined,

        role_bindings: Object.keys(role_bindings).length > 0 ? role_bindings : undefined,
      };

      createJob({
        data: payload as any
      }, {
        onSuccess: (response: any) => {
          setCreatedJobId(response?.id?.toString() || "created");
          toast.success("Job board opening created successfully!");
        },
        onError: (err: any) => {
          if (err?.response?.status === 403) {
            setError(err?.response?.data?.detail || "You don't have permission to create jobs.");
          } else {
            const errMsg = err?.response?.data?.detail || "Failed to create job. Please try again.";
            setError(errMsg);
          }
        }
      });
    },
  });

  const handleNextStep1 = () => {
    setError(null);
    const val = form.state.values;
    const titleRes = titleSchema.safeParse(val.title);
    if (!titleRes.success) {
      setError(titleRes.error?.issues[0]?.message || "Job title must be at least 3 characters.");
      form.validate("change");
      return;
    }
    const typeRes = employmentTypeSchema.safeParse(val.employmentType);
    if (!typeRes.success) {
      setError(typeRes.error?.issues[0]?.message || "Employment type is required.");
      form.validate("change");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setError(null);
    const val = form.state.values;
    const summaryRes = roleSummarySchema.safeParse(val.roleSummary);
    if (!summaryRes.success) {
      setError(summaryRes.error?.issues[0]?.message || "Role summary must be at least 10 characters.");
      form.validate("change");
      return;
    }
    if (val.salaryMin) {
      const minRes = salarySchema.safeParse(val.salaryMin);
      if (!minRes.success) {
        setError("Min salary: " + (minRes.error?.issues[0]?.message || "invalid"));
        form.validate("change");
        return;
      }
    }
    if (val.salaryMax) {
      const maxRes = salarySchema.safeParse(val.salaryMax);
      if (!maxRes.success) {
        setError("Max salary: " + (maxRes.error?.issues[0]?.message || "invalid"));
        form.validate("change");
        return;
      }
    }
    if (val.salaryMin && val.salaryMax && Number(val.salaryMin) > Number(val.salaryMax)) {
      setError("Min salary cannot be greater than max salary.");
      return;
    }
    setCurrentStep(3);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFiles.length) return;
    setIsUploadingFiles(true);

    try {
      const candidateIds: number[] = [];

      for (const file of selectedFiles) {
        const res: any = await getSasUrl({ data: { filename: file.name } });

        await fetch(res.upload_url, {
          method: "PUT",
          body: file,
          headers: { "x-ms-blob-type": "BlockBlob" },
        });

        candidateIds.push(res.candidate_id);
      }

      const executeRes: any = await executeWorkflow({
        data: {
          workflow_name: "candidate_screening",
          quantity: candidateIds.length,
          payload: {
            job_id: createdJobId,
            candidate_ids: candidateIds,
            mode: "normal"
          }
        }
      });

      if (executeRes?.correlation_id) {
        await confirmWorkflow({
          data: {
            correlation_id: executeRes.correlation_id
          }
        });
      }

      onComplete();

    } catch (error) {
      console.error("Failed to upload resumes:", error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  if (createdJobId) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/20 text-success-foreground mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-foreground text-xl font-bold mb-1">Job Created</h2>
          <p className="text-muted-foreground text-xs uppercase font-semibold">Job ID: {createdJobId}</p>
        </div>

        <div className="bg-muted/30 border border-border border-dashed p-6 text-center rounded-xl mb-6">
          <input
            type="file"
            multiple
            accept=".pdf,.docx"
            className="hidden"
            id="resume-upload-job"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          />
          <label
            htmlFor="resume-upload-job"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-5 py-2.5 rounded-md font-medium hover:cursor-pointer inline-block transition-colors mb-4"
          >
            Browse Resumes
          </label>
          <p className="text-muted-foreground text-sm">Upload resumes to parse them into this job's hiring rounds.</p>

          {selectedFiles.length > 0 && (
            <div className="mt-4 text-left bg-background border border-border rounded-lg p-3 max-h-32 overflow-y-auto">
              <ul className="space-y-1">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs text-foreground">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive hover:cursor-pointer">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground text-sm font-medium hover:cursor-pointer">
            Skip for now
          </button>
          <button
            onClick={handleUploadAndProcess}
            disabled={selectedFiles.length === 0 || isBusy}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50"
          >
            {isBusy ? "Processing..." : "Upload & Parse"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Step Progress Indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[
          { step: 1, label: "Basic Details" },
          { step: 2, label: "Role & Salary" },
          { step: 3, label: "Logistics & Settings" }
        ].map((item, idx) => (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${currentStep === item.step
                ? "bg-primary border-primary text-primary-foreground"
                : currentStep > item.step
                  ? "bg-success/20 border-success text-success"
                  : "bg-muted border-border text-muted-foreground"
                }`}>
                {currentStep > item.step ? "✓" : item.step}
              </div>
              <span className={`text-[10px] font-bold tracking-wider uppercase ${currentStep === item.step ? "text-primary" : "text-muted-foreground"
                }`}>
                {item.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-[2px] mx-4 -mt-6 transition-all ${currentStep > item.step ? "bg-success" : "bg-border"
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
        className="space-y-4"
      >
        {/* STEP 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <form.Field
              name="title"
              validators={{
                onChange: ({ value }) => validateWith(titleSchema)(value),
              }}
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                    Job Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="employmentType"
                validators={{
                  onChange: ({ value }) => validateWith(employmentTypeSchema)(value),
                }}
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold">
                      Employment Type <span className="text-destructive">*</span>
                    </label>
                    <Dropdown
                      options={employmentTypeOptions}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select Employment Type"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="workplaceModel"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold">Workplace Model</label>
                    <Dropdown
                      options={workplaceModelOptions}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select Workplace Model"
                    />
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="jobCategory"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold">Job Category</label>
                    <Dropdown
                      options={jobCategoryOptions}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select Job Category"
                    />
                  </div>
                )}
              />

              <form.Field
                name="experienceLevel"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold">Experience Level</label>
                    <Dropdown
                      options={experienceLevelOptions}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select Experience Level"
                    />
                  </div>
                )}
              />
            </div>

            <form.Field
              name="department"
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Department</label>
                  <input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
                    placeholder="e.g. Engineering, Sales, Human Resources"
                  />
                </div>
              )}
            />
          </div>
        )}

        {/* STEP 2: Role Details & Salary */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <form.Field
              name="roleSummary"
              validators={{
                onChange: ({ value }) => validateWith(roleSummarySchema)(value),
              }}
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                    Role Summary <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[90px] focus:ring-2 focus:ring-ring outline-none resize-none"
                    placeholder="Brief description of the role and team..."
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            <form.Field
              name="keyResponsibilities"
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                    Key Responsibilities <span className="text-muted-foreground text-xs font-normal">(one per line)</span>
                  </label>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[70px] focus:ring-2 focus:ring-ring outline-none resize-none"
                    placeholder="e.g. Design next-gen APIs&#10;Lead core frontend engineering architecture"
                  />
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="mustHaveRequirements"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                      Must-Have Requirements <span className="text-muted-foreground text-xs font-normal">(one per line)</span>
                    </label>
                    <textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[70px] focus:ring-2 focus:ring-ring outline-none resize-none"
                      placeholder="e.g. 5+ years React experience&#10;B.S. in CS or equivalent"
                    />
                  </div>
                )}
              />

              <form.Field
                name="preferredQualifications"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                      Preferred Qualifications <span className="text-muted-foreground text-xs font-normal">(one per line)</span>
                    </label>
                    <textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[70px] focus:ring-2 focus:ring-ring outline-none resize-none"
                      placeholder="e.g. GraphQL, Next.js experience&#10;Strong communication skills"
                    />
                  </div>
                )}
              />
            </div>

            <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
              <span className="text-foreground text-sm font-bold block mb-3">Compensation & Benefits</span>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <form.Field
                  name="compensationType"
                  children={(field) => (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-foreground text-xs font-semibold">Compensation Type</label>
                      <Dropdown
                        options={compensationTypeOptions}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        placeholder="Select Type"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="currency"
                  children={(field) => (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-foreground text-xs font-semibold" htmlFor={field.name}>Currency</label>
                      <input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-background text-foreground border border-input rounded-md px-3 py-2 h-10 text-sm focus:ring-2 focus:ring-ring outline-none"
                        placeholder="e.g. USD, EUR"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <form.Field
                  name="salaryMin"
                  validators={{
                    onChange: ({ value }) => validateWith(salarySchema)(value),
                  }}
                  children={(field) => (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-foreground text-xs font-semibold" htmlFor={field.name}>Min CTC (LPA)</label>
                      <input
                        id={field.name}
                        type="number"
                        min="0"
                        step="any"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-background text-foreground border border-input rounded-md px-3 py-2 h-10 text-sm focus:ring-2 focus:ring-ring outline-none"
                        placeholder="e.g. 6.5"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                />

                <form.Field
                  name="salaryMax"
                  validators={{
                    onChange: ({ value }) => validateWith(salarySchema)(value),
                  }}
                  children={(field) => (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-foreground text-xs font-semibold" htmlFor={field.name}>Max CTC (LPA)</label>
                      <input
                        id={field.name}
                        type="number"
                        min="0"
                        step="any"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-background text-foreground border border-input rounded-md px-3 py-2 h-10 text-sm focus:ring-2 focus:ring-ring outline-none"
                        placeholder="e.g. 12.0"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="benefitsSummary"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-xs font-semibold" htmlFor={field.name}>
                      Benefits Summary <span className="text-muted-foreground text-[10px] font-normal">(one per line)</span>
                    </label>
                    <textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background text-foreground border border-input rounded-md px-3 py-1.5 min-h-[50px] text-xs focus:ring-2 focus:ring-ring outline-none resize-none"
                      placeholder="e.g. Health insurance&#10;401k matching&#10;Unlimited PTO"
                    />
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Location, Logistics & Settings */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
              <span className="text-foreground text-sm font-bold block mb-3">Workplace Location</span>

              <div className="grid grid-cols-3 gap-3">
                <form.Field
                  name="country"
                  validators={{
                    onChange: ({ value }) => validateWith(countrySchema)(value),
                  }}
                  children={(field) => {
                    const countryOptions = Country.getAllCountries().map((c) => ({
                      label: c.name,
                      value: c.isoCode,
                    }));
                    const currentIso = Country.getAllCountries().find((c) => c.name === field.state.value)?.isoCode || "";

                    return (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-foreground text-xs font-semibold">
                          Country <span className="text-destructive">*</span>
                        </label>
                        <Dropdown
                          options={countryOptions}
                          value={currentIso}
                          onChange={(val) => {
                            const selected = Country.getCountryByCode(val);
                            field.handleChange(selected ? selected.name : "");
                            form.setFieldValue("state", "");
                            form.setFieldValue("city", "");
                          }}
                          placeholder="Select Country"
                          searchable={true}
                          searchPlaceholder="Search country..."
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-[11px] text-destructive font-medium mt-1">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />

                <form.Field
                  name="state"
                  children={(field) => {
                    const currentCountryName = form.state.values.country;
                    const currentCountry = Country.getAllCountries().find((c) => c.name === currentCountryName);
                    const currentCountryIso = currentCountry?.isoCode || "";
                    const states = currentCountryIso ? State.getStatesOfCountry(currentCountryIso) : [];
                    const stateOptions = states.map((s) => ({
                      label: s.name,
                      value: s.isoCode,
                    }));
                    const currentIso = states.find((s) => s.name === field.state.value)?.isoCode || "";

                    return (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-foreground text-xs font-semibold">State / Region</label>
                        <Dropdown
                          options={stateOptions}
                          value={currentIso}
                          disabled={!currentCountryIso || states.length === 0}
                          onChange={(val) => {
                            const selected = State.getStateByCodeAndCountry(val, currentCountryIso);
                            field.handleChange(selected ? selected.name : "");
                            form.setFieldValue("city", "");
                          }}
                          placeholder={
                            !currentCountryIso
                              ? "Select country first"
                              : states.length === 0
                                ? "N/A (No states)"
                                : "Select State"
                          }
                          searchable={true}
                          searchPlaceholder="Search state..."
                        />
                      </div>
                    );
                  }}
                />

                <form.Field
                  name="city"
                  validators={{
                    onChange: ({ value }) => validateWith(citySchema)(value),
                  }}
                  children={(field) => {
                    const currentCountryName = form.state.values.country;
                    const currentCountry = Country.getAllCountries().find((c) => c.name === currentCountryName);
                    const currentCountryIso = currentCountry?.isoCode || "";

                    const currentStateName = form.state.values.state;
                    const states = currentCountryIso ? State.getStatesOfCountry(currentCountryIso) : [];
                    const currentState = states.find((s) => s.name === currentStateName);
                    const currentStateIso = currentState?.isoCode || "";

                    // Fetch cities
                    let cities: any[] = [];
                    if (currentCountryIso) {
                      if (states.length > 0 && currentStateIso) {
                        cities = City.getCitiesOfState(currentCountryIso, currentStateIso) || [];
                      } else if (states.length === 0) {
                        cities = City.getCitiesOfCountry(currentCountryIso) || [];
                      }
                    }

                    const cityOptions = cities.map((c) => ({
                      label: c.name,
                      value: c.name,
                    }));

                    const showTextInput = currentCountryIso && cities.length === 0;

                    return (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-foreground text-xs font-semibold">
                          City <span className="text-destructive">*</span>
                        </label>
                        {showTextInput ? (
                          <input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
                            placeholder="Enter City"
                          />
                        ) : (
                          <Dropdown
                            options={cityOptions}
                            value={field.state.value}
                            disabled={!currentCountryIso || (states.length > 0 && !currentStateIso)}
                            onChange={(val) => field.handleChange(val)}
                            placeholder={
                              !currentCountryIso
                                ? "Select country first"
                                : states.length > 0 && !currentStateIso
                                  ? "Select state first"
                                  : "Select City"
                            }
                            searchable={true}
                            searchPlaceholder="Search city..."
                          />
                        )}
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-[11px] text-destructive font-medium mt-1">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="applicationDeadline"
                validators={{
                  onChange: ({ value }) => validateWith(applicationDeadlineSchema)(value),
                }}
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>
                      Application Deadline <span className="text-destructive">*</span>
                    </label>
                    <DateTimePicker
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select deadline date & time"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="max_outside_applicants"
                validators={{
                  onChange: ({ value }) => validateWith(maxApplicantsSchema)(value),
                }}
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Max Outside Applicants</label>
                    <input
                      id={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
                      placeholder="Optional limit"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[11px] text-destructive font-medium mt-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <form.Field
                name="hiring_manager_id"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Recruiting Manager</label>
                    <Dropdown
                      options={recruitingManagerOptions}
                      value={field.state.value || ""}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select Recruiting Manager"
                    />
                  </div>
                )}
              />
            </div>

            <form.Field
              name="pipeline_stages"
              children={(field) => (
                <div className="mt-4">
                  <HiringRoundsPipelineBuilder
                    stages={field.state.value || []}
                    onChange={(updated) => field.handleChange(updated)}
                    employeesList={employeesList}
                    isCreationMode={true}
                  />
                </div>
              )}
            />

          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in zoom-in-95 duration-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-5 py-2 rounded-md font-medium hover:cursor-pointer transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={currentStep === 1 ? handleNextStep1 : handleNextStep2}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isCreating}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isCreating ? "Creating..." : "Create Job"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}