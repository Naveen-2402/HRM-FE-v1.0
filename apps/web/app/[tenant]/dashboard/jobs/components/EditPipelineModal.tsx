"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { useUpdatePipelineApiV1JobsJobIdPipelinePut } from "@repo/orval-config/src/api/job/jobs/jobs";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employee/employees/employees";
import { toast } from "react-toastify";
import HiringRoundsPipelineBuilder from "./HiringRoundsPipelineBuilder";


interface EditPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
    pipeline_stages: any[];
  };
  onSuccess: () => void;
}

export default function EditPipelineModal({ isOpen, onClose, job, onSuccess }: EditPipelineModalProps) {
  const [stages, setStages] = useState<any[]>(job.pipeline_stages?.length ? [...job.pipeline_stages] : [{ name: "AI Screening" }]);
  const { mutate: updatePipeline, isPending } = useUpdatePipelineApiV1JobsJobIdPipelinePut();
  const { data: employeesData } = useListEmployeesApiV1EmployeesGet({ skip: 0, limit: 100 });
  const employeesList = (employeesData as any)?.employees || [];

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

        <HiringRoundsPipelineBuilder
          stages={stages}
          onChange={setStages}
          employeesList={employeesList}
        />

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
