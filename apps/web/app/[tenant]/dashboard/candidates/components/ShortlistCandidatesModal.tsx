"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { Dropdown, DropdownOption } from "@/components/_shared/Dropdown";
import {
  useExecuteWorkflowApiV1OrchestrateExecutePost,
  useConfirmWorkflowApiV1OrchestrateConfirmPost
} from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";
import {
  useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet
} from "@repo/orval-config/src/api/job/jobs/jobs";
import { toast } from "react-toastify";

interface ShortlistCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: any[];
  jobOptions: DropdownOption[];
}

export default function ShortlistCandidatesModal({ isOpen, onClose, onSuccess, candidates, jobOptions }: ShortlistCandidatesModalProps) {
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [targetJobId, setTargetJobId] = useState<string>("");
  const [shortlistStep, setShortlistStep] = useState<"select" | "estimate" | "dispatched">("select");
  const [shortlistEstimate, setShortlistEstimate] = useState<any>(null);
  const [shortlistCorrelationId, setShortlistCorrelationId] = useState<string | null>(null);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

  // API Hooks
  const { mutateAsync: executeWorkflow, isPending: isExecuting } = useExecuteWorkflowApiV1OrchestrateExecutePost();
  const { mutateAsync: confirmWorkflow, isPending: isConfirming } = useConfirmWorkflowApiV1OrchestrateConfirmPost();

  // Fetch existing evaluations for the selected job to filter out already shortlisted candidates
  const { data: evaluationsResponse } = useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet(
    parseInt(targetJobId),
    {
      query: {
        enabled: !!targetJobId && isOpen,
      } as any,
    }
  );

  const existingEvaluations = Array.isArray(evaluationsResponse) ? evaluationsResponse : [];
  const shortlistedCandidateIds = existingEvaluations.map((e: any) => e.candidate_id);

  const availableCandidates = candidates.filter(
    (c) => (c.status?.toLowerCase() === "completed" || !c.status) && !shortlistedCandidateIds.includes(c.id)
  );

  const isBusy = isExecuting || isConfirming;

  const handleCloseShortlistModal = () => {
    setShortlistStep("select");
    setShortlistEstimate(null);
    setShortlistCorrelationId(null);
    setShortlistError(null);
    setSelectedCandidateIds([]);
    setTargetJobId("");
    onClose();
  };

  const handleTargetJobChange = (val: string) => {
    setTargetJobId(val);
    setSelectedCandidateIds([]);
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidateIds(prev => 
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleShortlistEstimate = async () => {
    if (!selectedCandidateIds.length || !targetJobId) return;
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
      if (error?.response?.status === 403) {
        setShortlistError(error?.response?.data?.detail || "You don't have permission to perform this action.");
      } else if (error?.response?.status === 402) {
        setShortlistError("Insufficient credits. Please top up your balance.");
      } else {
        console.error("Failed to get shortlist estimate:", error);
        setShortlistError(error?.response?.data?.detail || "Failed to estimate cost. Please try again.");
      }
    }
  };

  const handleShortlistConfirm = async () => {
    if (!shortlistCorrelationId) return;
    setShortlistError(null);
    try {
      await confirmWorkflow({
        data: { correlation_id: shortlistCorrelationId }
      });
      setShortlistStep("dispatched");
      toast.success("Shortlist workflow submitted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Confirmation failed:", error);
      setShortlistError(error?.response?.data?.detail || "Failed to confirm.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseShortlistModal} title="Shortlist candidates">
      <div className="flex flex-col gap-4 py-2">
        {shortlistStep === "select" && (
          <>
            <div>
              <p className="text-[13px] text-primary font-medium">Select parsed candidates and a target job.</p>
            </div>

            <div className="mt-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-wider">Target Job</label>
              <Dropdown options={jobOptions} value={targetJobId} onChange={handleTargetJobChange} className="w-full mt-1" />
            </div>

            <div className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Candidates · {selectedCandidateIds.length} Selected
                </label>
              </div>
              <div className="border border-border rounded-lg overflow-hidden bg-muted/10 max-h-[250px] overflow-y-auto">
                {availableCandidates.map((c: any) => (
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
                {availableCandidates.length === 0 && (
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
  );
}
