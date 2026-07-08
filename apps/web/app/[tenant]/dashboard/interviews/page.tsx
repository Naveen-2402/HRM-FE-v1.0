"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Video,
  Loader2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Play
} from "lucide-react";

// Interview Service hooks
import {
  useListInterviewsApiV1InterviewsGet,
  useGetEvaluationsApiV1InterviewsInterviewIdEvaluationsGet,
  useGetInterviewSlotsApiV1InterviewsInterviewIdSlotsGet
} from "@repo/orval-config/src/api/interview/interviews/interviews";

// Tenant hooks
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";

// Component imports
import { Button } from "@repo/ui/components/ui/button";
import { InterviewRecordingPlayer } from "@/components/recording";

const ScorecardViewerModal = ({ interviewId, tenantId, onClose }: { interviewId: number, tenantId: string, onClose: () => void }) => {
  const { data: evaluationsResponse, isLoading } = useGetEvaluationsApiV1InterviewsInterviewIdEvaluationsGet(
    interviewId,
    {
      query: { enabled: !!interviewId },
      request: { headers: { "X-Tenant-Id": tenantId } }
    } as any
  );
  const evaluations = useMemo(() => Array.isArray(evaluationsResponse) ? evaluationsResponse : [], [evaluationsResponse]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl shadow-premium w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative z-50">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Interview Scorecard
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full size-8 hover:bg-muted cursor-pointer">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Loading evaluations...</p>
            </div>
          ) : !evaluations || evaluations.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <FileText className="size-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Evaluations Found</h3>
              <p className="text-muted-foreground text-xs mt-1">This scorecard has not been filled out yet.</p>
            </div>
          ) : (
            evaluations.map((evaluation: any, idx: number) => (
              <div key={evaluation.id || idx} className="bg-muted/10 border border-border/50 rounded-2xl p-5 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 rounded-l-2xl"></div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span className="bg-primary/20 text-primary size-6 rounded-full flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    Interviewer Review
                  </div>
                  <div className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                    {evaluation.recommendation?.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Technical", score: evaluation.technical_skills_score, notes: evaluation.technical_skills_comments },
                    { label: "Communication", score: evaluation.communication_score, notes: evaluation.communication_comments },
                    { label: "Problem Solving", score: evaluation.problem_solving_score, notes: evaluation.problem_solving_comments },
                    { label: "Culture Fit", score: evaluation.culture_fit_score, notes: evaluation.culture_fit_comments },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-background rounded-xl p-3 border border-border/40">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{metric.score}/5</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed italic">{metric.notes || "No notes provided."}</p>
                    </div>
                  ))}
                </div>

                {evaluation.overall_comments && (
                  <div className="bg-background rounded-xl p-4 border border-border/40 mt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Overall Comments</span>
                    <p className="text-sm text-foreground leading-relaxed">{evaluation.overall_comments}</p>
                  </div>
                )}
              </div>

            ))
          )}
        </div>
      </div>
      <div className="absolute inset-0 z-40" onClick={onClose}></div>
    </div>
  );
};

