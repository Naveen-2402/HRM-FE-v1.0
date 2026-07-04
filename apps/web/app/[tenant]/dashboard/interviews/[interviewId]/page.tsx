"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Star,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  Send,
  CheckCircle,
  CircleDot,
  StopCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { Dropdown } from "@/components/_shared/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { customInstance } from "@repo/orval-config/src/axios-setup";

import {
  LiveKitRoom,
  ParticipantTile,
  ControlBar,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

// Interview Service hooks — room, attendance, livekit token
import {
  useGetInterviewApiV1InterviewsInterviewIdGet,
  useRecordAttendanceApiV1InterviewsInterviewIdAttendancePost,
  useUpdateInterviewApiV1InterviewsInterviewIdPatch,
  useGetLivekitTokenApiV1InterviewsInterviewIdLivekitTokenGet,
  useGetInterviewSlotsApiV1InterviewsInterviewIdSlotsGet
} from "@repo/orval-config/src/api/interview/interviews/interviews";
import { RecordingStatusBadge, InterviewRecordingPlayer } from "@/components/recording";
import { useGetRecordingStatusApiV1RecordingsSlotIdStatusGet } from "@repo/orval-config/src/api/media/recording-management/recording-management";

// Feedback Service hooks — evaluations now owned by feedback-service
import {
  useGetEvaluationsApiV1FeedbackInterviewIdEvaluationsGet,
  useSubmitEvaluationApiV1FeedbackInterviewIdEvaluationsPost
} from "@repo/orval-config/src/api/feedback/feedback/feedback";

import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@repo/ui/components/ui/button";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";

function MyCustomConference({
  onCandidateJoined,
  slotId,
  tenantId,
  interviewId,
  roomName,
}: {
  onCandidateJoined: () => void;
  slotId?: number;
  tenantId?: string;
  interviewId?: number;
  roomName?: string;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  const [isRecordingAction, setIsRecordingAction] = useState(false);

  const localTracks = tracks.filter((t) => t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);
  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  React.useEffect(() => {
    if (remoteTracks.length > 0) {
      onCandidateJoined();
    }
  }, [remoteTracks.length, onCandidateJoined]);

  // Poll recording status while in call
  const { data: recordingStatusData, refetch: refetchStatus } = useGetRecordingStatusApiV1RecordingsSlotIdStatusGet(
    slotId ?? 0,
    {
      request: {
        params: {
          tenant_id: tenantId,
        },
      },
      query: {
        enabled: !!slotId && !!tenantId,
        refetchInterval: 8000,
      }
    } as any
  );
  const recordingStatus = (recordingStatusData as any)?.status as string | undefined;
  const isLiveRecording = recordingStatus === "RECORDING" || recordingStatus === "STARTING";

  const handleStartRecording = async () => {
    if (!slotId || !tenantId || !interviewId || !roomName) {
      toast.error("Missing recording context (slot, tenant, or room).");
      return;
    }
    setIsRecordingAction(true);
    try {
      await customInstance({
        url: "/recordings/start",
        method: "POST",
        data: { slot_id: slotId, tenant_id: tenantId, interview_id: interviewId, room_name: roomName },
      });
      toast.success("Recording started.");
      setTimeout(() => refetchStatus(), 2000);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to start recording.");
    } finally {
      setIsRecordingAction(false);
    }
  };

  const handleStopRecording = async () => {
    if (!slotId || !tenantId) {
      toast.error("Missing recording context.");
      return;
    }
    setIsRecordingAction(true);
    try {
      await customInstance({
        url: "/recordings/stop",
        method: "POST",
        data: { slot_id: slotId, tenant_id: tenantId },
      });
      toast.info("Recording stopped.");
      setTimeout(() => refetchStatus(), 2000);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to stop recording.");
    } finally {
      setIsRecordingAction(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-transparent">
      {/* Remote participants grid / top container */}
      <div className="flex-1 w-full p-4 flex items-center justify-center min-h-0">
        {screenShareTrack ? (
          <ParticipantTile
            key={`${screenShareTrack.participant.identity}_${screenShareTrack.source}`}
            trackRef={screenShareTrack}
            className="w-full h-full rounded-xl overflow-hidden"
          />
        ) : remoteTracks.length === 0 ? (
          <div className="text-center p-6 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-muted-foreground">Waiting for other participants to join...</p>
          </div>
        ) : (
          <div className="grid w-full h-full gap-4" style={{
            gridTemplateColumns: remoteTracks.length === 1 ? '1fr' : '1fr 1fr',
            gridTemplateRows: remoteTracks.length <= 2 ? '1fr' : '1fr 1fr',
          }}>
            {remoteTracks.map((trackRef) => (
              <ParticipantTile
                key={`${trackRef.participant.identity}_${trackRef.source}`}
                trackRef={trackRef}
                className="w-full h-full rounded-xl overflow-hidden"
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Participant Videos when sharing screen */}
      {screenShareTrack && cameraTracks.length > 0 && (
        <div className="absolute bottom-20 right-4 flex flex-row flex-wrap justify-end gap-3 z-50 max-w-[80%]">
          {cameraTracks.map((trackRef) => (
            <div
              key={`${trackRef.participant.identity}_${trackRef.source}`}
              className="w-48 aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950/70 backdrop-blur-md relative animate-fade-in"
            >
              <ParticipantTile trackRef={trackRef} className="w-full h-full" />
            </div>
          ))}
        </div>
      )}

      {/* Floating Local Participant in Bottom Right Corner (Only if not sharing screen) */}
      {!screenShareTrack && localTracks.length > 0 && (
        <div className="absolute bottom-20 right-4 w-48 aspect-video rounded-xl overflow-hidden shadow-2xl z-50 bg-background/50 backdrop-blur-sm">
          <ParticipantTile trackRef={localTracks[0]} className="w-full h-full animate-fade-in" />
        </div>
      )}

      {/* Control Bar at bottom */}
      <div className="w-full bg-neutral-900/85 backdrop-blur-sm border-t border-white/5 py-3 px-4 flex items-center justify-between z-40">
        {/* Recording Control */}
        <div className="flex items-center gap-2 min-w-[160px]">
          {slotId ? (
            isLiveRecording ? (
              <button
                onClick={handleStopRecording}
                disabled={isRecordingAction}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecordingAction
                  ? <Loader2 className="size-3 animate-spin" />
                  : <StopCircle className="size-3" />}
                {recordingStatus === "STARTING" ? "Starting..." : "Stop Recording"}
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                disabled={isRecordingAction || recordingStatus === "UPLOADING"}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/8 text-white/70 border border-white/10 hover:bg-white/15 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRecordingAction
                  ? <Loader2 className="size-3 animate-spin" />
                  : <CircleDot className="size-3 text-red-400" />}
                {recordingStatus === "UPLOADING" ? "Uploading..." : "Start Recording"}
              </button>
            )
          ) : (
            <span className="text-[10px] text-white/30">No slot assigned</span>
          )}
        </div>

        {/* Centered LiveKit controls */}
        <div className="flex-1 flex justify-center">
          <ControlBar variation="minimal" controls={{ chat: false, screenShare: true }} />
        </div>

        {/* Spacer to balance layout */}
        <div className="min-w-[160px]" />
      </div>
    </div>
  );
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.interviewId);
  const tenantSubdomain = params.tenant as string;

  const { user } = useAuthStore();
  const currentUserId = user?.sub || "interviewer";

  // Fetch Tenant details
  const { data: tenantDetails } = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenantSubdomain,
    {
      query: {
        enabled: !!tenantSubdomain,
      },
    } as any
  );
  const tenantId = (tenantDetails as any)?.id || user?.tenant_id || "";

  // Mock states for call interface
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isInCall, setIsInCall] = useState(true);
  // Tracks whether LiveKit actually connected successfully.
  // Prevents onDisconnected from firing the leave-flow on failed initial connections.
  const hasConnectedRef = React.useRef(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorCountdown, setErrorCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Absence Tracking
  const [candidateHasJoined, setCandidateHasJoined] = useState(false);

  const handleCandidateJoined = React.useCallback(() => {
    setCandidateHasJoined(true);
  }, []);

  React.useEffect(() => {
    if (isInCall) {
      setCountdown(null);
      return;
    }

    setCountdown(10);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isInCall]);

  React.useEffect(() => {
    if (countdown === 0) {
      router.replace(`/${tenantSubdomain}/dashboard`);
    }
  }, [countdown, router, tenantSubdomain]);

  React.useEffect(() => {
    if (errorCountdown === null) return;
    if (errorCountdown === 0) {
      router.replace(`/${tenantSubdomain}/dashboard`);
      return;
    }

    const timer = setTimeout(() => {
      setErrorCountdown(errorCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [errorCountdown, router, tenantSubdomain]);

  // Scorecard Evaluation Form State
  const [techScore, setTechScore] = useState<number>(3);
  const [techComments, setTechComments] = useState("");
  const [commScore, setCommScore] = useState<number>(3);
  const [commComments, setCommComments] = useState("");
  const [solveScore, setSolveScore] = useState<number>(3);
  const [solveComments, setSolveComments] = useState("");
  const [cultureScore, setCultureScore] = useState<number>(3);
  const [cultureComments, setCultureComments] = useState("");

  const [recommendation, setRecommendation] = useState<
    "strong_hire" | "hire" | "neutral" | "no_hire" | "strong_no_hire"
  >("hire");
  const [overallComments, setOverallComments] = useState("");

  // 1. Fetch Interview details
  const {
    data: interview,
    isLoading: isLoadingInterview,
    refetch: refetchInterview,
  } = useGetInterviewApiV1InterviewsInterviewIdGet(interviewId, {
    query: {
      enabled: !!interviewId,
    },
  } as any);

  const interviewAny = interview as any;

  // Fetch Interview Slots to get booked slot_id for recordings
  const { data: slots } = useGetInterviewSlotsApiV1InterviewsInterviewIdSlotsGet(
    interviewId,
    {
      query: {
        enabled: !!interviewId,
      },
    } as any
  );
  const bookedSlot = React.useMemo(() => {
    return Array.isArray(slots) ? (slots as any[]).find((s) => s.is_booked) : null;
  }, [slots]);
  const slotId = bookedSlot?.id;

  // 4. Fetch Evaluations already submitted (from feedback-service)
  const {
    data: evaluationsResponse,
    refetch: refetchEvaluations,
  } = useGetEvaluationsApiV1FeedbackInterviewIdEvaluationsGet(interviewId, {
    query: {
      enabled: !!interviewId,
    },
  } as any);

  const evaluationsList = useMemo(() => {
    return Array.isArray(evaluationsResponse) ? (evaluationsResponse as any[]) : [];
  }, [evaluationsResponse]);

  // Check if current user has already submitted evaluation
  const hasSubmittedEvaluation = useMemo(() => {
    return evaluationsList.some(
      (ev) => ev.interviewer_id === currentUserId && ev.status === "submitted"
    );
  }, [evaluationsList, currentUserId]);

  // Fetch Livekit token
  const { data: tokenData, error: tokenError } = useGetLivekitTokenApiV1InterviewsInterviewIdLivekitTokenGet(
    interviewId,
    {
      query: {
        enabled: !!interviewId && !!tenantId && interviewAny?.status !== "COMPLETED" && interviewAny?.status !== "EVALUATED" && isInCall,
        retry: false,
      },
      request: {
        headers: {
          "X-Tenant-Id": tenantId,
        },
      },
    } as any
  );
  const livekitToken = (tokenData as any)?.token;

  React.useEffect(() => {
    const axiosError = tokenError as any;
    if (axiosError?.response) {
      const detail = axiosError?.response?.data?.detail || "Access denied to this interview room.";
      setErrorMessage(detail);
      setErrorCountdown(10);
    }
  }, [tokenError]);

  // Attendance mutation — join/leave fired only by handleJoinCall / handleEndCall,
  // NOT automatically on page mount to avoid duplicate join records.
  const recordAttendanceMutation = useRecordAttendanceApiV1InterviewsInterviewIdAttendancePost({
    request: {
      headers: {
        "X-Tenant-Id": tenantId,
      },
    },
  } as any);

  // Mutations
  const submitEvaluationMutation = useSubmitEvaluationApiV1FeedbackInterviewIdEvaluationsPost();
  const updateInterviewMutation = useUpdateInterviewApiV1InterviewsInterviewIdPatch({
    request: {
      headers: {
        "X-Tenant-Id": tenantId,
      },
    },
  });

  // 15-minute absence check timer
  React.useEffect(() => {
    const startVal = interviewAny?.scheduled_start;
    const statusVal = interviewAny?.status;
    if (!startVal || candidateHasJoined || !isInCall) return;
    if (statusVal === "CANDIDATE_NO_SHOW" || statusVal === "COMPLETED" || statusVal === "EVALUATED") return;

    const startTime = new Date(startVal).getTime();
    const timeoutTime = startTime + 15 * 60 * 1000; // 15 minutes past start time

    const checkAbsence = () => {
      if (Date.now() >= timeoutTime) {
        toast.warning("Candidate has not joined within 15 minutes. Terminating meeting as Candidate Absent.");
        
        updateInterviewMutation.mutate({
          interviewId,
          data: { status: "CANDIDATE_NO_SHOW" }
        }, {
          onSuccess: () => {
            setIsInCall(false);
            refetchInterview();
          },
          onError: () => {
            toast.error("Failed to update candidate absence status.");
            setIsInCall(false);
          }
        });
      }
    };

    // Check immediately on mount/update
    checkAbsence();

    const interval = setInterval(checkAbsence, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [interviewAny?.scheduled_start, interviewAny?.status, candidateHasJoined, isInCall, interviewId, updateInterviewMutation, refetchInterview]);

  const handleEndCall = () => {
    setIsInCall(false);
    // Record Leave Attendance
    recordAttendanceMutation.mutate(
      {
        interviewId,
        data: {
          participant_id: currentUserId,
          participant_role: "interviewer",
          event: "leave",
        },
      },
      {
        onSuccess: () => {
          toast.info("Left meeting room.");
        },
      }
    );
  };

  const handleJoinCall = () => {
    setIsInCall(true);
    recordAttendanceMutation.mutate(
      {
        interviewId,
        data: {
          participant_id: currentUserId,
          participant_role: "interviewer",
          event: "join",
        },
      },
      {
        onSuccess: () => {
          toast.success("Joined meeting room.");
        },
      }
    );
  };

  const handleSubmitEvaluation = (isDraft = false) => {
    submitEvaluationMutation.mutate(
      {
        interviewId,
        data: {
          interviewer_id: currentUserId,
          technical_skills_score: techScore,
          technical_skills_comments: techComments,
          communication_score: commScore,
          communication_comments: commComments,
          problem_solving_score: solveScore,
          problem_solving_comments: solveComments,
          culture_fit_score: cultureScore,
          culture_fit_comments: cultureComments,
          recommendation,
          overall_comments: overallComments,
          status: isDraft ? "draft" : "submitted",
        },
      },
      {
        onSuccess: () => {
          toast.success(isDraft ? "Draft saved successfully." : "Scorecard evaluation submitted.");
          refetchEvaluations();
          refetchInterview();
        },
        onError: () => {
          toast.error("Failed to submit scorecard.");
        },
      }
    );
  };

  if (isLoadingInterview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Entering Room...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center p-8 bg-card border border-border rounded-3xl max-w-md shadow-premium relative z-10">
          <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5 text-destructive animate-pulse">
            <VideoOff className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {errorMessage}
          </p>
          <p className="text-xs text-muted-foreground/80 mb-6">
            Redirecting to dashboard in <span className="font-bold text-foreground">{errorCountdown}</span> seconds...
          </p>
          <Button onClick={() => router.replace(`/${tenantSubdomain}/dashboard`)} className="w-full font-bold" variant="destructive">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Interview session not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">

      {/* Glow elements */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Left Column: Meeting simulation screen */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="bg-card/45 border border-border/60 rounded-3xl p-4 flex flex-col gap-4 relative z-10 shadow-premium">

          {/* Header info */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">{interviewAny.title}</h2>
                {slotId && <RecordingStatusBadge slotId={slotId} tenantId={tenantId} />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Meeting Room: <span className="font-mono">{(tokenData as any)?.room_name || interviewAny.livekit_room_name || "Unassigned"}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                Round {interviewAny.round_number}
              </span>
              <Button
                onClick={() => setIsScorecardOpen(!isScorecardOpen)}
                variant={isScorecardOpen ? "default" : "secondary"}
                className="font-bold gap-2 text-xs h-8 rounded-xl px-4 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                size="sm"
              >
                <FileText className="size-3.5" />
                {isScorecardOpen ? "Hide Scorecard" : "Evaluate"}
              </Button>
            </div>
          </div>

          {/* WebRTC Video Screen */}
          <div className="aspect-video w-full bg-transparent rounded-2xl relative overflow-hidden flex items-center justify-center">
            {interviewAny.status === "COMPLETED" || interviewAny.status === "EVALUATED" ? (
              <div className="w-full h-full p-6 flex flex-col items-center justify-center gap-4">
                {slotId ? (
                  <div className="w-full max-w-2xl">
                    <InterviewRecordingPlayer slotId={slotId} tenantId={tenantId} />
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-xl bg-success/15 border border-success/20 flex items-center justify-center text-success animate-pulse">
                      <CheckCircle className="size-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Interview Session Completed</h3>
                    <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                      The meeting duration has ended. Please fill in and submit the candidate evaluation card in the right pane.
                    </p>
                  </div>
                )}
              </div>
            ) : typeof window !== "undefined" && !window.isSecureContext ? (
              <div className="text-center p-8 max-w-md flex flex-col items-center justify-center gap-4">
                <div className="size-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                  <VideoOff className="size-7" />
                </div>
                <h3 className="text-base font-bold text-white">Secure Context Required</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Web browsers block access to camera and microphone devices on non-secure origins (HTTP) like <code className="bg-neutral-800 px-1 py-0.5 rounded text-warning">agentsfactory.hrm.test</code>.
                </p>
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 text-left w-full space-y-2">
                  <p className="text-xs font-bold text-foreground">How to bypass this locally:</p>
                  <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1.5 leading-normal">
                    <li>
                      Access the app via <code className="bg-neutral-900/50 px-1 py-0.5 rounded text-primary">http://localhost:3000</code>.
                    </li>
                    <li>
                      Or in Chrome/Edge, navigate to <code className="bg-neutral-900/50 px-1 py-0.5 rounded text-primary font-mono">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>.
                    </li>
                    <li>
                      Add <code className="bg-neutral-900/50 px-1 py-0.5 rounded text-warning font-mono">http://agentsfactory.hrm.test:3000</code> to the list, set to <strong>Enabled</strong>, and relaunch.
                    </li>
                  </ol>
                </div>
              </div>
            ) : isInCall ? (
              livekitToken ? (
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={livekitToken}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                  connect={true}
                  onConnected={() => {
                    // Mark as successfully connected so onDisconnected knows it's a real disconnect.
                    hasConnectedRef.current = true;
                  }}
                  onDisconnected={() => {
                    // Only trigger the leave flow if we were genuinely connected.
                    // Ignores failed initial connections and React StrictMode remounts.
                    if (hasConnectedRef.current) {
                      hasConnectedRef.current = false;
                      handleEndCall();
                    }
                  }}
                  className="w-full h-full"
                >
                  <MyCustomConference
                    onCandidateJoined={handleCandidateJoined}
                    slotId={slotId}
                    tenantId={tenantId}
                    interviewId={interviewId}
                    roomName={(tokenData as any)?.room_name || interviewAny?.livekit_room_name}
                  />
                </LiveKitRoom>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Connecting to video network...</p>
                </div>
              )
            ) : interviewAny?.status === "CANDIDATE_NO_SHOW" ? (
              <div className="text-center flex flex-col items-center justify-center p-8 max-w-md mx-auto">
                <VideoOff className="size-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Interview Terminated</h3>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  The candidate did not join the room within 15 minutes of the scheduled start time. 
                  This interview has been marked as <strong>Candidate Absent</strong>.
                </p>
                {countdown !== null && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Redirecting to dashboard in <span className="text-foreground font-bold">{countdown}</span> seconds...
                  </p>
                )}
                <Button
                  onClick={() => router.replace(`/${tenantSubdomain}/dashboard`)}
                  className="font-bold w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center">
                <VideoOff className="size-12 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">You Left the Call</h3>
                {countdown !== null && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Redirecting to dashboard in {countdown} seconds...
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button onClick={handleJoinCall}>Rejoin Call</Button>
                  <Button
                    variant="outline"
                    onClick={() => router.replace(`/${tenantSubdomain}/dashboard`)}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>


      </div>

      <AnimatePresence>
        {isScorecardOpen && (
          /* Right Column: Interviewer Scorecard Review Form */
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full lg:w-[450px] bg-card/45 border border-border/60 rounded-3xl p-6 shadow-premium flex flex-col h-full overflow-y-auto z-10 relative"
          >
            <h3 className="text-base font-black text-foreground mb-1 flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Scorecard Evaluation
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Submit score comments for candidate performance. Overall results impact hiring progression.
            </p>

            {hasSubmittedEvaluation ? (
              <div className="bg-success/5 border border-success/20 rounded-2xl p-6 text-center space-y-3 mt-4">
                <CheckCircle className="size-10 text-success mx-auto" />
                <h4 className="text-sm font-bold text-foreground">Evaluation Completed</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Your scorecard review for this candidate has already been submitted. Quorum verification is currently pending.
                </p>
                <Button
                  onClick={() => router.replace(`/${tenantSubdomain}/dashboard/interviews`)}
                  className="w-full font-bold mt-4 cursor-pointer"
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-5 flex-1">

                <div className="grid grid-cols-2 gap-5">
                  {/* Tech Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Technical</label>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{techScore}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => setTechScore(v)}
                          className={`flex-1 h-7 rounded-md text-xs font-bold transition-all ${techScore >= v ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Notes..."
                      value={techComments} onChange={(e) => setTechComments(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background/60 border border-border/50 rounded-lg text-[11px] focus:outline-none focus:border-primary/60 text-foreground transition-colors resize-y min-h-[44px]"
                      rows={2}
                    />
                  </div>

                  {/* Communication Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Communication</label>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{commScore}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => setCommScore(v)}
                          className={`flex-1 h-7 rounded-md text-xs font-bold transition-all ${commScore >= v ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Notes..."
                      value={commComments} onChange={(e) => setCommComments(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background/60 border border-border/50 rounded-lg text-[11px] focus:outline-none focus:border-primary/60 text-foreground transition-colors resize-y min-h-[44px]"
                      rows={2}
                    />
                  </div>

                  {/* Problem Solving Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Problem Solving</label>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{solveScore}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => setSolveScore(v)}
                          className={`flex-1 h-7 rounded-md text-xs font-bold transition-all ${solveScore >= v ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Notes..."
                      value={solveComments} onChange={(e) => setSolveComments(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background/60 border border-border/50 rounded-lg text-[11px] focus:outline-none focus:border-primary/60 text-foreground transition-colors resize-y min-h-[44px]"
                      rows={2}
                    />
                  </div>

                  {/* Culture Fit Score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Culture Fit</label>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{cultureScore}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => setCultureScore(v)}
                          className={`flex-1 h-7 rounded-md text-xs font-bold transition-all ${cultureScore >= v ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Notes..."
                      value={cultureComments} onChange={(e) => setCultureComments(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-background/60 border border-border/50 rounded-lg text-[11px] focus:outline-none focus:border-primary/60 text-foreground transition-colors resize-y min-h-[44px]"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Recommendation Decision */}
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Recommendation Decision</label>
                  <Dropdown
                    options={[
                      { label: "Strong Hire", value: "strong_hire" },
                      { label: "Hire", value: "hire" },
                      { label: "Neutral", value: "neutral" },
                      { label: "No Hire", value: "no_hire" },
                      { label: "Strong No Hire", value: "strong_no_hire" },
                    ]}
                    value={recommendation}
                    onChange={(val) => setRecommendation(val as any)}
                    searchable={false}
                    className="w-full text-foreground"
                  />
                </div>

                {/* Overall Comments */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Overall Comments</label>
                  <textarea
                    placeholder="Summarize overall performance details..."
                    value={overallComments} onChange={(e) => setOverallComments(e.target.value)}
                    className="w-full px-3 py-2 bg-background/50 border border-border/40 rounded-xl text-[11px] focus:outline-none focus:border-primary/50 text-foreground resize-none h-16 transition-colors"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleSubmitEvaluation(false)}
                    disabled={submitEvaluationMutation.isPending}
                    className="flex-1 font-bold"
                  >
                    Submit Scorecard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmitEvaluation(true)}
                    disabled={submitEvaluationMutation.isPending}
                    className="border-border hover:bg-muted/10 font-bold"
                  >
                    Save Draft
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
