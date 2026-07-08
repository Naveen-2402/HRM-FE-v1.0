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
  Clock,
  Loader2,
  CheckCircle
} from "lucide-react";
import { toast } from "react-toastify";

import {
  LiveKitRoom,
  ParticipantTile,
  ControlBar,
  useTracks,
  useLocalParticipant
} from "@livekit/components-react";
import { Track, DataPacket_Kind } from "livekit-client";
import "@livekit/components-styles";

// Interview Service hooks
import {
  useGetInterviewApiV1InterviewsInterviewIdGet,
  useRecordAttendanceApiV1InterviewsInterviewIdAttendancePost,
  useGetLivekitTokenApiV1InterviewsInterviewIdLivekitTokenGet
} from "@repo/orval-config/src/api/interview/interviews/interviews";

import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@repo/ui/components/ui/button";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";

function MyCustomConference({ isInCall }: { isInCall?: boolean }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  const { localParticipant } = useLocalParticipant();

  React.useEffect(() => {
    if (!isInCall) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (localParticipant) {
          const payload = JSON.stringify({ type: "MALPRACTICE", reason: "Candidate exited fullscreen" });
          const encoder = new TextEncoder();
          localParticipant.publishData(encoder.encode(payload), { reliable: true });
        }
        toast.error("Warning: Exiting full screen is considered malpractice.");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.altKey || e.metaKey || e.key === "OS") {
        if (localParticipant) {
          const payload = JSON.stringify({ type: "MALPRACTICE", reason: `Candidate pressed forbidden key: ${e.key}` });
          const encoder = new TextEncoder();
          localParticipant.publishData(encoder.encode(payload), { reliable: true });
        }
        toast.error("Warning: Unauthorized keystroke detected.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [localParticipant, isInCall]);

  const localTracks = tracks.filter((t) => t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);
  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-neutral-950">
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
        <div className="absolute bottom-20 right-4 w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/10 shadow-lg z-50 bg-neutral-900">
          <ParticipantTile trackRef={localTracks[0]} className="w-full h-full animate-fade-in" />
        </div>
      )}

      {/* Control Bar at bottom */}
      <div className="w-full bg-neutral-900/85 backdrop-blur-sm border-t border-white/5 py-3 px-4 flex justify-center z-40">
        <ControlBar variation="minimal" controls={{ chat: false, screenShare: true }} />
      </div>
    </div>
  );
}

