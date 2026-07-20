"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { X, Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
// Candidate Service hooks — magic links now owned by candidate-service
import {
  useGetSlotsByMagicLinkApiV1InterviewsMagicLinkTokenGet,
  useBookSlotByMagicLinkApiV1InterviewsMagicLinkTokenBookPost
} from "@repo/orval-config/src/api/interview/interviews/interviews";

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  magicLinkToken: string;
  tenantId: string;
  onSuccess: () => void;
}

export function SlotBookingModal({
  isOpen,
  onClose,
  magicLinkToken,
  tenantId,
  onSuccess
}: SlotBookingModalProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch slots by magic link
  const { data: slotsData, isLoading } = useGetSlotsByMagicLinkApiV1InterviewsMagicLinkTokenGet(
    magicLinkToken,
    {
      query: {
        enabled: isOpen && !!magicLinkToken,
      },
      request: {
        headers: {
          "X-Tenant-Id": tenantId
        }
      }
    } as any
  );

  const bookMutation = useBookSlotByMagicLinkApiV1InterviewsMagicLinkTokenBookPost({
    request: {
      headers: {
        "X-Tenant-Id": tenantId
      }
    }
  });

  const slots = useMemo(() => {
    const data = (slotsData as any)?.slots || [];
    return Array.isArray(data) ? data : [];
  }, [slotsData]);

  const interview = useMemo(() => {
    return (slotsData as any)?.interview || null;
  }, [slotsData]);

  // Group slots by day
  const groupedSlots = useMemo(() => {
    const groups: Record<string, any[]> = {};
    slots.forEach((s) => {
      const dayKey = format(new Date(s.start_time), "EEEE, MMMM d, yyyy");
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(s);
    });
    Object.keys(groups).forEach((key) => {
      const arr = groups[key];
      if (arr) {
        arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      }
    });
    return groups;
  }, [slots]);

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) {
      toast.warning("Please select a time slot");
      return;
    }

    try {
      await bookMutation.mutateAsync({
        token: magicLinkToken,
        data: { slot_id: selectedSlotId }
      });
      toast.success("Interview slot confirmed successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err?.response?.data?.detail || "Failed to confirm booking slot");
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
          className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl border border-border relative flex flex-col"
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
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {interview ? `Schedule: ${interview.title}` : "Schedule Your Interview"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {interview?.duration_minutes ? `Duration: ${interview.duration_minutes} minutes` : "Please select a preferred date and time slot."}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary mb-3" />
                <p className="font-semibold text-sm">Loading available slots...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-16 px-4 bg-secondary/20 rounded-2xl border border-dashed border-border">
                <Calendar className="size-10 text-muted-foreground/50 mx-auto mb-3" />
                <h4 className="font-bold text-foreground text-sm">No slots available</h4>
                <p className="text-muted-foreground text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                  There are no slots currently provisioned for this round. Please contact the recruitment coordinator for assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Select a Time Slot
                </div>

                <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2">
                  {Object.entries(groupedSlots).map(([dayKey, daySlots]) => (
                    <div key={dayKey} className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        {dayKey}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {daySlots.map((slot) => {
                          const startDate = new Date(slot.start_time || slot.start);
                          const isExpired = currentTime ? startDate < currentTime : false;
                          const isSelected = selectedSlotId === slot.id;
                          const startTime = format(startDate, "p");
                          const endTime = format(new Date(slot.end_time || slot.end), "p");

                          return (
                            <button
                              key={slot.id}
                              onClick={() => !isExpired && setSelectedSlotId(slot.id)}
                              disabled={isExpired}
                              type="button"
                              title={isExpired ? "This slot has already passed" : ""}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                                isExpired
                                  ? "bg-secondary/20 border-border opacity-70 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02] cursor-pointer"
                                  : "bg-secondary/40 hover:bg-secondary/80 border-border text-foreground hover:scale-[1.01] cursor-pointer"
                              }`}
                            >
                              <Clock className={`size-3.5 ${
                                isExpired ? "text-muted-foreground/50" : isSelected ? "text-primary-foreground" : "text-primary"
                              }`} />
                              <span className={`text-xs font-bold font-mono ${
                                isExpired ? "line-through text-muted-foreground" : ""
                              }`}>
                                {startTime}
                              </span>
                              <span className={`text-[10px] uppercase font-semibold ${
                                isExpired ? "line-through text-muted-foreground/70" : isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                to {endTime}
                              </span>
                              {isExpired && (
                                <span className="text-[10px] text-destructive/90 font-bold mt-0.5 flex items-center gap-1">
                                  Slot expired
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {!isLoading && slots.length > 0 && (
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-sm p-6 border-t border-border flex justify-end gap-4 rounded-b-[2rem]">
              <Button
                onClick={handleConfirmBooking}
                disabled={!selectedSlotId || bookMutation.isPending}
                className="w-full sm:w-auto px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {bookMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="size-4 mr-2" />
                )}
                Confirm Time Slot
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
