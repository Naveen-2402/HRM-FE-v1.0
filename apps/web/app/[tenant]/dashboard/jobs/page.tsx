"use client";

import React, { useState } from "react";
import { useGetJobsApiV1JobsGet, useDeleteJobApiV1JobsJobIdDelete } from "@repo/orval-config/src/api/job/jobs/jobs";
import { Modal } from "@/components/_shared/Modal";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import { RefreshCw } from "lucide-react";
import JobCreationFlow from "./components/JobCreationFlow";

import ShortlistResultsModal from "./components/ShortlistResultsModal";
import ShortlistJobModal from "./components/ShortlistJobModal";

export default function JobsPage() {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resultsJob, setResultsJob] = useState<{ id: number; title: string } | null>(null);
  const [shortlistJob, setShortlistJob] = useState<{ id: number; title: string } | null>(null);

  // API Hooks
  const { data: jobsResponse, isLoading, refetch, isFetching } = useGetJobsApiV1JobsGet();

  const jobs = Array.isArray(jobsResponse) ? jobsResponse : [];
  const { mutate: deleteJob } = useDeleteJobApiV1JobsJobIdDelete();

  const handleJobCreated = () => {
    setIsJobModalOpen(false);
    refetch(); // Refresh the list after creation
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteJob({ jobId: deleteId }, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        }
      });
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {jobs.length} active jobs · <span className="text-success-foreground font-semibold">978 credits</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer transition-all"
          >
            + Create job
          </button>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="border border-border bg-card text-foreground px-4 py-2 rounded-md text-sm font-medium hover:cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Refresh"}
          </button>

        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="text-muted-foreground py-20 text-center">Fetching jobs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
              <p className="text-muted-foreground italic mb-3">No jobs created yet.</p>
            </div>
          ) : jobs.map((job: any, index: number) => (
            <div key={job.id || `job-idx-${index}`} className="bg-card border border-border rounded-xl p-6 flex flex-col shadow-sm hover:border-ring transition-colors">
              <h3 className="text-lg font-bold text-foreground mb-2">{job.title}</h3>
              <p className="text-sm text-primary mb-4 line-clamp-3">
                {job.description || "No description available for this role."}
              </p>
              
              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
                <button 
                  onClick={() => setResultsJob({ id: job.id, title: job.title })}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded text-xs font-semibold hover:cursor-pointer transition-colors hover:bg-secondary/80"
                >
                  Results
                </button>
                <button
                  onClick={() => setShortlistJob({ id: job.id, title: job.title })}
                  className="bg-secondary/40 text-secondary-foreground px-4 py-2 rounded text-xs font-semibold hover:cursor-pointer flex items-center gap-1 hover:bg-secondary/60 transition-colors"
                >
                  <span className="text-warning">⚡</span> Shortlist
                </button>
                
                <div className="flex-grow" />

                <button 
                  onClick={() => setDeleteId(job.id)}
                  className="text-destructive text-xs font-bold hover:cursor-pointer px-2 py-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <Modal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        title="Create New Job"
      >
        <JobCreationFlow onComplete={handleJobCreated} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Job"
        description="Are you sure? All associated candidate data for this job will be archived."
      />
      
      {/* Results Modal */}
      <ShortlistResultsModal 
        isOpen={!!resultsJob} 
        onClose={() => setResultsJob(null)} 
        job={resultsJob}
      />

      {/* Shortlist Modal */}
      <ShortlistJobModal
        isOpen={!!shortlistJob}
        onClose={() => setShortlistJob(null)}
        job={shortlistJob}
      />
    </div>
  );
}