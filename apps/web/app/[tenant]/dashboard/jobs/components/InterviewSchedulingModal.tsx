"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/_shared/Modal";
import { DateTimePicker } from "@/components/_shared/DateTimePicker";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { Clock, Video, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { useGetJobApiV1JobsJobIdGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employee/employees/employees";
import {
  useListInterviewsApiV1InterviewsGet,
  useCreateInterviewApiV1InterviewsPost,
  useGetJobTeamMembersApiV1InterviewsJobTeamJobIdGet,
} from "@repo/orval-config/src/api/interview/interviews/interviews";
import {
  useCreateInterviewSlotsApiV1SchedulingInterviewIdSlotsPost,
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
  const [interviewTitle, setInterviewTitle] = useState("");
  const [interviewDuration, setInterviewDuration] = useState("45");
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [slotTime, setSlotTime] = useState("");
  const [proposedSlots, setProposedSlots] = useState<string[]>([]);

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

  React.useEffect(() => {
    if (evaluation) {
      setInterviewTitle(`${currentStageName} Interview - ${evaluation.candidate_name}`);
    }
  }, [evaluation, currentStageName]);

  // ── Timer state to update join button disabled status dynamically ──
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isJoinDisabled = (scheduledStart: string | undefined | null) => {
    if (!scheduledStart) return true;
    const startTime = new Date(scheduledStart).getTime();
    return now < startTime - 5 * 60 * 1000;
  };

  // ── Fetch Employee Workspace List ──
  const { data: employeesResponse } = useListEmployeesApiV1EmployeesGet({
    query: { enabled: isOpen }
  } as any);
  const employees = useMemo(() => Array.isArray(employeesResponse) ? (employeesResponse as any[]) : [], [employeesResponse]);

  // ── Fetch Job Team Members ──
  const { data: teamMembersResponse } = useGetJobTeamMembersApiV1InterviewsJobTeamJobIdGet(evaluation?.job_id || 0, {
    query: { enabled: isOpen && !!evaluation?.job_id }
  } as any);
  const teamMembers = useMemo(() => Array.isArray(teamMembersResponse) ? (teamMembersResponse as any[]) : [], [teamMembersResponse]);

  // ── Fetch Candidate's Interviews ──
  const { data: interviewsResponse, refetch: refetchInterviews } = useListInterviewsApiV1InterviewsGet({
    job_id: evaluation?.job_id,
    candidate_id: evaluation?.candidate_id
  }, {
    query: { enabled: isOpen && !!evaluation?.job_id && !!evaluation?.candidate_id }
  } as any);
  const interviewsList = useMemo(() => Array.isArray(interviewsResponse) ? (interviewsResponse as any[]) : [], [interviewsResponse]);

  const currentInterview: any = useMemo(() => {
    return interviewsList.find((iv: any) => iv.round_number === evaluation?.current_stage_index);
  }, [interviewsList, evaluation]);

  // ── Fetch reschedule requests ──
  const { data: rescheduleRequests, refetch: refetchRescheduleRequests } =
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
  const createSlotsMutation = useCreateInterviewSlotsApiV1SchedulingInterviewIdSlotsPost();
  const processRescheduleMutation = useProcessRescheduleRequestApiV1SchedulingRescheduleRequestsRequestIdPatch();

  if (!evaluation) return null;

  const handleCreateInterview = () => {
    if (selectedInterviewers.length === 0) {
      toast.error("Please select at least one panel member.");
      return;
    }
    createInterviewMutation.mutate(
      {
        data: {
          job_id: evaluation.job_id,
          candidate_id: evaluation.candidate_id,
          title: interviewTitle,
          round_number: evaluation.current_stage_index,
          duration_minutes: parseInt(interviewDuration),
          interviewer_ids: selectedInterviewers
        }
      },
      {
        onSuccess: () => {
          toast.success("Interview object created successfully.");
          refetchInterviews();
          setSelectedInterviewers([]);
          onSuccess?.();
        },
        onError: () => toast.error("Failed to schedule interview round.")
      }
    );
  };

  const handleAddSlot = () => {
    if (!slotTime) return toast.error("Please choose a date and time first.");
    if (proposedSlots.includes(slotTime)) return toast.error("Slot already added to list.");
    setProposedSlots([...proposedSlots, slotTime]);
    setSlotTime("");
  };

  const handleRemoveSlot = (index: number) => {
    setProposedSlots(proposedSlots.filter((_, i) => i !== index));
  };

  const handleSubmitSlots = () => {
    if (proposedSlots.length === 0) return toast.error("Please offer at least one slot.");

    const payloadSlots = proposedSlots.map(start => {
      const d = new Date(start);
      const end = new Date(d.getTime() + (currentInterview?.duration_minutes || 45) * 60 * 1000);
      return { start_time: start, end_time: end.toISOString() };
    });

    createSlotsMutation.mutate(
      { interviewId: currentInterview?.id || 0, data: { slots: payloadSlots } },
      {
        onSuccess: () => {
          toast.success("Proposed slots saved.");
          setProposedSlots([]);
          refetchInterviews();
          onSuccess?.();
        },
        onError: () => toast.error("Failed to submit interview slots.")
      }
    );
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
    <Modal isOpen={isOpen} onClose={onClose} title="Interview Scheduling">
      <div className="flex flex-col gap-6 mt-2 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
        {currentInterview ? (
          <div className="bg-white/5 border border-border p-5 rounded-2xl space-y-5">
            <div className="flex justify-between items-start gap-4">
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

            {/* Sub-State: AWAITING_BOOKING / RESCHEDULE_APPROVED / INTERVIEWER_NO_SHOW / CANDIDATE_NO_SHOW */}
            {(currentInterview.status === "AWAITING_BOOKING" || 
              currentInterview.status === "RESCHEDULE_APPROVED" || 
              currentInterview.status === "INTERVIEWER_NO_SHOW" || 
              currentInterview.status === "CANDIDATE_NO_SHOW") && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h5 className="text-xs font-bold text-foreground">Propose Booking Slots</h5>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <DateTimePicker value={slotTime} onChange={setSlotTime} />
                  </div>
                  <button onClick={handleAddSlot} className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                    <Plus className="size-4" />
                  </button>
                </div>

                {proposedSlots.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Offered Slots:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {proposedSlots.map((slot, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-border p-2.5 rounded-lg text-xs">
                          <span className="font-medium text-foreground">{format(new Date(slot), "PP p")}</span>
                          <button onClick={() => handleRemoveSlot(idx)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleSubmitSlots} disabled={createSlotsMutation.isPending} className="w-full h-9 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:cursor-pointer transition-all">
                      {createSlotsMutation.isPending ? "Saving..." : "Save Offered Slots"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sub-State: RESCHEDULE_REQUESTED */}
            {currentInterview.status === "RESCHEDULE_REQUESTED" && pendingRescheduleRequest && (
              <div className="space-y-4 pt-4 border-t border-border/40">
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

            {/* Sub-State: BOOKED */}
            {currentInterview.status === "BOOKED" && (
              <div className="bg-success/5 border border-success/20 rounded-2xl p-4.5 space-y-4 pt-4 border-t border-border/40">
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
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-border p-5 rounded-2xl space-y-4">
            <p className="text-xs text-muted-foreground italic">No interview has been scheduled yet for the {currentStageName} stage.</p>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interview Title</label>
                <input type="text" value={interviewTitle} onChange={(e) => setInterviewTitle(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duration (Minutes)</label>
                  <select value={interviewDuration} onChange={(e) => setInterviewDuration(e.target.value)} className="w-full bg-background text-foreground border border-border rounded-xl px-3 py-2 text-xs outline-none">
                    <option value="30">30 Mins</option>
                    <option value="45">45 Mins</option>
                    <option value="60">60 Mins</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Select Panel Members</label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 border border-border/40 p-3 rounded-xl bg-white/5 custom-scrollbar">
                  {teamMembers.map(member => {
                    const emp = employees.find(e => e.identity_provider_user_id === member.user_id);
                    const name = emp ? `${emp.first_name} ${emp.last_name}` : `User #${member.user_id.substring(0, 8)}`;
                    const isChecked = selectedInterviewers.includes(member.user_id);
                    return (
                      <label key={member.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" checked={isChecked} onChange={() => {
                          if (isChecked) setSelectedInterviewers(selectedInterviewers.filter(id => id !== member.user_id));
                          else setSelectedInterviewers([...selectedInterviewers, member.user_id]);
                        }} className="accent-primary" />
                        <span>{name} ({member.role.replace(/_/g, " ")})</span>
                      </label>
                    );
                  })}
                  {teamMembers.length === 0 && <p className="text-xs text-muted-foreground italic">No interview panel members assigned to this job team.</p>}
                </div>
              </div>
              <button onClick={handleCreateInterview} disabled={createInterviewMutation.isPending || teamMembers.length === 0} className="w-full h-10 bg-primary text-primary-foreground font-bold text-xs rounded-md hover:cursor-pointer transition-all flex items-center justify-center gap-2">
                Schedule {currentStageName} Round
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
