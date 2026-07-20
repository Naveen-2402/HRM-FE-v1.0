"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/_shared/Modal";
import { DateTimePicker } from "@/components/_shared/DateTimePicker";
import { Dropdown } from "@/components/_shared/Dropdown";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Clock, Video, Plus, ShieldCheck, Trash2, RefreshCw, Calendar, Shield, Users, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

import { useGetJobApiV1JobsJobIdGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employee/employees/employees";
import {
  useListInterviewsApiV1InterviewsGet,
  useCreateInterviewApiV1InterviewsPost,
  useUpdateInterviewApiV1InterviewsInterviewIdPatch,
  useCreateInterviewSlotsApiV1InterviewsInterviewIdSlotsPost,
  useGenerateMagicLinkApiV1InterviewsMagicLinkPost,
  useRecommendSlotsApiV1InterviewsInterviewIdRecommendPost,
  useGetJobTeamMembersApiV1InterviewsJobTeamJobIdGet
} from "@repo/orval-config/src/api/interview/interviews/interviews";
import {
  useGetInterviewRescheduleRequestsApiV1SchedulingInterviewIdRescheduleRequestsGet,
  useProcessRescheduleRequestApiV1SchedulingRescheduleRequestsRequestIdPatch
} from "@repo/orval-config/src/api/scheduling/scheduling/scheduling";

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: any;
  onSuccess?: () => void;
}

