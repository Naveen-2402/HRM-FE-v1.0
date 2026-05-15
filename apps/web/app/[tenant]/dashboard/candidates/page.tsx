"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import { Dropdown, DropdownOption } from "@/components/_shared/Dropdown";
import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { 
  useGetJobsApiV1JobsGet
} from "@repo/orval-config/src/api/job/jobs/jobs";
import {
  useExecuteWorkflowApiV1OrchestrateExecutePost,
  useConfirmWorkflowApiV1OrchestrateConfirmPost
} from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";
import { 
  useUploadSasApiV1CandidatesUploadSasPost,
  useGetCandidatesApiV1CandidatesGet,
  useDeleteCandidateApiV1CandidatesCandidateIdDelete
} from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { 
  useGetCreditBalanceApiV1BillingCreditsGet 
} from "@repo/orval-config/src/api/billing/billing/billing";
import { customInstance } from "@repo/orval-config/src/axios-setup";
import { toast } from "react-toastify";
import { SectionCard } from "@/components/_shared";
import { RefreshCcw, UserPlus, Zap, Filter, Search, ChevronDown, Download, Eye, Trash2 } from "lucide-react";

export default function CandidatesPage() {
  const params = useParams();
  const tenantId = params?.tenant as string;

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  
  // Data
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [targetJobId, setTargetJobId] = useState<string>("");

  // Upload Flow State
  type Step = "select" | "estimate" | "dispatched";
  const [uploadStep, setUploadStep] = useState<Step>("select");
  const [uploadEstimate, setUploadEstimate] = useState<any>(null);
  const [uploadCorrelationId, setUploadCorrelationId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Shortlist Flow State
  const [shortlistStep, setShortlistStep] = useState<Step>("select");
  const [shortlistEstimate, setShortlistEstimate] = useState<any>(null);
  const [shortlistCorrelationId, setShortlistCorrelationId] = useState<string | null>(null);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

  // API: Fetch Jobs for the dropdown
  const { data: jobsResponse } = useGetJobsApiV1JobsGet();
  const jobs = Array.isArray(jobsResponse) ? jobsResponse : [];

  // API: Fetch Candidates (Resume Bank)
  const { data: candidatesResponse, isLoading, refetch, isFetching } = useGetCandidatesApiV1CandidatesGet();
  const candidates = Array.isArray(candidatesResponse) ? candidatesResponse : [];

  // API: Delete Candidate
  const { mutate: deleteCandidate, isPending: isDeletingCandidate } = useDeleteCandidateApiV1CandidatesCandidateIdDelete();

  // API: Fetch Credits Balance (Public API)
  const { data: creditsData } = useGetCreditBalanceApiV1BillingCreditsGet();
  const credits = creditsData 
    ? (creditsData as any).credit_balance - (creditsData as any).consumed_credits - (creditsData as any).reserved_credits
    : 0;

  // API: Orchestrator Mutation for uploading/processing
  const { mutateAsync: executeWorkflow, isPending: isExecuting } = useExecuteWorkflowApiV1OrchestrateExecutePost();
  const { mutateAsync: confirmWorkflow, isPending: isConfirming } = useConfirmWorkflowApiV1OrchestrateConfirmPost();
  const { mutateAsync: getSasUrl } = useUploadSasApiV1CandidatesUploadSasPost();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [investigationMode, setInvestigationMode] = useState<string>("normal");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const isBusy = isExecuting || isConfirming || isUploadingFiles;

  const investigationOptions: DropdownOption[] = [
    { label: "Normal — standard web search", value: "normal" },
    { label: "Deep — extensive background check", value: "deep" }
  ];

  const jobOptions: DropdownOption[] = [
    { label: "Select a job...", value: "" },
    ...jobs.map((j: any) => ({ label: j.title, value: j?.id?.toString() }))
  ];

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadStep("select");
    setUploadEstimate(null);
    setUploadCorrelationId(null);
    setUploadError(null);
    setSelectedFiles([]);
  };

  const handleUploadEstimate = async () => {
    if (!selectedFiles.length) return;
    setIsUploadingFiles(true);
    setUploadError(null);

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

      // 2. Execution Phase (Estimate)
      const executeRes: any = await executeWorkflow({
        data: {
          workflow_name: "resume_bank_ingestion",
          quantity: candidateIds.length,
          payload: {
            candidate_ids: candidateIds,
            mode: investigationMode
          }
        }
      });

      if (executeRes?.correlation_id) {
        setUploadCorrelationId(executeRes.correlation_id);
        setUploadEstimate(executeRes);
        setUploadStep("estimate");
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setUploadError(error?.response?.data?.detail || "You don't have permission to perform this action.");
      } else if (error?.response?.status === 402) {
        setUploadError("Insufficient credits. Please top up your balance.");
      } else {
        console.error("Failed to get upload estimate:", error);
        setUploadError(error?.response?.data?.detail || "Failed to estimate cost. Please try again.");
      }
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadCorrelationId) return;
    setUploadError(null);
    try {
      await confirmWorkflow({
        data: { correlation_id: uploadCorrelationId }
      });
      setUploadStep("dispatched");
      toast.success("Resumes uploaded and processing started!");
      refetch();
    } catch (error: any) {
      console.error("Confirmation failed:", error);
      setUploadError(error?.response?.data?.detail || "Failed to confirm.");
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCandidate({ candidateId: deleteId }, {
      onSuccess: () => {
        toast.success("Candidate deleted successfully");
        refetch();
        setDeleteId(null);
      },
      onError: (error: any) => {
        console.error("Delete failed:", error);
        toast.error(error?.response?.data?.detail || "Failed to delete candidate");
      }
    });
  };

  const handleViewFile = async (candidateId: number, filePath: string) => {
    if (!filePath) return;
    try {
      const res: any = await customInstance({
        url: `/api/v1/candidates/${candidateId}/download-sas`,
        method: 'GET',
        params: { file_path: filePath }
      });
      if (res?.download_url) {
        window.open(res.download_url, '_blank');
      }
    } catch (error) {
      console.error("Failed to get download URL:", error);
      toast.error("Could not open file");
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success("JSON copied to clipboard!"))
        .catch(() => toast.error("Failed to copy JSON."));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("JSON copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy JSON.");
      } finally {
        textArea.remove();
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleCandidateSelection = (id: number) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCloseShortlistModal = () => {
    setIsShortlistModalOpen(false);
    setShortlistStep("select");
    setShortlistEstimate(null);
    setShortlistCorrelationId(null);
    setShortlistError(null);
    setSelectedCandidateIds([]);
    setTargetJobId("");
  };

  const handleShortlistEstimate = async () => {
    if (selectedCandidateIds.length === 0 || !targetJobId) {
      toast.warn("Please select candidates and a target job.");
      return;
    }
    setShortlistError(null);

    try {
      const executeRes: any = await executeWorkflow({
        data: {
          workflow_name: "on_demand_shortlisting",
          quantity: selectedCandidateIds.length,
          payload: {
            candidate_ids: selectedCandidateIds,
            job_id: parseInt(targetJobId)
          }
        }
      });

      if (executeRes?.correlation_id) {
        setShortlistCorrelationId(executeRes.correlation_id);
        setShortlistEstimate(executeRes);
        setShortlistStep("estimate");
      }
    } catch (error: any) {
      console.error("Shortlist estimate failed:", error);
      setShortlistError(error?.response?.data?.detail || "Failed to estimate cost.");
    }
  };

  const handleShortlistConfirm = async () => {
    if (!shortlistCorrelationId) return;
    setShortlistError(null);

    try {
      await confirmWorkflow({
        data: { correlation_id: shortlistCorrelationId }
      });
      toast.success(`Shortlisting started for ${selectedCandidateIds.length} candidates!`);
      setShortlistStep("dispatched");
      refetch();
    } catch (error: any) {
      console.error("Confirmation failed:", error);
      setShortlistError(error?.response?.data?.detail || "Failed to confirm.");
    }
  };

  const statsTotal = candidates.length;
  const statsParsed = candidates.filter((c: any) => c.status?.toLowerCase() === "completed" || !c.status).length;

  return (
    <div className="bg-background min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-tight">Candidate Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-2">
             {statsTotal} total · {statsParsed} parsed · <span className="text-primary font-semibold">{credits} credits</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsShortlistModalOpen(true)}
            className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer flex items-center gap-2 transition-all hover:bg-secondary/80"
          >
            Shortlist
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <UserPlus className="size-4" /> Upload resumes
          </button>
          <button 
            onClick={() => refetch()}
            className="bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer transition-all hover:bg-secondary/80"
          >
            <RefreshCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <SectionCard className="overflow-hidden p-0 border-border/40">
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium">NAME</th>
              <th className="px-4 py-3 font-medium">PHONE</th>
              <th className="px-4 py-3 font-medium">ROLE</th>
              <th className="px-4 py-3 font-medium text-center">EXP</th>
              <th className="px-4 py-3 font-medium">SKILLS</th>
              <th className="px-4 py-3 font-medium">LINKS</th>
              <th className="px-4 py-3 font-medium text-center">DATA</th>
              <th className="px-4 py-3 font-medium text-center">STATUS</th>
              <th className="px-4 py-3 font-medium text-center">FILES</th>
              <th className="px-4 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading candidates...</td></tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground italic text-sm">No candidates found in the pipeline.</p>
                  </div>
                </td>
              </tr>
            ) : candidates.map((c: any) => (
              <tr key={c.id} className="border-b border-border hover:bg-muted/10">
                <td className="px-4 py-3 text-primary font-medium">{c.name || "—"}</td>
                <td className="px-4 py-3 text-primary font-medium">{c.phone_number || "—"}</td>
                <td className="px-4 py-3 text-foreground font-medium">{c.key_role || "—"}</td>
                <td className="px-4 py-3 text-center text-primary font-medium">{c.experience_years || 0} yr</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {(c.skills || []).slice(0, 2).map((skill: string) => (
                      <span key={skill} className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/10 font-medium">
                        {skill}
                      </span>
                    ))}
                    {(c.skills || []).length > 2 && (
                      <span className="text-primary text-[10px] font-bold">+{(c.skills || []).length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-[11px]">
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" className="text-primary hover:underline font-medium">LinkedIn</a>}
                    {c.github_url && <a href={c.github_url} target="_blank" className="text-primary hover:underline font-medium">GitHub</a>}
                    {!c.linkedin_url && !c.github_url && <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => { setSelectedCandidate(c); setIsJsonModalOpen(true); }}
                    className="border border-primary/20 text-primary px-3 py-1 rounded text-[11px] font-medium bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    View JSON
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-success/10 text-success border border-success px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    {c.status || "Completed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button 
                      onClick={() => handleViewFile(c.id, c.resume_blob_url)}
                      className="bg-warning/10 text-warning border border-warning/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-warning/20"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={() => handleViewFile(c.id, c.parsed_md_url)}
                      className="bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-success/20"
                    >
                      MD
                    </button>
                    <button 
                      onClick={() => handleViewFile(c.id, c.dossier_md_url)}
                      className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-primary/20"
                    >
                      AI
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => setDeleteId(c.id)}
                    className="text-destructive text-xs hover:cursor-pointer font-medium hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </SectionCard>

      {/* Upload Modal with Orchestrator Mutation */}
      <Modal isOpen={isUploadModalOpen} onClose={handleCloseUploadModal} title="Upload resumes">
        <div className="space-y-4 pb-2">
          {uploadStep === "select" && (
            <>
              <p className="text-sm text-primary -mt-3 mb-4 font-medium">PDF or DOCX • Upload new resumes for parsing</p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investigation Mode</label>
                <Dropdown options={investigationOptions} value={investigationMode} onChange={setInvestigationMode} className="w-full" />
              </div>

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

              {uploadError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {uploadError}
                </p>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-border mt-4">
                <button onClick={handleCloseUploadModal} className="px-5 py-2 text-foreground font-medium border border-border rounded-md hover:bg-muted/30 transition-colors hover:cursor-pointer">
                  Cancel
                </button>
                <div className="relative flex items-center justify-center">
                  {!selectedFiles.length ? (
                    <>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:cursor-pointer">
                        Select files
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleUploadEstimate}
                      disabled={isBusy}
                      className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? "Estimating..." : "Get Estimate →"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {uploadStep === "estimate" && uploadEstimate && (
            <>
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resumes</span>
                  <span className="font-semibold text-foreground">{selectedFiles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available credits</span>
                  <span className="font-semibold text-foreground">
                    {uploadEstimate.available_credits ?? "—"}
                  </span>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Estimated cost</span>
                  <span className={`font-bold text-base ${uploadEstimate.sufficient ? "text-success-foreground" : "text-destructive"}`}>
                    {uploadEstimate.total_estimated ?? "—"} credits
                  </span>
                </div>
                {!uploadEstimate.sufficient && (
                  <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
                    Insufficient credits. Please top up your balance before proceeding.
                  </p>
                )}
              </div>

              {uploadEstimate.breakdown && uploadEstimate.breakdown.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Cost Breakdown
                  </p>
                  {uploadEstimate.breakdown.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-muted-foreground px-2 py-1 bg-muted/20 rounded"
                    >
                      <span>{b.service} · {b.action}</span>
                      <span className="font-medium text-foreground">{b.estimated_credits} cr</span>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {uploadError}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
                <button
                  onClick={() => setUploadStep("select")}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium hover:cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleUploadConfirm}
                  disabled={!uploadEstimate.sufficient || isConfirming}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50 transition-opacity"
                >
                  {isConfirming ? "Confirming..." : "Confirm & Parse"}
                </button>
              </div>
            </>
          )}

          {uploadStep === "dispatched" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-foreground font-bold text-lg">Parsing started!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {selectedFiles.length} resume{selectedFiles.length !== 1 ? "s are" : " is"} being parsed.
                </p>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer mt-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Shortlist Modal */}
      <Modal isOpen={isShortlistModalOpen} onClose={handleCloseShortlistModal} title="Shortlist candidates">
        <div className="flex flex-col gap-4 py-2">
          {shortlistStep === "select" && (
            <>
              <div>
                <p className="text-[13px] text-primary font-medium">Select parsed candidates and a target job.</p>
              </div>

              <div className="mt-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-wider">Target Job</label>
                <Dropdown options={jobOptions} value={targetJobId} onChange={setTargetJobId} className="w-full mt-1" />
              </div>

              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Candidates · {selectedCandidateIds.length} Selected
                  </label>
                </div>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/10 max-h-[250px] overflow-y-auto">
                  {candidates.filter(c => c.status?.toLowerCase() === "completed" || !c.status).map((c: any) => (
                    <div 
                      key={c.id} 
                      onClick={() => toggleCandidateSelection(c.id)}
                      className="flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCandidateIds.includes(c.id)}
                        onChange={() => {}} 
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 shrink-0">
                        {getInitials(c.name || "Unknown")}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{c.name || "Unknown"}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.key_role || "No role specified"}</div>
                      </div>
                    </div>
                  ))}
                  {candidates.filter(c => c.status?.toLowerCase() === "completed" || !c.status).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-xs italic">
                      No parsed candidates available.
                    </div>
                  )}
                </div>
              </div>

              {shortlistError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {shortlistError}
                </p>
              )}

              <div className="flex gap-3 mt-4 pt-2">
                <button 
                  onClick={handleCloseShortlistModal}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleShortlistEstimate}
                  disabled={isExecuting || selectedCandidateIds.length === 0 || !targetJobId}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isExecuting ? "Estimating..." : `Get Estimate →`}
                </button>
              </div>
            </>
          )}

          {shortlistStep === "estimate" && shortlistEstimate && (
            <>
              <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Candidates</span>
                  <span className="font-semibold text-foreground">{selectedCandidateIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available credits</span>
                  <span className="font-semibold text-foreground">
                    {shortlistEstimate.available_credits ?? "—"}
                  </span>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Estimated cost</span>
                  <span className={`font-bold text-base ${shortlistEstimate.sufficient ? "text-success-foreground" : "text-destructive"}`}>
                    {shortlistEstimate.total_estimated ?? "—"} credits
                  </span>
                </div>
                {!shortlistEstimate.sufficient && (
                  <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
                    Insufficient credits. Please top up your balance before proceeding.
                  </p>
                )}
              </div>

              {shortlistEstimate.breakdown && shortlistEstimate.breakdown.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Cost Breakdown
                  </p>
                  {shortlistEstimate.breakdown.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-muted-foreground px-2 py-1 bg-muted/20 rounded"
                    >
                      <span>{b.service} · {b.action}</span>
                      <span className="font-medium text-foreground">{b.estimated_credits} cr</span>
                    </div>
                  ))}
                </div>
              )}

              {shortlistError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {shortlistError}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
                <button
                  onClick={() => setShortlistStep("select")}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium hover:cursor-pointer transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleShortlistConfirm}
                  disabled={!shortlistEstimate.sufficient || isConfirming}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50 transition-opacity"
                >
                  {isConfirming ? "Confirming..." : "Confirm & Start"}
                </button>
              </div>
            </>
          )}

          {shortlistStep === "dispatched" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-foreground font-bold text-lg">Shortlisting started!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {selectedCandidateIds.length} candidate{selectedCandidateIds.length !== 1 ? "s are" : " is"} being evaluated.
                </p>
              </div>
              <button
                onClick={handleCloseShortlistModal}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer mt-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* JSON Viewer Modal */}
      <Modal isOpen={isJsonModalOpen} onClose={() => setIsJsonModalOpen(false)} title="Extracted profile JSON">
        <div className="relative group">
          <button 
            onClick={() => copyToClipboard(JSON.stringify(selectedCandidate, null, 2))}
            className="absolute right-4 top-4 bg-muted text-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Copy
          </button>
          <pre className="bg-slate-950 text-slate-100 p-6 rounded-lg text-xs overflow-x-auto max-h-[500px] font-mono leading-relaxed">
            {JSON.stringify(selectedCandidate, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Candidate"
        description="Are you sure you want to delete this candidate? This action cannot be undone."
        isLoading={isDeletingCandidate}
        isDestructive={true}
      />
    </div>
  );
}