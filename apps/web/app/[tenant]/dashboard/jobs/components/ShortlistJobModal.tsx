"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import {
  useGetCandidatesApiV1CandidatesGet,
} from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import {
  useExecuteWorkflowApiV1OrchestrateExecutePost,
  useConfirmWorkflowApiV1OrchestrateConfirmPost,
} from "@repo/orval-config/src/api/orchestrator/orchestrate/orchestrate";

interface ShortlistJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: { id: number; title: string } | null;
}

type Step = "select" | "estimate" | "dispatched";

export default function ShortlistJobModal({ isOpen, onClose, job }: ShortlistJobModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Candidates list
  const { data: candidatesRaw, isLoading: loadingCandidates } = useGetCandidatesApiV1CandidatesGet({
    query: { enabled: isOpen } as any,
  });
  const candidates: any[] = Array.isArray(candidatesRaw) ? candidatesRaw : [];
  const readyCandidates = candidates.filter((c) => c.status === "completed");

  // Orchestrator hooks
  const { mutate: executeWorkflow, isPending: isEstimating } =
    useExecuteWorkflowApiV1OrchestrateExecutePost();
  const { mutate: confirmWorkflow, isPending: isConfirming } =
    useConfirmWorkflowApiV1OrchestrateConfirmPost();

  const handleClose = () => {
    setStep("select");
    setSelectedIds([]);
    setEstimate(null);
    setCorrelationId(null);
    setError(null);
    onClose();
  };

  const toggleCandidate = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGetEstimate = () => {
    if (!job || selectedIds.length === 0) return;
    setError(null);

    executeWorkflow(
      {
        data: {
          workflow_name: "on_demand_shortlisting",
          quantity: selectedIds.length,
          payload: {
            job_id: job.id,
            candidate_ids: selectedIds,
          },
        },
      },
      {
        onSuccess: (res: any) => {
          setCorrelationId(res.correlation_id);
          setEstimate(res);
          setStep("estimate");
        },
        onError: (err: any) => {
          setError(err?.response?.data?.detail || "Failed to get estimate. Please try again.");
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!correlationId) return;
    setError(null);

    confirmWorkflow(
      { data: { correlation_id: correlationId } },
      {
        onSuccess: () => {
          setStep("dispatched");
        },
        onError: (err: any) => {
          setError(err?.response?.data?.detail || "Failed to confirm. Please try again.");
        },
      }
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Shortlist candidates">
      <div className="flex flex-col gap-4">
        {/* Job label */}
        <div className="-mt-3">
          <p className="text-sm text-primary font-medium">{job?.title}</p>
        </div>

        {/* ── Step 1: Select candidates ── */}
        {step === "select" && (
          <>
            <p className="text-xs text-muted-foreground">
              Select candidates from your pool to evaluate against this job.
              Only fully processed candidates are shown.
            </p>

            {loadingCandidates ? (
              <div className="py-10 text-center text-muted-foreground text-sm italic">
                Loading candidates...
              </div>
            ) : readyCandidates.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm italic">
                No processed candidates available.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {readyCandidates.map((c: any) => {
                    const checked = selectedIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        htmlFor={`cand-${c.id}`}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 ${
                          checked ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        <input
                          id={`cand-${c.id}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCandidate(c.id)}
                          className="accent-primary w-4 h-4 rounded shrink-0"
                        />
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 shrink-0">
                          {getInitials(c.name || "")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {c.name || "Unknown"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.key_role || c.email || "—"}
                          </p>
                        </div>
                        {checked && (
                          <span className="text-primary text-xs font-bold shrink-0">✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleGetEstimate}
                disabled={selectedIds.length === 0 || isEstimating}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50 transition-opacity"
              >
                {isEstimating ? "Getting estimate..." : "Get estimate →"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Confirm estimate ── */}
        {step === "estimate" && estimate && (
          <>
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Candidates</span>
                <span className="font-semibold text-foreground">{selectedIds.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available credits</span>
                <span className="font-semibold text-foreground">
                  {estimate.available_credits ?? "—"}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Estimated cost</span>
                <span className={`font-bold text-base ${estimate.sufficient ? "text-success-foreground" : "text-destructive"}`}>
                  {estimate.total_estimated ?? "—"} credits
                </span>
              </div>
              {!estimate.sufficient && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded">
                  Insufficient credits. Please top up your balance before proceeding.
                </p>
              )}
            </div>

            {/* Breakdown */}
            {estimate.breakdown && estimate.breakdown.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Cost Breakdown
                </p>
                {estimate.breakdown.map((b: any, i: number) => (
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

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => setStep("select")}
                className="text-muted-foreground hover:text-foreground text-sm font-medium hover:cursor-pointer transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!estimate.sufficient || isConfirming}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50 transition-opacity"
              >
                {isConfirming ? "Confirming..." : "Confirm & Start ⚡"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Dispatched ── */}
        {step === "dispatched" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-foreground font-bold text-lg">Shortlisting started!</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {selectedIds.length} candidate{selectedIds.length !== 1 ? "s are" : " is"} being evaluated.
                Results will appear in the Results tab shortly.
              </p>
            </div>
            <button
              onClick={handleClose}
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
