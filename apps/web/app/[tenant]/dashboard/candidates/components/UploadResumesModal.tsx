"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { Dropdown, DropdownOption } from "@/components/_shared/Dropdown";
import { useUploadSasApiV1CandidatesUploadSasPost } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import {
  useExecuteWorkflowApiV1OrchestrateExecutePost,
  useConfirmWorkflowApiV1OrchestrateConfirmPost
} from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";
import { toast } from "react-toastify";

interface UploadResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResumesModal({ isOpen, onClose, onSuccess }: UploadResumesModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [investigationMode, setInvestigationMode] = useState<string>("normal");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadStep, setUploadStep] = useState<"select" | "estimate" | "dispatched">("select");
  const [uploadEstimate, setUploadEstimate] = useState<any>(null);
  const [uploadCorrelationId, setUploadCorrelationId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // API Hooks
  const { mutateAsync: executeWorkflow, isPending: isExecuting } = useExecuteWorkflowApiV1OrchestrateExecutePost();
  const { mutateAsync: confirmWorkflow, isPending: isConfirming } = useConfirmWorkflowApiV1OrchestrateConfirmPost();
  const { mutateAsync: getSasUrl } = useUploadSasApiV1CandidatesUploadSasPost();

  const isBusy = isExecuting || isConfirming || isUploadingFiles;

  const investigationOptions: DropdownOption[] = [
    { label: "Normal — standard web search", value: "normal" },
    { label: "Deep — extensive background check", value: "deep" }
  ];

  const handleCloseUploadModal = () => {
    setUploadStep("select");
    setUploadEstimate(null);
    setUploadCorrelationId(null);
    setUploadError(null);
    setSelectedFiles([]);
    onClose();
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
      onSuccess();
    } catch (error: any) {
      console.error("Confirmation failed:", error);
      setUploadError(error?.response?.data?.detail || "Failed to confirm.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseUploadModal} title="Upload resumes">
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
  );
}
