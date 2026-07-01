"use client";

import React, { useState } from "react";
import { Play, Loader2, AlertCircle, Video, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  useGetRecordingStatusApiV1RecordingsSlotIdStatusGet
} from "@repo/orval-config/src/api/media/recording-management/recording-management";
import {
  useGetRecordingSasUrlApiV1RecordingsSlotIdSasUrlGet
} from "@repo/orval-config/src/api/media/recordings/recordings";

interface RecordingProps {
  slotId: number;
  tenantId: string;
}

export function RecordingStatusBadge({ slotId, tenantId }: RecordingProps) {
  const { data: statusData, isLoading, refetch, isRefetching } = useGetRecordingStatusApiV1RecordingsSlotIdStatusGet(
    slotId,
    {
      request: {
        params: { tenant_id: tenantId }
      },
      query: {
        enabled: !!slotId && !!tenantId,
        refetchInterval: (data: any) => {
          const status = data?.status;
          if (status === "STARTING" || status === "RECORDING" || status === "UPLOADING") {
            return 10000;
          }
          return false;
        }
      }
    } as any
  );

  const status = (statusData as any)?.status;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        <span>Loading status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/40">
        No Recording
      </span>
    );
  }

  const styles: Record<string, string> = {
    STARTING: "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse",
    RECORDING: "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse",
    UPLOADING: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    AVAILABLE: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    FAILED: "bg-red-500/10 text-red-500 border border-red-500/20",
    DELETED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
    EXPIRED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
  };

  const labels: Record<string, string> = {
    STARTING: "Starting Recording",
    RECORDING: "● Live Recording",
    UPLOADING: "Saving to Cloud",
    COMPLETED: "Recording Ready",
    AVAILABLE: "Recording Ready",
    FAILED: "Failed",
    DELETED: "Deleted",
    EXPIRED: "Expired"
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || "bg-zinc-500/10 text-zinc-400"}`}>
        {labels[status] || status}
      </span>
      {(status === "STARTING" || status === "RECORDING" || status === "UPLOADING") && (
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-1 hover:bg-muted rounded-full transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`size-3 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

export function InterviewRecordingPlayer({ slotId, tenantId }: RecordingProps) {
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: statusData, isLoading: isLoadingStatus } = useGetRecordingStatusApiV1RecordingsSlotIdStatusGet(
    slotId,
    {
      request: {
        params: { tenant_id: tenantId }
      },
      query: {
        enabled: !!slotId && !!tenantId
      }
    } as any
  );
  const status = (statusData as any)?.status;

  const {
    data: sasData,
    isLoading: isLoadingUrl,
    error: urlError
  } = useGetRecordingSasUrlApiV1RecordingsSlotIdSasUrlGet(
    slotId,
    {},
    {
      query: {
        enabled: shouldFetch && (status === "COMPLETED" || status === "AVAILABLE"),
        retry: false
      }
    } as any
  );

  const sasUrl = (sasData as any)?.sas_url;
  const errorMsg = (urlError as any)?.response?.data?.detail || (urlError as Error)?.message;

  const handleLoadVideo = () => {
    setShouldFetch(true);
  };

  if (isLoadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-border/50 rounded-2xl">
        <Loader2 className="size-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-medium">Checking recording status...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card/30 border border-dashed border-border rounded-2xl text-center">
        <Video className="size-8 text-muted-foreground/45 mb-3" />
        <h4 className="text-sm font-bold text-foreground mb-1">No Recording Found</h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          No live session recording is recorded for this interview.
        </p>
      </div>
    );
  }

  if (status === "STARTING" || status === "RECORDING" || status === "UPLOADING") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card/50 border border-dashed border-border rounded-2xl text-center">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 animate-pulse">
          <Video className="size-5" />
        </div>
        <h4 className="text-sm font-bold text-foreground mb-1">
          {status === "RECORDING" ? "Interview is Being Recorded" : "Recording is Processing"}
        </h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {status === "RECORDING"
            ? "The call is currently being recorded live. The playback player will be available shortly after the meeting ends."
            : "The video file is being uploaded and saved to secure cloud storage. Please wait a few moments."}
        </p>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-destructive/5 border border-destructive/20 rounded-2xl text-center">
        <AlertCircle className="size-8 text-destructive mb-3" />
        <h4 className="text-sm font-bold text-foreground mb-1">Recording Unsuccessful</h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          An error occurred while compiling or uploading the interview stream. Check backend logs for more info.
        </p>
      </div>
    );
  }

  if (status === "DELETED" || status === "EXPIRED") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/40 border border-border rounded-2xl text-center">
        <AlertCircle className="size-8 text-muted-foreground mb-3" />
        <h4 className="text-sm font-bold text-foreground mb-1">Recording Unavailable</h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          This recording has been removed from cloud storage in compliance with the tenant retention policy.
        </p>
      </div>
    );
  }

  if (!sasUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card/65 border border-border/50 rounded-2xl shadow-premium">
        {errorMsg && (
          <p className="text-xs text-destructive flex items-center gap-1.5 mb-3 font-semibold">
            <AlertCircle className="size-3.5" /> {errorMsg}
          </p>
        )}
        <Button onClick={handleLoadVideo} disabled={isLoadingUrl} className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg">
          {isLoadingUrl ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          Load Playback Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-950 rounded-2xl overflow-hidden border border-white/5 shadow-premium animate-in fade-in duration-200">
      <video
        src={sasUrl}
        controls
        controlsList="nodownload"
        className="w-full aspect-video"
      >
        Your browser does not support playing back the video.
      </video>
    </div>
  );
}
