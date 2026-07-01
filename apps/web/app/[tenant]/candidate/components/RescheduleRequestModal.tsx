"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { X, CalendarClock, Loader2, Send } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useRequestRescheduleApiV1InterviewsInterviewIdReschedulePost } from "@repo/orval-config/src/api/interview/interviews/interviews";

interface RescheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: number;
  tenantId: string;
  onSuccess: () => void;
}

export function RescheduleRequestModal({
  isOpen,
  onClose,
  interviewId,
  tenantId,
  onSuccess
}: RescheduleRequestModalProps) {
  const [reason, setReason] = useState("");

  const rescheduleMutation = useRequestRescheduleApiV1InterviewsInterviewIdReschedulePost({
    request: {
      headers: {
        "X-Tenant-Id": tenantId
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.warning("Please provide a reason for rescheduling");
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        interviewId: interviewId,
        data: { reason: reason.trim() }
      });
      toast.success("Reschedule request submitted successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Reschedule request error:", err);
      toast.error(err?.response?.data?.detail || "Failed to submit reschedule request");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-lg overflow-hidden rounded-[2rem] shadow-2xl border border-border relative flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors z-30"
          >
            <X className="size-5" />
          </button>

          {/* Header */}
          <div className="sticky top-0 bg-card/90 backdrop-blur-sm z-20 px-8 py-6 border-b border-border flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0">
              <CalendarClock className="size-6 text-warning" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Request Reschedule
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Please let us know why you need to reschedule and your preferred timings.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Reason for Rescheduling
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., I have a prior university exam/work conflict at this time. I would prefer any slot on Friday afternoon instead..."
                  className="w-full min-h-[120px] p-4 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-muted/30 p-6 border-t border-border flex justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="px-6 rounded-xl font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rescheduleMutation.isPending || !reason.trim()}
                className="px-8 rounded-xl font-bold shadow-lg shadow-warning/20 hover:shadow-warning/30 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-warning text-warning-foreground hover:bg-warning/90"
              >
                {rescheduleMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                Submit Request
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
