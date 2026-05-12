"use client";

import React from "react";
import { Modal } from "@/components/_shared/Modal";
import { useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { EvaluationDetailModal } from "./EvaluationDetailModal";
import { RefreshCw } from "lucide-react";



interface ShortlistResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
  } | null;
}

export default function ShortlistResultsModal({ isOpen, onClose, job }: ShortlistResultsModalProps) {
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const { data: evaluationsResponse, isLoading, refetch, isFetching } = useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet(
    job?.id || 0,
    {
      query: {
        enabled: isOpen && !!job?.id,
      },
    }
  );


  const evaluations = Array.isArray(evaluationsResponse) ? evaluationsResponse : [];

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerdictStyle = (verdict: string) => {
    const v = verdict?.toLowerCase() || "";
    if (v.includes("shortlisted") || v.includes("selected") || v.includes("optimal")) {
      return "bg-success/10 text-success border-success/20";
    }
    if (v.includes("rejected") || v.includes("not recommended")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  const handleDetailsClick = (ev: any) => {
    setSelectedEvaluation(ev);
    setIsDetailOpen(true);
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shortlist results"
    >
      <div className="flex flex-col gap-4">
        <div className="-mt-3 flex justify-between items-center">
          <p className="text-sm text-primary font-medium">{job?.title}</p>
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-primary hover:text-primary/80 disabled:opacity-50 transition-all p-1 hover:bg-primary/5 rounded-full"
            title="Refresh results"
          >
            <RefreshCw className={`w-3.5 h-3.5 hover:cursor-pointer ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>


        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">CANDIDATE</th>
                  <th className="px-4 py-3 text-center">SCORE</th>
                  <th className="px-4 py-3 text-center">VERDICT</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                      Fetching results...
                    </td>
                  </tr>
                ) : evaluations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                      No results found for this job.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 shrink-0">
                            {getInitials(ev.candidate_name || ev.candidate?.name || "Unknown")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-foreground truncate">
                              {ev.candidate_name || ev.candidate?.name || "Unknown"}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {ev.candidate_email || ev.candidate?.email || "No email provided"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold text-primary">
                          {Math.round(ev.fit_score ?? 0)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-0.5">/100</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getVerdictStyle(ev.selection_status)}`}>
                          {ev.selection_status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-[11px] text-primary/70 font-medium lowercase">
                        {ev.status || "completed"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => handleDetailsClick(ev)}
                          className="text-primary text-xs font-bold hover:underline hover:cursor-pointer"
                        >
                          Details →
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <EvaluationDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        evaluation={selectedEvaluation}
      />
    </Modal>

  );
}