export default function CandidateInterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.interviewId);
  const tenantSubdomain = params.tenant as string;

  // ADD THESE TWO LINES FOR DEBUGGING:
  console.log("DEBUG: livekit url =", process.env.NEXT_PUBLIC_LIVEKIT_URL);
  console.log("DEBUG: api url =", process.env.NEXT_PUBLIC_API_URL);
  console.log("DEBUG: window hostname =", typeof window !== "undefined" ? window.location.hostname : "no-window");

  const { user } = useAuthStore();
  const currentUserId = user?.sub || "candidate";

  // Mock states for call interface
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorCountdown, setErrorCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      router.replace(`/${tenantSubdomain}/candidate/dashboard`);
    }
  }, [countdown, router, tenantSubdomain]);

  React.useEffect(() => {
    if (errorCountdown === null) return;
    if (errorCountdown === 0) {
      router.replace(`/${tenantSubdomain}/candidate/dashboard`);
      return;
    }

    const timer = setTimeout(() => {
      setErrorCountdown(errorCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [errorCountdown, router, tenantSubdomain]);

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

  // 2. Fetch Interview details
  const {
    data: interview,
    isLoading: isLoadingInterview,
    refetch: refetchInterview,
  } = useGetInterviewApiV1InterviewsInterviewIdGet(interviewId, {
    query: {
      enabled: !!interviewId && !!tenantId,
    },
    request: {
      headers: {
        "X-Tenant-Id": tenantId,
      },
    },
  } as any);

  const interviewAny = interview as any;



  // 5. Fetch Livekit token
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
  console.log(livekitToken);

  React.useEffect(() => {
    const axiosError = tokenError as any;
    if (axiosError?.response) {
      const detail = axiosError?.response?.data?.detail || "Access denied to this interview room.";
      setErrorMessage(detail);
      setErrorCountdown(10);
    }
  }, [tokenError]);

  // Record Join Attendance on load
  const recordAttendanceMutation = useRecordAttendanceApiV1InterviewsInterviewIdAttendancePost({
    request: {
      headers: {
        "X-Tenant-Id": tenantId,
      },
    },
  } as any);

  React.useEffect(() => {
    // Only record 'join' when the candidate clicks Join and `hasJoinedSession` is true
    if (interviewId && currentUserId && tenantId && hasJoinedSession) {
      recordAttendanceMutation.mutate({
        interviewId,
        data: {
          participant_id: currentUserId,
          participant_role: "candidate",
          event: "join",
        },
      });
    }
  }, [interviewId, currentUserId, tenantId, hasJoinedSession]);

  const handleEndCall = () => {
    setIsInCall(false);
    // Record Leave Attendance
    recordAttendanceMutation.mutate(
      {
        interviewId,
        data: {
          participant_id: currentUserId,
          participant_role: "candidate",
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

  const handleJoinCall = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      toast.error("Full screen mode is required to join the interview.");
      return;
    }

    setHasJoinedSession(true);
    setIsInCall(true);
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
          <Button onClick={() => router.replace(`/${tenantSubdomain}/candidate/dashboard`)} className="w-full font-bold" variant="destructive">
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

  if (interviewAny.status === "COMPLETED" || interviewAny.status === "EVALUATED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center p-8 bg-card border border-border rounded-3xl max-w-md shadow-premium relative z-10">
          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 text-emerald-500">
            <CheckCircle className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Interview Session Ended</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            This interview session is now complete. The panel members are reviewing your feedback, and the recruiting team will notify you regarding the next steps.
          </p>
          <Button onClick={() => router.replace(`/${tenantSubdomain}/candidate/dashboard`)} className="w-full font-bold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 flex flex-col gap-6 h-full overflow-hidden">

      {/* Glow elements */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Row */}
      <div className="flex flex-col gap-6 h-full overflow-y-auto">
        <div className="bg-card/45 border border-border/60 rounded-3xl p-4 flex flex-col gap-4 relative z-10 shadow-premium">

          {/* Header info */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-lg font-bold text-foreground">{interviewAny.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Meeting Room: <span className="font-mono">{interviewAny.livekit_room_name || "Unassigned"}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                Round {interviewAny.round_number}
              </span>
              <Button
                onClick={() => router.push(`/${tenantSubdomain}/candidate/dashboard`)}
                variant="outline"
                className="font-bold text-xs h-8 rounded-xl px-4 transition-all shadow-sm cursor-pointer border-border hover:bg-muted/10"
                size="sm"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* WebRTC Video Screen */}
          <div className="aspect-video w-full bg-neutral-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
            {typeof window !== "undefined" && !window.isSecureContext ? (
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
            ) : !hasJoinedSession ? (
              <div className="text-center flex flex-col items-center justify-center p-8 max-w-md mx-auto h-full">
                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
                  <Video className="size-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Join?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Your interview room is ready. Joining will enable full-screen mode, which is required to prevent malpractice during the interview.
                </p>
                <Button onClick={handleJoinCall} className="w-full font-bold h-12 text-base">
                  Join Secure Interview
                </Button>
              </div>
            ) : isInCall ? (
              livekitToken ? (
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={livekitToken}
                  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || (typeof window !== "undefined" ? `ws://${window.location.hostname}:7880` : "ws://localhost:7880")}
                  connect={true}
                  onDisconnected={handleEndCall}
                  className="w-full h-full"
                >
                  <MyCustomConference isInCall={isInCall} />
                </LiveKitRoom>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Connecting to video network...</p>
                </div>
              )
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
                    onClick={() => router.replace(`/${tenantSubdomain}/candidate/dashboard`)}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
