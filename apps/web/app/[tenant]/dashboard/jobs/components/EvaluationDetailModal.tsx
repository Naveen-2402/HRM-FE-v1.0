"use client";

import React from "react";
import { Modal } from "@/components/_shared/Modal";

interface EvaluationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: any;
}

export function EvaluationDetailModal({ isOpen, onClose, evaluation }: EvaluationDetailModalProps) {
  if (!evaluation) return null;

  const scoreReasoning = evaluation.reasoning_json?.score_reasoning || {};
  const categories = Object.keys(scoreReasoning);

  const getVerdictStyle = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("shortlisted") || s.includes("selected") || s.includes("optimal")) {
      return "bg-success/10 text-success border-success/20";
    }
    if (s.includes("rejected") || s.includes("not recommended")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  const formatKey = (key: string) => {
    return key.replace(/_/g, " ").toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={evaluation.candidate_name || "Candidate Details"}
    >
      <div className="flex flex-col gap-6 -mt-2">
        <div className="-mt-4 mb-2">
          <p className="text-sm text-primary/70">{evaluation.candidate_email}</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-black text-primary mb-1">
              {Math.round(evaluation.fit_score || 0)}
            </div>
            <div className="text-xs font-medium text-primary/60 uppercase tracking-wider">
              Fit score / 100
            </div>
          </div>
          
          <div className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center ${getVerdictStyle(evaluation.selection_status)}`}>
            <div className="text-xl font-bold mb-1">
              {evaluation.selection_status || "Pending"}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              Verdict
            </div>
          </div>
        </div>

        {/* AI Reasoning Section */}
        <div className="flex flex-col gap-8">
          {/* Reasoning Highlights */}
          {(evaluation.detailed_scoring_json?.phase2?.the_golden_trait || evaluation.detailed_scoring_json?.phase2?.the_fatal_flaw) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation.detailed_scoring_json.phase2.the_golden_trait && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <h4 className="text-[10px] font-bold text-success uppercase tracking-wider mb-2">The Golden Trait</h4>
                  <p className="text-sm text-foreground/80 italic">"{evaluation.detailed_scoring_json.phase2.the_golden_trait}"</p>
                </div>
              )}
              {evaluation.detailed_scoring_json.phase2.the_fatal_flaw && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <h4 className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2">The Fatal Flaw</h4>
                  <p className="text-sm text-foreground/80 italic">"{evaluation.detailed_scoring_json.phase2.the_fatal_flaw}"</p>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              AI Reasoning
              <div className="h-px bg-primary/10 flex-1"></div>
            </h3>
            
            <div className="flex flex-col gap-3">
              {categories.map((key) => (
                <div key={key} className="bg-muted/30 border border-border/50 rounded-lg p-4 transition-all hover:border-primary/20">
                  <h4 className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-2">
                    {formatKey(key)}
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {scoreReasoning[key]}
                  </p>
                </div>
              ))}

              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No reasoning details available.
                </p>
              )}
            </div>
          </div>

          {/* Interview Focus */}
          {evaluation.detailed_scoring_json?.phase2?.interview_focus && (
            <div>
              <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                Interview Focus
                <div className="h-px bg-primary/10 flex-1"></div>
              </h3>
              <div className="bg-primary/5 border border-primary/20 border-dashed rounded-lg p-4">
                <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {evaluation.detailed_scoring_json.phase2.interview_focus}
                </p>
              </div>
            </div>
          )}

          {/* Verdict Why */}
          {(evaluation.detailed_scoring_json?.phase2?.verdict_why || evaluation.detailed_scoring_json?.phase2?.fit_why) && (
            <div>
              <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                Verdict Rationale
                <div className="h-px bg-primary/10 flex-1"></div>
              </h3>
              <div className="flex flex-col gap-3">
                {evaluation.detailed_scoring_json.phase2.verdict_why && (
                  <div className="text-sm text-foreground/70 bg-muted/20 p-3 rounded border border-border/30">
                    <span className="font-bold text-primary/60 mr-2">VERDICT:</span>
                    {evaluation.detailed_scoring_json.phase2.verdict_why}
                  </div>
                )}
                {evaluation.detailed_scoring_json.phase2.fit_why && (
                  <div className="text-sm text-foreground/70 bg-muted/20 p-3 rounded border border-border/30">
                    <span className="font-bold text-primary/60 mr-2">FIT:</span>
                    {evaluation.detailed_scoring_json.phase2.fit_why}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional perspective notes if available */}
        {evaluation.reasoning_json?.perspective_notes && (
          <div>
            <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              Perspective Notes
              <div className="h-px bg-primary/10 flex-1"></div>
            </h3>
            <div className="flex flex-col gap-3">
              {Object.entries(evaluation.reasoning_json.perspective_notes).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                   <h4 className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-2">
                    {formatKey(key)}
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
