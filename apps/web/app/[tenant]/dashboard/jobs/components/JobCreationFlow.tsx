"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useCreateJobApiV1JobsPost } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useExecuteWorkflowApiV1OrchestrateExecutePost, useConfirmWorkflowApiV1OrchestrateConfirmPost } from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";
import { useUploadSasApiV1CandidatesUploadSasPost } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employees/employees";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";
import { Dropdown } from "@/components/_shared/Dropdown";

const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
  pipeline_stages: z.string().optional(),
  max_outside_applicants: z.string().optional(),
  hiring_manager_id: z.string().optional(),
  recruiter_id: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobCreationFlowProps {
  onComplete: () => void;
}

export default function JobCreationFlow({ onComplete }: JobCreationFlowProps) {
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // API Mutations
  const { mutate: createJob, isPending: isCreating } = useCreateJobApiV1JobsPost();
   const { mutateAsync: executeWorkflow, isPending: isExecuting } = useExecuteWorkflowApiV1OrchestrateExecutePost();
   const { mutateAsync: confirmWorkflow, isPending: isConfirming } = useConfirmWorkflowApiV1OrchestrateConfirmPost();
   const { mutateAsync: getSasUrl } = useUploadSasApiV1CandidatesUploadSasPost();
   
   const [isUploadingFiles, setIsUploadingFiles] = useState(false);
   const isBusy = isExecuting || isConfirming || isUploadingFiles;

  const { data: employeesData } = useListEmployeesApiV1EmployeesGet({ skip: 0, limit: 100 });
  const employeesList = employeesData?.employees || [];

  const hiringManagerOptions = [
    { label: "Select Hiring Manager", value: "" },
    ...employeesList.map((emp: any) => ({
      label: `${emp.first_name} ${emp.last_name} (${emp.email})`,
      value: String(emp.id),
    })),
  ];

  const recruiterOptions = [
    { label: "Select Recruiter", value: "" },
    ...employeesList.map((emp: any) => ({
      label: `${emp.first_name} ${emp.last_name} (${emp.email})`,
      value: String(emp.id),
    })),
  ];

  const form = useForm({
    defaultValues: { 
      title: "", 
      description: "", 
      requirements: "", 
      pipeline_stages: "AI screening, HR Screening, Interview, Offer", 
      max_outside_applicants: "",
      hiring_manager_id: "",
      recruiter_id: ""
    },
    onSubmit: async ({ value }) => {
      const role_bindings: Record<string, string> = {};
      if (value.hiring_manager_id) role_bindings["hiring-manager"] = value.hiring_manager_id;
      if (value.recruiter_id) role_bindings["recruiter"] = value.recruiter_id;

      createJob({
        data: {
          title: value.title,
          description: value.description,
          requirements: value.requirements,
          pipeline_stages: value.pipeline_stages ? value.pipeline_stages.split(",").map(s => s.trim()).filter(Boolean) : ["AI screening", "HR Screening", "Interview", "Offer"],
          max_outside_applicants: value.max_outside_applicants ? parseInt(value.max_outside_applicants, 10) : undefined,
          role_bindings: Object.keys(role_bindings).length > 0 ? role_bindings : undefined,
        } as any
      }, {
        onSuccess: (response: any) => {
          // The backend returns 'id', not 'job_id'
          setCreatedJobId(response?.id?.toString() || "created");
          toast.success("Job created successfully!");
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

  const handleUploadAndProcess = async () => {
    if (!selectedFiles.length) return;
    setIsUploadingFiles(true);

    try {
      const candidateIds: number[] = [];
      
      // 1. Upload Phase
      for (const file of selectedFiles) {
        const res: any = await getSasUrl({ data: { filename: file.name } });
        
        await fetch(res.upload_url, {
          method: "PUT",
          body: file,
          headers: { "x-ms-blob-type": "BlockBlob" },
        });
        
        candidateIds.push(res.candidate_id);
      }

      // 2. Execution Phase
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

      // 3. Confirmation Phase (Automatic)
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
    <form
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
      className="space-y-4"
    >
      <form.Field
        name="title"
        children={(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Job Title</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
        )}
      />

      <form.Field
        name="description"
        children={(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Description</label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-ring outline-none resize-none"
              placeholder="Roles and responsibilities..."
            />
          </div>
        )}
      />

      <form.Field
        name="requirements"
        children={(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Requirements</label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-ring outline-none resize-none"
              placeholder="Skills, experience..."
            />
          </div>
        )}
      />

      <form.Field
        name="pipeline_stages"
        children={(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Hiring Rounds (comma-separated)</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
              placeholder="e.g. Applied, Resume Screen, Tech Interview, Offer"
            />
          </div>
        )}
      />

      <form.Field
        name="max_outside_applicants"
        children={(field) => (
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Max Outside Applicants</label>
            <input
              id={field.name}
              type="number"
              min="0"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 focus:ring-2 focus:ring-ring outline-none"
              placeholder="Optional limit"
            />
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="hiring_manager_id"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Hiring Manager</label>
              <Dropdown
                options={hiringManagerOptions}
                value={field.state.value || ""}
                onChange={(val) => field.handleChange(val)}
                placeholder="Select Hiring Manager"
              />
            </div>
          )}
        />

        <form.Field
          name="recruiter_id"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-semibold" htmlFor={field.name}>Recruiter</label>
              <Dropdown
                options={recruiterOptions}
                value={field.state.value || ""}
                onChange={(val) => field.handleChange(val)}
                placeholder="Select Recruiter"
              />
            </div>
          )}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in zoom-in-95 duration-200">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border mt-4">
        <button
          type="submit"
          disabled={isCreating}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Job"}
        </button>
      </div>
    </form>
  );
}