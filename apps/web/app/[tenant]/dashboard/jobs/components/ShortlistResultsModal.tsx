"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/_shared/Modal";
import {
  useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet,
  useUpdateEvaluationApiV1JobsJobIdEvaluationsEvaluationIdPatch,
  getGetJobEvaluationsApiV1JobsJobIdEvaluationsGetQueryKey
} from "@repo/orval-config/src/api/job/jobs/jobs";
import {
  useGetMyRequestsApiV1ApprovalsMyRequestsGet,
  useGetPendingApprovalsApiV1ApprovalsPendingGet
} from "@repo/orval-config/src/api/tenant/approvals/approvals";
import { EvaluationDetailModal } from "./EvaluationDetailModal";
import { RefreshCw, Check, X, Calendar } from "lucide-react";
import { toast } from "react-toastify";

import { useListInterviewsApiV1InterviewsGet } from "@repo/orval-config/src/api/interview/interviews/interviews";



interface ShortlistResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
    pipeline_stages?: string[];
  } | null;
}

export default function ShortlistResultsModal({ isOpen, onClose, job }: ShortlistResultsModalProps) {
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);

  const queryClient = useQueryClient();

  const { mutate: updateEvaluation } = useUpdateEvaluationApiV1JobsJobIdEvaluationsEvaluationIdPatch();

  const { data: evaluationsResponse, isLoading, refetch, isFetching } = useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet(
    job?.id || 0,
    {
      query: {
        enabled: isOpen && !!job?.id,
      } as any,
    }
  );

  const { data: myRequestsResponse, refetch: refetchMyRequests } = useGetMyRequestsApiV1ApprovalsMyRequestsGet({
    query: {
      enabled: isOpen,
    } as any
  });

  const { data: pendingApprovalsResponse, refetch: refetchPendingApprovals } = useGetPendingApprovalsApiV1ApprovalsPendingGet({
    query: {
      enabled: isOpen,
    } as any
  });

  const { data: interviewsResponse, refetch: refetchInterviews } = useListInterviewsApiV1InterviewsGet({
    job_id: job?.id
  }, {
    query: {
      enabled: isOpen && !!job?.id,
    } as any,
  });

  const allRequests = [
    ...(Array.isArray(myRequestsResponse) ? myRequestsResponse : []),
    ...(Array.isArray(pendingApprovalsResponse) ? pendingApprovalsResponse : [])
  ];

  const getCandidateApprovalRequest = (evalId: any) => {
    return allRequests.find((req: any) =>
      req.entity_type === "JobEvaluation" &&
      String(req.entity_id) === String(evalId) &&
      req.status === "pending"
    );
  };

  const handleRefetch = () => {
    queryClient.invalidateQueries({ queryKey: getGetJobEvaluationsApiV1JobsJobIdEvaluationsGetQueryKey(job?.id || 0) });
    refetch();
    refetchMyRequests();
    refetchPendingApprovals();
    refetchInterviews();
  };

  const allInterviews = Array.isArray(interviewsResponse) ? interviewsResponse : [];
  const allEvaluations = Array.isArray(evaluationsResponse) ? evaluationsResponse : [];

  const filteredEvaluations = allEvaluations.filter((ev: any) => (ev.current_stage_index || 0) === activeTabIndex);
  const evaluations = filteredEvaluations.map((ev: any) => {
    const interview = allInterviews.find((iv: any) => iv.candidate_id === ev.candidate_id && iv.round_number === ev.current_stage_index);
    return {
      ...ev,
      interview_status: interview?.status,
      display_status: interview?.status ? interview.status.replace(/_/g, " ").toLowerCase() : (ev.status || "completed").toLowerCase()
    };
  }).sort((a: any, b: any) => {
    if (a.display_status === "failed" && b.display_status !== "failed") return -1;
    if (b.display_status === "failed" && a.display_status !== "failed") return 1;
    return 0;
  });
  const stages = React.useMemo(() => {
    if (!job?.pipeline_stages) {
      return ["Evaluations"];
    }
    return job.pipeline_stages.map((stage: any) =>
      typeof stage === "string" ? stage : (stage?.name || "Unknown Round")
    );
  }, [job]);

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
    if (v.includes("shortlisted") || v.includes("selected") || v.includes("optimal") || v.includes("moving_forward")) {
      return "bg-success/10 text-success border-success/20";
    }
    if (v.includes("rejected") || v.includes("not recommended") || v.includes("not_selected")) {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  const handleDetailsClick = (ev: any) => {
    setSelectedEvaluation(ev);
    setIsDetailOpen(true);
  };

  const handleQuickAction = (ev: any, action: "forward" | "reject") => {
    if (!job) return;

    const isForward = action === "forward";
    const nextStageIndex = isForward ? (ev.current_stage_index || 0) + 1 : ev.current_stage_index;
    const isLastStage = nextStageIndex >= (job.pipeline_stages?.length || 1);

    updateEvaluation(
      {
        jobId: job.id,
        evaluationId: ev.id,
        data: {
          human_decision: isForward ? "Select" : "Reject",
          selection_status: isForward ? (isLastStage ? "Hired" : "Application_Under_Review") : "Not_Selected",
          current_stage_index: isLastStage && isForward ? ev.current_stage_index : nextStageIndex,
        }
      },
      {
        onSuccess: (res: any) => {
          const message = res?.message || res?.data?.message || `Candidate ${isForward ? 'moved forward' : 'rejected'}`;
          toast.success(message);
          handleRefetch();
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to update candidate status";
          toast.error(errorMsg);
        }
      }
    );
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
            onClick={handleRefetch}
            disabled={isFetching}
            className="text-primary hover:text-primary/80 disabled:opacity-50 transition-all p-1 hover:bg-primary/5 rounded-full"
            title="Refresh results"
          >
            <RefreshCw className={`w-3.5 h-3.5 hover:cursor-pointer ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {stages.length > 0 && (
          <div className="flex border-b border-border gap-6 px-2 overflow-x-auto custom-scrollbar pb-px">
            {stages.map((stage, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTabIndex(idx)}
                className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap hover:cursor-pointer ${activeTabIndex === idx
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {stage}
                <span className="ml-2 text-[10px] bg-muted/30 px-1.5 py-0.5 rounded-full font-bold">
                  {allEvaluations.filter((ev: any) => (ev.current_stage_index || 0) === idx).length}
                </span>
              </button>
            ))}
          </div>
        )}

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
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                      Fetching results...
                    </td>
                  </tr>
                ) : evaluations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
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
                        {getCandidateApprovalRequest(ev.id) ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                            Awaiting Approval
                          </span>
                        ) : (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getVerdictStyle(ev.selection_status)}`}>
                            {ev.selection_status ? ev.selection_status.replace(/_/g, " ") : "Pending"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-[11px] text-primary/70 font-medium lowercase">
                        {ev.display_status}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTabIndex > 0 && activeTabIndex < (job?.pipeline_stages?.length || 1) - 1 && ev.selection_status !== "Rejected" && ev.selection_status !== "Not_Selected" && (
                            <button
                              onClick={() => handleQuickAction(ev, "forward")}
                              className="w-7 h-7 flex items-center justify-center rounded bg-success/10 text-success hover:bg-success hover:text-white transition-colors"
                              title="Move to next round"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDetailsClick(ev)}
                            className="text-primary text-xs font-bold hover:underline hover:cursor-pointer ml-2"
                          >
                            Details →
                          </button>
                        </div>
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
        onSuccess={handleRefetch}
      />
    </Modal>

  );
}
