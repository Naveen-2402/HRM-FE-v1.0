"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  Check, 
  X,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@repo/ui/components/ui/button";
import { Modal } from "@/components/_shared/Modal";
import { useQuery } from "@tanstack/react-query";
import { customInstance } from "@repo/orval-config/src/axios-setup";

import {
  useGetPendingApprovalsApiV1ApprovalsPendingGet,
  useGetMyRequestsApiV1ApprovalsMyRequestsGet,
  useApproveRequestApiV1ApprovalsRequestIdApprovePost,
  useDenyRequestApiV1ApprovalsRequestIdDenyPost
} from "@repo/orval-config/src/api/tenant/approvals/approvals";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "my-requests">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcceptingResume, setIsAcceptingResume] = useState(false);
  const [isRejectingResume, setIsRejectingResume] = useState(false);

  // Queries
  const { 
    data: pendingResponse, 
    isLoading: isPendingLoading, 
    refetch: refetchPending, 
    isFetching: isPendingFetching 
  } = useGetPendingApprovalsApiV1ApprovalsPendingGet();

  // Query for pending resume evaluations
  const {
    data: pendingEvaluationsResponse,
    isLoading: isEvalsLoading,
    refetch: refetchEvals,
    isFetching: isEvalsFetching
  } = useQuery({
    queryKey: ["pending-evaluations"],
    queryFn: () => customInstance<any[]>({ url: "/api/v1/jobs/evaluations/pending", method: "GET" }),
  });

  const { 
    data: myRequestsResponse, 
    isLoading: isMyRequestsLoading, 
    refetch: refetchMyRequests,
    isFetching: isMyRequestsFetching
  } = useGetMyRequestsApiV1ApprovalsMyRequestsGet();

  // Mutations
  const { mutate: approveRequest, isPending: isApproving } = useApproveRequestApiV1ApprovalsRequestIdApprovePost();
  const { mutate: denyRequest, isPending: isDenying } = useDenyRequestApiV1ApprovalsRequestIdDenyPost();

  const standardPending = Array.isArray(pendingResponse) ? pendingResponse : [];
  const evalsPending = (Array.isArray(pendingEvaluationsResponse) ? pendingEvaluationsResponse : []).map((ev: any) => ({
    id: `eval-${ev.id}`,
    action_type: "ACCEPT_RESUME",
    status: "pending",
    created_at: ev.created_at,
    reason: `Candidate self-applied and uploaded a resume awaiting recruiter acceptance.`,
    entity_id: ev.id.toString(),
    entity_type: "JobEvaluation",
    request_payload: {
      candidate_name: ev.candidate_name,
      candidate_email: ev.candidate_email,
      job_title: ev.job_title,
      requester_name: ev.source === "self_applied" ? "Candidate (Self Applied)" : "Recruiter",
      job_id: ev.job_id,
      resume_snapshot_url: ev.resume_snapshot_url,
    }
  }));
  const pendingRequests = [...standardPending, ...evalsPending];
  const myRequests = Array.isArray(myRequestsResponse) ? myRequestsResponse : [];

  const handleRefetch = () => {
    if (activeTab === "pending") {
      refetchPending();
      refetchEvals();
    } else {
      refetchMyRequests();
    }
  };

  const handleOpenDetails = (req: any) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleApprove = (requestId: string) => {
    approveRequest(
      {
        requestId,
        data: { comment: "" }
      },
      {
        onSuccess: () => {
          toast.success("Request approved successfully.");
          setIsModalOpen(false);
          setSelectedRequest(null);
          refetchPending();
          refetchMyRequests();
        },
        onError: () => {
          toast.error("Failed to approve request.");
        }
      }
    );
  };

  const handleDeny = (requestId: string) => {
    denyRequest(
      {
        requestId,
        data: { comment: "" }
      },
      {
        onSuccess: () => {
          toast.info("Request denied/rejected.");
          setIsModalOpen(false);
          setSelectedRequest(null);
          refetchPending();
          refetchMyRequests();
        },
        onError: () => {
          toast.error("Failed to reject request.");
        }
      }
    );
  };

  const handleAcceptResume = (jobId: number, evaluationId: string) => {
    setIsAcceptingResume(true);
    customInstance<any>({
      url: `/api/v1/jobs/${jobId}/evaluations/${evaluationId}/accept-resume`,
      method: "POST",
    })
      .then(() => {
        toast.success("Resume accepted. Background parsing successfully triggered.");
        setIsModalOpen(false);
        setSelectedRequest(null);
        refetchPending();
        refetchEvals();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.detail || "Failed to accept resume.");
      })
      .finally(() => {
        setIsAcceptingResume(false);
      });
  };

  const handleRejectResume = (jobId: number, evaluationId: string) => {
    setIsRejectingResume(true);
    customInstance<any>({
      url: `/api/v1/jobs/${jobId}/evaluations/${evaluationId}/reject-resume`,
      method: "POST",
    })
      .then(() => {
        toast.info("Resume request denied/rejected.");
        setIsModalOpen(false);
        setSelectedRequest(null);
        refetchPending();
        refetchEvals();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.detail || "Failed to reject resume.");
      })
      .finally(() => {
        setIsRejectingResume(false);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 bg-success/10 text-success border border-success/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle className="size-3" /> Approved
          </span>
        );
      case "denied":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="size-3" /> Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Clock className="size-3" /> Pending
          </span>
        );
    }
  };

  const formatAction = (action: string) => {
    if (!action) return "Action Request";
    return action.replace(/_/g, " ").toUpperCase();
  };

  const filterRequests = (list: any[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(r => {
      const candidateName = r.request_payload?.candidate_name || "";
      const jobTitle = r.request_payload?.job_title || "";
      const requesterName = r.request_payload?.requester_name || r.requester_role || "";
      return (
        candidateName.toLowerCase().includes(query) ||
        jobTitle.toLowerCase().includes(query) ||
        requesterName.toLowerCase().includes(query) ||
        r.action_type?.toLowerCase().includes(query)
      );
    });
  };

  const displayedPending = filterRequests(pendingRequests);
  const displayedMyRequests = filterRequests(myRequests);

  const activeList = activeTab === "pending" ? displayedPending : displayedMyRequests;
  const isLoading = activeTab === "pending" ? (isPendingLoading || isEvalsLoading) : isMyRequestsLoading;
  const isFetching = activeTab === "pending" ? (isPendingFetching || isEvalsFetching) : isMyRequestsFetching;

  return (
    <div className="min-h-screen space-y-8 selection:bg-primary/30">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl flex items-center gap-3">
            <ClipboardList className="size-10 text-primary shrink-0" />
            Approvals Center
          </h1>
          <p className="text-sm font-medium text-muted-foreground/80 mt-1">
            Review and act on high-privilege configuration or candidate override requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefetch}
            disabled={isFetching}
            variant="outline"
            className="rounded-xl border-border/50 hover:bg-muted/50 text-foreground flex items-center gap-2"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs and Search ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab("pending"); setSearchQuery(""); }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap hover:cursor-pointer relative ${
              activeTab === "pending" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Reviews
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("my-requests"); setSearchQuery(""); }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap hover:cursor-pointer ${
              activeTab === "my-requests" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            My Requests
            {myRequests.length > 0 && (
              <span className="ml-2 bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-black">
                {myRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card/25 border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all text-foreground"
          />
        </div>
      </div>

      {/* ── Table List ── */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card/15 backdrop-blur-xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/20 border-b border-border font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Action Requested</th>
                <th className="px-6 py-4">Requester</th>
                <th className="px-6 py-4 text-center">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground italic">
                    <RefreshCw className="size-6 text-primary animate-spin mx-auto mb-2" />
                    Fetching ledger...
                  </td>
                </tr>
              ) : activeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="size-12 bg-muted/10 text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="size-6" />
                    </div>
                    <span className="font-bold">No requests found.</span>
                  </td>
                </tr>
              ) : (
                activeList.map((req) => {
                  const candidateName = req.request_payload?.candidate_name || "N/A";
                  const candidateEmail = req.request_payload?.candidate_email || "";
                  const jobTitle = req.request_payload?.job_title || req.entity_type;
                  const requesterName = req.request_payload?.requester_name || req.requester_role;
                  const requestedAction = formatAction(req.action_type);

                  return (
                    <tr key={req.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-foreground">{candidateName}</div>
                          {candidateEmail && <div className="text-[11px] text-muted-foreground">{candidateEmail}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">{jobTitle}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[11px] font-bold">
                          {requestedAction}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <User className="size-3 text-primary/70" />
                          {requesterName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-medium text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(req)}
                          className="text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-primary/20 hover:cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="size-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Details Dialog Modal ── */}
      {selectedRequest && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedRequest(null); }}
          title="Approval Details"
        >
          <div className="flex flex-col gap-6 mt-3 text-foreground">
            
            {/* Top overview stats cards */}
            {selectedRequest.action_type === "ACCEPT_RESUME" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Application Source
                  </div>
                  <div className="text-base font-black text-primary uppercase">
                    {selectedRequest.request_payload?.requester_name || "Self Applied"}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Job ID / Evaluation ID
                  </div>
                  <div className="text-base font-black text-primary uppercase">
                    #{selectedRequest.request_payload?.job_id} / #{selectedRequest.entity_id}
                  </div>
                </div>
              </div>
            ) : selectedRequest.action_type === "OVERRIDE_AI" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    AI Screening verdict
                  </div>
                  <div className="text-base font-black text-primary uppercase">
                    {selectedRequest.request_payload?.ai_decision || "N/A"}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Manual Override
                  </div>
                  <div className="text-base font-black text-amber-500 uppercase flex items-center gap-1 justify-center">
                    {selectedRequest.request_payload?.ai_decision || "N/A"} 
                    <ArrowRight className="size-3 text-muted-foreground" />
                    {selectedRequest.request_payload?.human_decision || "N/A"}
                  </div>
                </div>
              </div>
            ) : selectedRequest.action_type === "ACCEPT_CANDIDATE" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Current Stage
                  </div>
                  <div className="text-base font-black text-primary uppercase">
                    {selectedRequest.request_payload?.stage_name || "PENDING"}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Requested Action
                  </div>
                  <div className="text-base font-black text-success uppercase flex items-center gap-1 justify-center">
                    ACCEPT & ADVANCE
                  </div>
                </div>
              </div>
            ) : selectedRequest.action_type === "UPDATE_JOB_STATUS" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Requested Status
                  </div>
                  <div className={`text-base font-black uppercase ${selectedRequest.request_payload?.is_active ? "text-success" : "text-destructive"}`}>
                    {selectedRequest.request_payload?.is_active ? "ACTIVATE JOB" : "DEACTIVATE JOB"}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                    Job ID
                  </div>
                  <div className="text-base font-black text-primary uppercase">
                    #{selectedRequest.entity_id}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Structured detailed metadata fields */}
            <div className="space-y-4">
              {selectedRequest.request_payload?.candidate_name && (
                <div className="flex border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Candidate Name</span>
                  <span className="text-sm font-bold">{selectedRequest.request_payload.candidate_name}</span>
                </div>
              )}

              {selectedRequest.request_payload?.job_title && (
                <div className="flex border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Job Name</span>
                  <span className="text-sm font-bold text-primary">{selectedRequest.request_payload.job_title}</span>
                </div>
              )}

              {selectedRequest.request_payload?.stage_name && (
                <div className="flex border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Pipeline Round</span>
                  <span className="text-sm font-semibold">{selectedRequest.request_payload.stage_name}</span>
                </div>
              )}

              <div className="flex border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Recruiter Name</span>
                <span className="text-sm font-semibold flex items-center gap-1">
                  <User className="size-3 text-primary/80" />
                  {selectedRequest.request_payload?.requester_name || selectedRequest.requester_role}
                </span>
              </div>

              <div className="flex border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Requested Date</span>
                <span className="text-sm font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</span>
              </div>

              <div className="flex border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase w-36 shrink-0 tracking-wider">Status</span>
                <span className="text-sm font-medium">{getStatusBadge(selectedRequest.status)}</span>
              </div>
            </div>

            {/* Justification details */}
            {selectedRequest.reason && (
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recruiter's Justification</span>
                <p className="text-sm text-foreground/90 italic leading-relaxed">
                  "{selectedRequest.reason}"
                </p>
              </div>
            )}

            {/* Action buttons inside Modal */}
            {selectedRequest.status === "pending" && activeTab === "pending" && (
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                {selectedRequest.action_type === "ACCEPT_RESUME" ? (
                  <>
                    <Button
                      onClick={() => handleRejectResume(selectedRequest.request_payload.job_id, selectedRequest.entity_id)}
                      disabled={isRejectingResume || isAcceptingResume}
                      variant="destructive"
                      className="rounded-xl px-5 h-11 border border-destructive/20 shadow-md shadow-destructive/5 hover:cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="size-4" />
                      {isRejectingResume ? "Rejecting..." : "Reject Resume"}
                    </Button>
                    {selectedRequest.request_payload?.resume_snapshot_url && (
                      <a
                        href={selectedRequest.request_payload.resume_snapshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 h-11 border border-primary/20 hover:bg-primary/5 text-primary text-sm font-semibold transition-all hover:cursor-pointer"
                      >
                        <FileText className="size-4" /> View Resume
                      </a>
                    )}
                    <Button
                      onClick={() => handleAcceptResume(selectedRequest.request_payload.job_id, selectedRequest.entity_id)}
                      disabled={isAcceptingResume || isRejectingResume}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 h-11 shadow-md shadow-primary/5 hover:cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="size-4" />
                      {isAcceptingResume ? "Accepting..." : "Accept & Parse"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleDeny(selectedRequest.id)}
                      disabled={isDenying || isApproving}
                      variant="destructive"
                      className="rounded-xl px-5 h-11 border border-destructive/20 shadow-md shadow-destructive/5 hover:cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="size-4" /> 
                      {selectedRequest.action_type === "UPDATE_JOB_STATUS" ? "Reject Status Change" : "Reject Override"}
                    </Button>
                    
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={isApproving || isDenying}
                      className="bg-success hover:bg-success/90 text-success-foreground rounded-xl px-5 h-11 border border-success/20 shadow-md shadow-success/5 hover:cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="size-4" /> 
                      {selectedRequest.action_type === "UPDATE_JOB_STATUS" ? "Approve Status Change" : selectedRequest.action_type === "ACCEPT_CANDIDATE" ? "Approve & Shortlist" : "Approve & Advance"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
