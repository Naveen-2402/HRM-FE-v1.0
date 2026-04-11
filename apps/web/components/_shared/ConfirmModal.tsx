"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={stopPropagation}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl pointer-events-auto"
            >
              <div className="p-6 sm:p-8 space-y-4">
                {/* Header/Icon */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`flex size-14 items-center justify-center rounded-full border ${
                      isDestructive
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : "border-primary/20 bg-primary/10 text-primary"
                    }`}
                  >
                    <AlertTriangle className="size-6" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-card-foreground">
                    {title}
                  </h2>
                </div>

                {/* Description */}
                <div className="text-sm text-muted-foreground text-center">
                  {description}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto hover:cursor-pointer"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full sm:w-auto hover:cursor-pointer ${
                    isDestructive
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}