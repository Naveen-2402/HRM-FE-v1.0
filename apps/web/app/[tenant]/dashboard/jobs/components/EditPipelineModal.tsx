"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { useUpdatePipelineApiV1JobsJobIdPipelinePut } from "@repo/orval-config/src/api/job/jobs/jobs";
import { toast } from "react-toastify";
import { X, Plus } from "lucide-react";

interface EditPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
    pipeline_stages: string[];
  };
  onSuccess: () => void;
}

export default function EditPipelineModal({ isOpen, onClose, job, onSuccess }: EditPipelineModalProps) {
  const [stages, setStages] = useState<string[]>(job.pipeline_stages?.length ? [...job.pipeline_stages] : ["AI screening", "HR Screening", "Interview", "Offer"]);
  const [newStage, setNewStage] = useState("");
  const { mutate: updatePipeline, isPending } = useUpdatePipelineApiV1JobsJobIdPipelinePut();

  const handleRemove = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (newStage.trim()) {
      setStages([...stages, newStage.trim()]);
      setNewStage("");
    }
  };

  const handleSave = () => {
    updatePipeline(
      { jobId: job.id, data: { pipeline_stages: stages } },
      {
        onSuccess: () => {
          toast.success("Pipeline updated successfully");
          onSuccess();
          onClose();
        },
        onError: () => {
          toast.error("Failed to update pipeline stages");
        }
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Hiring Rounds">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Configure the dynamic hiring rounds for <strong>{job.title}</strong>.
        </p>

        <div className="flex flex-col gap-2">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/20 border border-border p-2 rounded-md">
              <span className="text-sm font-medium text-foreground">{idx + 1}. {stage}</span>
              <button
                onClick={() => handleRemove(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                title="Remove round"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {stages.length === 0 && (
            <div className="text-xs text-muted-foreground italic py-2 text-center border border-dashed border-border rounded-md">
              No stages defined.
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a new round..."
            className="flex-1 bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newStage.trim()}
            className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm font-bold disabled:opacity-50 hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving..." : "Save Rounds"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