export function InterviewSchedulingModal({ isOpen, onClose, evaluation, onSuccess }: InterviewSchedulingModalProps) {
  const router = useRouter();

  // ── Scheduling State ──
  const [interviewDuration, setInterviewDuration] = useState("45");
  const [targetDate, setTargetDate] = useState("");
  const [suggestedSlotsCount, setSuggestedSlotsCount] = useState(3);
  const [minQuorum, setMinQuorum] = useState(1);
  const [assignedPanelMembers, setAssignedPanelMembers] = useState<string[]>([]);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSchedulingInProgress, setIsSchedulingInProgress] = useState<boolean>(false);

  // ── Fetch Jobs Details to get Pipeline Stages ──
  const { data: jobDetails } = useGetJobApiV1JobsJobIdGet(evaluation?.job_id || 0, {
    query: { enabled: isOpen && !!evaluation?.job_id }
  } as any);

  const stages = useMemo(() => {
    const rawStages = (jobDetails as any)?.pipeline_stages;
    if (!rawStages) return ["Screening", "Technical", "Culture", "Manager"];
    return rawStages.map((stage: any) =>
      typeof stage === "string" ? stage : (stage?.name || "Unknown Round")
    );
  }, [jobDetails]);
  const currentStageName = stages[evaluation?.current_stage_index || 0] || `Round ${(evaluation?.current_stage_index || 0) + 1}`;

  // ── Timer state to update join button disabled status dynamically ──
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

  // ── Fetch Employee Workspace List ──
  const { data: employeesResponse } = useListEmployeesApiV1EmployeesGet(
    { limit: 100 },
    {
      query: { enabled: isOpen }
    } as any
  );
  const employees = useMemo(() => {
    const list = (employeesResponse as any)?.employees || employeesResponse;
    return Array.isArray(list) ? list : [];
  }, [employeesResponse]);

  // Filter employees for the panel selection pool
  const panelPool = useMemo(() => {
    return employees.filter((emp: any) => {
      const roleStr = (emp.tenant_role || emp.role || "").toLowerCase();
      return ["recruiter", "recruiting-manager", "recruiting_manager", "hiring-manager", "hiring_manager", "interviewer"].includes(roleStr);
    });
  }, [employees]);

  // ── Fetch Job Team Members ──
  const { data: teamMembersResponse } = useGetJobTeamMembersApiV1InterviewsJobTeamJobIdGet(evaluation?.job_id || 0, {
    query: { enabled: isOpen && !!evaluation?.job_id }
  } as any);
  const teamMembers = useMemo(() => {
    const list = (teamMembersResponse as any)?.team_members || teamMembersResponse;
    return Array.isArray(list) ? list : [];
  }, [teamMembersResponse]);

  // ── Fetch Candidate's Interviews ──
  const { data: interviewsResponse, isFetching: isFetchingInterviews, refetch: refetchInterviews } = useListInterviewsApiV1InterviewsGet({
    job_id: evaluation?.job_id,
    candidate_id: evaluation?.candidate_id
  }, {
    query: { enabled: isOpen && !!evaluation?.job_id && !!evaluation?.candidate_id }
  } as any);
  const interviewsList = useMemo(() => Array.isArray(interviewsResponse) ? (interviewsResponse as any[]) : [], [interviewsResponse]);

  const currentInterview: any = useMemo(() => {
    return interviewsList.find((iv: any) => iv.round_number === evaluation?.current_stage_index);
  }, [interviewsList, evaluation]);

  // Update assigned panel members if interview exists
  useEffect(() => {
    if (currentInterview && currentInterview.interviewer_ids) {
       // Only set once when it becomes available
       setAssignedPanelMembers(currentInterview.interviewer_ids);
    }
  }, [currentInterview]);

  // ── Fetch reschedule requests ──
  const { data: rescheduleRequests, isFetching: isFetchingRescheduleRequests, refetch: refetchRescheduleRequests } =
    useGetInterviewRescheduleRequestsApiV1SchedulingInterviewIdRescheduleRequestsGet(
      currentInterview?.id || 0,
      {
        query: { enabled: isOpen && currentInterview?.status === "RESCHEDULE_REQUESTED" }
      } as any
    );

  const pendingRescheduleRequest: any = useMemo(() => {
    return Array.isArray(rescheduleRequests) && rescheduleRequests.length > 0 ? rescheduleRequests[0] : null;
  }, [rescheduleRequests]);

  // Mutations
  const createInterviewMutation = useCreateInterviewApiV1InterviewsPost();
  const createSlotsMutation = useCreateInterviewSlotsApiV1InterviewsInterviewIdSlotsPost();
  const generateMagicLinkMutation = useGenerateMagicLinkApiV1InterviewsMagicLinkPost();
  const processRescheduleMutation = useProcessRescheduleRequestApiV1SchedulingRescheduleRequestsRequestIdPatch();
  const recommendMutation = useRecommendSlotsApiV1InterviewsInterviewIdRecommendPost();
  const updateInterviewMutation = useUpdateInterviewApiV1InterviewsInterviewIdPatch();

  if (!evaluation) return null;

  const handleGetSuggestions = async () => {
    if (!targetDate) return toast.error("Please select a date to be held first.");
    if (assignedPanelMembers.length === 0) return toast.error("Please assign at least one panel member.");

    let activeInterviewId = currentInterview?.id;

    if (!activeInterviewId) {
      try {
        const interviewTitle = `${currentStageName} Interview - ${evaluation.candidate_name}`;
        const resp = await createInterviewMutation.mutateAsync({
          data: {
            job_id: evaluation.job_id,
            candidate_id: evaluation.candidate_id,
            title: interviewTitle,
            round_number: evaluation.current_stage_index,
            duration_minutes: parseInt(interviewDuration),
            interviewer_ids: assignedPanelMembers
          }
        });
        activeInterviewId = (resp as any).id;
        toast.success("Interview object created successfully.");
        await refetchInterviews();
      } catch (e) {
        return toast.error("Failed to create interview object.");
      }
    }

    const payload = {
      duration_minutes: parseInt(interviewDuration),
      buffer_minutes: 15,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      start_date: new Date(targetDate).toISOString(),
      end_date: new Date(new Date(targetDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days window
      selected_interviewers: assignedPanelMembers,
      limit: suggestedSlotsCount,
      candidates: [{
        id: evaluation.candidate_id,
        name: evaluation.candidate_name,
        panel_members: assignedPanelMembers
      }]
    };

    recommendMutation.mutate(
      {
        interviewId: activeInterviewId,
        data: payload as any
      },
      {
        onSuccess: (response: any) => {
          console.log("RECOMMEND_RESPONSE", response);
          if (!response) {
            toast.warn("No suggestions returned from the scheduling service.");
            return;
          }

          const candId = evaluation.candidate_id;
          let candRecs = response.recommendations || [];
          
          if (response.candidate_recommendations) {
            const found = response.candidate_recommendations.find(
              (cr: any) => String(cr.candidate_id) === String(candId)
            );
            if (found) {
              candRecs = found.recommendations || [];
            }
          }

          if (candRecs.length === 0) {
            toast.warn(`No slots available on this date. (Response: ${JSON.stringify(response).substring(0, 50)}...)`);
            return;
          }

          const generatedStarts = candRecs.map((rec: any) => rec.start_time).filter(Boolean);
          
          if (generatedStarts.length === 0) {
            toast.warn("Valid start times could not be parsed from recommendations.");
            return;
          }

          const candidateSuggestion = {
            candidateId: evaluation.candidate_id,
            candidateName: evaluation.candidate_name,
            stageIndex: evaluation.current_stage_index,
            slots: generatedStarts.map((start: string) => {
              const d = new Date(start);
              const end = new Date(d.getTime() + parseInt(interviewDuration) * 60 * 1000);
              return {
                startTime: start,
                endTime: end.toISOString()
              };
            }),
            panelMembers: [...assignedPanelMembers]
          };

          setSuggestions([candidateSuggestion]);
          toast.success("Slots suggested successfully!");
        },
        onError: () => toast.error("Failed to fetch slot suggestions.")
      }
    );
  };

  const updateSlotDateTime = (candidateIdx: number, slotIdx: number, datetimeStr: string) => {
    if (!datetimeStr) return;
    const start = new Date(datetimeStr);

    if (start.getTime() < Date.now()) {
      toast.error("Cannot select a time in the past.");
      return;
    }

    const end = new Date(start.getTime() + parseInt(interviewDuration) * 60 * 1000);
    const newStartStr = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;
      const updatedSlots = item.slots.map((s: any, sIdx: number) => sIdx === slotIdx ? {
        startTime: newStartStr,
        endTime: format(end, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
      } : s);
      updatedSlots.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return { ...item, slots: updatedSlots };
    }));
  };

  const addSlotOption = (candidateIdx: number) => {
    const candidate = suggestions[candidateIdx];
    if (!candidate) return;

    let newStart = new Date(targetDate || Date.now());
    newStart.setHours(9, 0, 0, 0);

    if (candidate.slots.length > 0) {
      const lastSlot = candidate.slots[candidate.slots.length - 1];
      newStart = new Date(new Date(lastSlot.endTime).getTime() + 15 * 60 * 1000);
    }

    const end = new Date(newStart.getTime() + parseInt(interviewDuration) * 60 * 1000);

    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;
      return {
        ...item,
        slots: [
          ...item.slots,
          {
            startTime: format(newStart, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            endTime: format(end, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
          }
        ]
      };
    }));
  };

  const removeSlotOption = (candidateIdx: number, slotIdx: number) => {
    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;
      return {
        ...item,
        slots: item.slots.filter((_: any, sIdx: number) => sIdx !== slotIdx)
      };
    }));
  };

  const togglePanelMemberForCandidate = (candidateIdx: number, empId: string) => {
    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;

      const hasMember = item.panelMembers.includes(empId);
      let newMembers = [...item.panelMembers];
      if (hasMember) {
        newMembers = newMembers.filter((id: string) => id !== empId);
      } else {
        newMembers.push(empId);
      }
      return { ...item, panelMembers: newMembers };
    }));
  };

  const handleConfirmSchedule = async () => {
    if (suggestions.length === 0) return toast.error("Please generate or configure at least one slot.");
    
    const candidateSuggestion = suggestions[0];
    if (!candidateSuggestion || candidateSuggestion.slots.length === 0) {
      return toast.error("Please provide at least one valid slot.");
    }
    
    if (candidateSuggestion.panelMembers.length === 0) {
      return toast.error("Please assign at least one panel member to the interview.");
    }

    setIsSchedulingInProgress(true);
    const payloadSlots = candidateSuggestion.slots.map((s: any) => ({
      start_time: s.startTime,
      end_time: s.endTime
    }));

    try {
      let activeInterviewId = currentInterview?.id;
      if (activeInterviewId) {
         await updateInterviewMutation.mutateAsync({
           interviewId: activeInterviewId,
           data: { interviewer_ids: candidateSuggestion.panelMembers }
         });
      }

      await createSlotsMutation.mutateAsync({
        interviewId: activeInterviewId || 0,
        data: { slots: payloadSlots }
      });
      
      await generateMagicLinkMutation.mutateAsync({
        data: { interview_id: activeInterviewId || 0, expires_in_hours: 48 }
      });

      toast.success("Schedule dispatched successfully.");
      setSuggestions([]);
      refetchInterviews();
      onSuccess?.();
    } catch (e) {
      toast.error("Failed to submit interview slots or notify candidate.");
    } finally {
      setIsSchedulingInProgress(false);
    }
  };

  const handleProcessReschedule = (status: "approved" | "rejected") => {
    if (!pendingRescheduleRequest) return;
    processRescheduleMutation.mutate(
      { requestId: pendingRescheduleRequest?.id || 0, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Reschedule request ${status}.`);
          refetchInterviews();
          refetchRescheduleRequests();
          onSuccess?.();
        },
        onError: () => toast.error("Failed to process reschedule request.")
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interview Scheduling" className="max-w-4xl w-[900px]">
      <div className="-mt-3 flex justify-between items-center mb-4">
        <p className="text-sm text-primary font-medium">{evaluation?.candidate_name}</p>
        <button
          onClick={() => {
            refetchInterviews();
            refetchRescheduleRequests();
          }}
          disabled={isFetchingInterviews || isFetchingRescheduleRequests}
          className="text-primary hover:text-primary/80 disabled:opacity-50 transition-all p-1 hover:bg-primary/5 rounded-full"
          title="Refresh results"
        >
          <RefreshCw className={`w-3.5 h-3.5 hover:cursor-pointer ${(isFetchingInterviews || isFetchingRescheduleRequests) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Status Header */}
        {currentInterview && (
          <div className="bg-white/5 border border-border p-4 rounded-xl flex justify-between items-start gap-4 shrink-0">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">Active Round</span>
              <h4 className="text-sm font-bold text-foreground mt-1">{currentInterview.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Duration: {currentInterview.duration_minutes} mins
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
              {currentInterview.status.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {/* Action States */}
        {currentInterview?.status === "BOOKED" && (
          <div className="bg-success/5 border border-success/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-success shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-foreground">Interview Confirmed</h5>
                <p className="text-xs text-muted-foreground mt-1">The candidate selected a time slot. Calendar invites were generated.</p>
              </div>
            </div>
            <div className="bg-white/5 border border-border p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-foreground">Date & Time:</div>
              <div className="text-primary font-medium">{currentInterview.scheduled_start && format(new Date(currentInterview.scheduled_start), "PPP p")}</div>
            </div>
            <button
              onClick={() => { onClose(); router.push(`/dashboard/interviews/${currentInterview.id}`); }}
              disabled={isJoinDisabled(currentInterview.scheduled_start)}
              title={isJoinDisabled(currentInterview.scheduled_start) ? "Room opens 5 minutes before scheduled time" : "Enter Meeting Room"}
              className="w-full h-10 bg-primary text-white font-bold text-xs rounded-lg hover:cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="size-4" /> Enter Interview Room
            </button>
          </div>
        )}

        {currentInterview?.status === "RESCHEDULE_REQUESTED" && pendingRescheduleRequest && (
          <div className="bg-white/5 border border-amber-500/30 p-5 rounded-2xl space-y-4">
            <h5 className="text-xs font-bold text-foreground">Reschedule Request Received</h5>
            <div className="bg-white/5 p-3 rounded-xl text-xs space-y-2">
              <p><span className="font-bold">Reason:</span> {pendingRescheduleRequest.reason}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleProcessReschedule("approved")} disabled={processRescheduleMutation.isPending} className="flex-1 h-9 bg-success text-white font-bold text-xs rounded-lg hover:bg-success/90 cursor-pointer">
                Approve
              </button>
              <button onClick={() => handleProcessReschedule("rejected")} disabled={processRescheduleMutation.isPending} className="flex-1 h-9 bg-destructive text-white font-bold text-xs rounded-lg hover:bg-destructive/90 cursor-pointer">
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Setup / Propose Slots UI */}
        {(!currentInterview ||
          currentInterview.status === "AWAITING_BOOKING" ||
          currentInterview.status === "RESCHEDULE_APPROVED" ||
          currentInterview.status === "INTERVIEW_NO_SHOW" ||
          currentInterview.status === "CANDIDATE_NO_SHOW") && (
            <div className="space-y-6">
              
              {/* Configuration Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Scheduling Details */}
                <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-amber-500" /> Scheduling Details
                  </h4>
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date to be held</label>
                      <DateTimePicker value={targetDate} onChange={setTargetDate} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interview Duration</label>
                      <select value={interviewDuration} onChange={(e) => setInterviewDuration(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold">
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Number of Slots to Propose</label>
                      <input
                        type="number" min="1" max="10"
                        value={suggestedSlotsCount}
                        onChange={(e) => setSuggestedSlotsCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
                      />
                      <p className="text-[9px] text-muted-foreground leading-relaxed mt-1">
                        Number of auto-generated slot options candidates can choose from.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Quorum Settings */}
                <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="size-3.5 text-amber-500" /> Quorum settings
                  </h4>
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviewers count</label>
                      <input
                        type="number" min="1" max="10"
                        value={minQuorum}
                        onChange={(e) => setMinQuorum(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                        Specifies how many panel members will be allocated to evaluate each candidate slot.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Panel Pool Assignment */}
              <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="size-3.5 text-amber-500" /> Panel Pool Assignment
                </h4>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-[350px] shrink-0">
                    <Dropdown
                      placeholder="Add panel member"
                      options={panelPool.map((emp: any) => ({
                        label: `${emp.first_name} ${emp.last_name} (${emp.tenant_role || emp.role})`,
                        value: emp.id,
                      }))}
                      value=""
                      onChange={(memberId) => {
                        if (memberId && !assignedPanelMembers.includes(memberId)) {
                          setAssignedPanelMembers(prev => [...prev, memberId]);
                        }
                      }}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                      Search and add the employees who will be part of the interview loops for this job round.
                    </p>
                  </div>
                  <div className="flex-1 w-full min-h-[40px] p-4 bg-white/[0.02] border border-border/50 rounded-xl">
                    {assignedPanelMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic flex items-center h-full justify-center opacity-70">No panel members assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {assignedPanelMembers.map(memberId => {
                          const emp = employees.find(e => e.id === memberId);
                          const name = emp ? `${emp.first_name} ${emp.last_name}` : `User #${String(memberId).substring(0, 8)}`;
                          return (
                            <div key={memberId} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full text-[11px] font-medium">
                              {name}
                              <button onClick={() => setAssignedPanelMembers(assignedPanelMembers.filter(id => id !== memberId))} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                                <X className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Get Suggestions Action */}
              <div className="flex justify-end mt-4 mb-6">
                <Button
                  onClick={handleGetSuggestions}
                  disabled={recommendMutation.isPending || createInterviewMutation.isPending || !targetDate || assignedPanelMembers.length === 0}
                  className="font-bold px-6 text-xs h-10 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all rounded-xl cursor-pointer"
                >
                  {(recommendMutation.isPending || createInterviewMutation.isPending) ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Get Suggestions
                    </>
                  )}
                </Button>
              </div>

              {/* Suggestions Table / Scheduling suggestions output */}
              {suggestions.length > 0 ? (
                <div className="bg-card/45 border border-border/60 rounded-2xl p-6 shadow-premium flex flex-col gap-6 animate-in fade-in duration-300 mt-6">
                  <div className="flex justify-between items-center pb-3 border-b border-border/40">
                    <div>
                      <h3 className="text-sm font-black text-foreground">Suggested Time Slots & Panels</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        System suggested slots of {interviewDuration} minutes with 15m breaks. Customize the start times or panel allocations if required.
                      </p>
                    </div>
                    <Button
                      onClick={handleConfirmSchedule}
                      disabled={isSchedulingInProgress}
                      className="font-bold px-6 text-xs h-9 cursor-pointer"
                    >
                      {isSchedulingInProgress ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-2" />
                          Scheduling...
                        </>
                      ) : (
                        "Confirm & Dispatch Schedule"
                      )}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="pb-3 pl-4">Candidate</th>
                          <th className="pb-3">Round</th>
                          <th className="pb-3">Suggested Time Slot (Override)</th>
                          <th className="pb-3">Assigned Panel (Override)</th>
                          <th className="pb-3 pr-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {suggestions.map((item, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="py-4 pl-4 font-bold text-xs text-foreground">
                                {item.candidateName}
                              </td>
                              <td className="py-4 text-[10px] text-muted-foreground">
                                <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                                  {currentStageName}
                                </span>
                              </td>
                              <td className="py-4 text-xs">
                                <div className="flex flex-col gap-2.5">
                                  {item.slots?.map((slot: any, sIdx: number) => (
                                    <div key={sIdx} className="flex items-center gap-2 group/slot">
                                      <div className="w-[220px] shrink-0">
                                        <DateTimePicker
                                          value={slot.startTime}
                                          onChange={(val) => updateSlotDateTime(idx, sIdx, val)}
                                        />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground font-mono min-w-[70px]">
                                        to {format(new Date(slot.endTime), "h:mm a")}
                                      </span>
                                      {item.slots.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeSlotOption(idx, sIdx)}
                                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover/slot:opacity-100 transition-opacity cursor-pointer"
                                        >
                                          <X className="size-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addSlotOption(idx)}
                                    className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 mt-1 w-fit cursor-pointer"
                                  >
                                    <Plus className="size-3" /> Add Slot Option
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 text-xs">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-sm">
                                  {assignedPanelMembers.map(empId => {
                                    const emp = panelPool.find((e: any) => String(e.id) === String(empId));
                                    const isChecked = item.panelMembers.includes(empId);
                                    return (
                                      <label
                                        key={empId}
                                        className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-muted-foreground hover:text-foreground"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePanelMemberForCandidate(idx, empId)}
                                          className="rounded border-border bg-background accent-primary size-3.5"
                                        />
                                        <span>{emp ? `${emp.first_name} ${emp.last_name?.charAt(0)}.` : "Panel"}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-4 pr-4 text-right">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setSuggestions(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : null}

            </div>
          )}
      </div>
    </Modal>
  );
}