const RecordingPlaybackModal = ({ interviewId, tenantId, onClose }: { interviewId: number, tenantId: string, onClose: () => void }) => {
  const { data: slots, isLoading: isLoadingSlots } = useGetInterviewSlotsApiV1InterviewsInterviewIdSlotsGet(interviewId, {
    query: {
      enabled: !!interviewId,
    },
    request: {
      headers: {
        "X-Tenant-Id": tenantId
      }
    }
  } as any);

  const bookedSlot = React.useMemo(() => {
    return Array.isArray(slots) ? (slots as any[]).find((s) => s.is_booked) : null;
  }, [slots]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl shadow-premium w-full max-w-3xl overflow-hidden flex flex-col relative z-50">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Video className="size-5 text-primary animate-pulse" />
            Interview Recording Playback
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full size-8 hover:bg-muted cursor-pointer">
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-6">
          {isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Resolving booked interview slot...</p>
            </div>
          ) : bookedSlot ? (
            <InterviewRecordingPlayer slotId={bookedSlot.id} tenantId={tenantId} />
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <Video className="size-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Booked Slot Found</h3>
              <p className="text-muted-foreground text-xs mt-1">Could not find a booked slot for this interview session.</p>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 z-40" onClick={onClose}></div>
    </div>
  );
};

export default function InterviewsDashboard() {
  const params = useParams();
  const router = useRouter();
  const tenantSubdomain = params.tenant as string;
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState<number | null>(null);
  const [selectedInterviewForPlayback, setSelectedInterviewForPlayback] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Timer state to update join button disabled status dynamically
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isJoinDisabled = (scheduledStart: string | undefined | null) => {
    if (!scheduledStart) return true;
    const startTime = new Date(scheduledStart).getTime();
    return now < startTime - 5 * 60 * 1000;
  };

  // 1. Fetch Tenant details
  const { data: tenantDetails } = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenantSubdomain,
    {
      query: {
        enabled: !!tenantSubdomain,
      },
    } as any
  );

  const tenantId = (tenantDetails as any)?.id || "";

  // 2. Fetch Interviews
  const {
    data: interviewsResponse,
    isLoading: isLoadingInterviews,
  } = useListInterviewsApiV1InterviewsGet(
    {},
    {
      query: {
        enabled: !!tenantId,
      },
      request: {
        headers: {
          "X-Tenant-Id": tenantId,
        },
      },
    } as any
  );

  const sortedInterviews = useMemo(() => {
    if (!Array.isArray(interviewsResponse)) return [];

    return [...interviewsResponse].sort((a: any, b: any) => {
      // Sort descending by date and time
      const dateA = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
      const dateB = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;

      if (dateA === 0 && dateB === 0) return b.id - a.id;
      return dateB - dateA;
    });
  }, [interviewsResponse]);

  const totalPages = Math.ceil(sortedInterviews.length / itemsPerPage);

  const paginatedInterviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInterviews.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInterviews, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Status mapping styles
  const getStatusBadge = (status: string) => {
    const s = status || "AWAITING_BOOKING";
    switch (s) {
      case "BOOKED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/20">Scheduled</span>;
      case "RESCHEDULE_REQUESTED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/20">Reschedule Requested</span>;
      case "AWAITING_BOOKING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted-foreground/15 text-muted-foreground border border-muted-foreground/10">Awaiting Booking</span>;
      case "EVALUATED":
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20">Evaluated</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{s}</span>;
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-8 h-full overflow-y-auto">

      {/* Glow elements */}
      <div className="absolute top-10 right-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight text-tight">
            Interviews & Scheduling
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your candidate meeting schedules.
          </p>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
          {isLoadingInterviews ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 border border-border/50 rounded-2xl">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Fetching interview schedule...</p>
            </div>
          ) : sortedInterviews.length === 0 ? (
            <div className="text-center py-20 bg-card/25 border border-dashed border-border rounded-2xl flex flex-col items-center max-w-lg mx-auto">
              <Calendar className="size-12 text-primary/45 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Interviews Scheduled</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Interviews are scheduled by moving candidates forward in the Jobs pipeline stage evaluations.
              </p>
              <Button onClick={() => router.push("/dashboard/jobs")}>
                Go to Jobs Pipeline
              </Button>
            </div>
          ) : (
            <div className="bg-card/45 border border-border/60 rounded-2xl overflow-hidden shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40 text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                      <th className="px-6 py-4">Title / Round</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Scorecard</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-sm">
                    {paginatedInterviews.map((iv: any) => {
                      const hasStarted = iv.scheduled_start;
                      return (
                        <tr key={iv.id} className="hover:bg-muted/15 transition-all">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">{iv.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Candidate: <span className="font-semibold text-primary">{iv.candidate_name || `Candidate #${iv.candidate_id}`}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Round {iv.round_number}</div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(iv.status)}</td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {hasStarted
                              ? format(new Date(iv.scheduled_start), "PPP p")
                              : <span className="text-muted-foreground italic text-xs">Unconfirmed slot</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-mono">{iv.duration_minutes}m</td>
                          <td className="px-6 py-4">
                            {(iv.status === "EVALUATED" || iv.status === "COMPLETED") ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedInterviewForScorecard(iv.id)}
                                className="text-xs h-7 rounded-lg border-border/50 bg-background/50 hover:bg-background gap-1.5 cursor-pointer"
                              >
                                <FileText className="size-3" />
                                View
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {(iv.status === "COMPLETED" || iv.status === "EVALUATED") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedInterviewForPlayback(iv.id)}
                                  className="text-xs h-7 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer"
                                >
                                  <Play className="size-3" />
                                  Play
                                </Button>
                              )}
                              {(iv.status === "BOOKED" || iv.status === "ACTIVE" || iv.status === "RESCHEDULED") ? (
                                <Button
                                  onClick={() => router.push(`/dashboard/interviews/${iv.id}`)}
                                  disabled={isJoinDisabled(iv.scheduled_start)}
                                  className="bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                                  title={isJoinDisabled(iv.scheduled_start) ? "Room opens 5 minutes before scheduled time" : "Enter Meeting Room"}
                                >
                                  <Video className="size-3.5" />
                                  Join Room
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => router.push(`/dashboard/interviews/${iv.id}`)}
                                  className="text-xs border-border/50 hover:bg-muted/20 cursor-pointer"
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/40 bg-muted/10">
                  <div className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedInterviews.length)} of {sortedInterviews.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="h-8 text-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" /> Previous
                    </Button>
                    <div className="text-xs font-medium text-foreground mx-2">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Next <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedInterviewForScorecard && (
        <ScorecardViewerModal
          interviewId={selectedInterviewForScorecard}
          tenantId={tenantId}
          onClose={() => setSelectedInterviewForScorecard(null)}
        />
      )}

      {selectedInterviewForPlayback && (
        <RecordingPlaybackModal
          interviewId={selectedInterviewForPlayback}
          tenantId={tenantId}
          onClose={() => setSelectedInterviewForPlayback(null)}
        />
      )}
    </div>
  );
}
