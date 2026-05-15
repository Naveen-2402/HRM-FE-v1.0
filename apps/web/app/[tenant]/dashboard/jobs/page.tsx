"use client";

import React, { useState } from "react";
import { useGetJobsApiV1JobsGet, useDeleteJobApiV1JobsJobIdDelete } from "@repo/orval-config/src/api/job/jobs/jobs";
import { Modal } from "@/components/_shared/Modal";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import { SectionCard } from "@/components/_shared";
import { Handshake, RefreshCw } from "lucide-react";
import JobCreationFlow from "./components/JobCreationFlow";
import { useGetCreditBalanceApiV1BillingCreditsGet } from "@repo/orval-config/src/api/billing/billing/billing";

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

  // API: Fetch Credits Balance
  const { data: creditsData } = useGetCreditBalanceApiV1BillingCreditsGet();
  const credits = creditsData 
    ? (creditsData as any).credit_balance - (creditsData as any).consumed_credits - (creditsData as any).reserved_credits
    : 0;

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
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-tight">Job Management</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {jobs.length} active roles · <span className="text-primary font-semibold">{credits} credits</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center gap-2"
          >
            <Handshake className="size-4" /> Create new job
          </button>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer transition-all hover:bg-secondary/80 flex items-center gap-2 disabled:opacity-50"
          >
            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Refresh"}
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="text-muted-foreground py-20 text-center">Fetching jobs...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-muted/5">
              <p className="text-muted-foreground font-medium mb-3">No jobs created yet.</p>
            </div>
          ) : jobs.map((job: any, index: number) => (
            <SectionCard key={job.id || `job-idx-${index}`} className="p-8 flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-foreground tracking-tight text-tight leading-tight">{job.title}</h3>
                <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <Handshake className="size-4" />
                </div>
              </div>
              <p className="text-[13.5px] text-muted-foreground/80 leading-relaxed mb-6 line-clamp-3">
                {job.description || "No description available for this role."}
              </p>
              
              <div className="mt-auto flex items-center gap-3 pt-6 border-t border-border/50">
                <button 
                  onClick={() => setResultsJob({ id: job.id, title: job.title })}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  View Results
                </button>
                <button
                  onClick={() => setShortlistJob({ id: job.id, title: job.title })}
                  className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:cursor-pointer transition-all hover:bg-secondary/80"
                >
                  Shortlist
                </button>
                
                <div className="flex-grow" />

                <button 
                  onClick={() => setDeleteId(job.id)}
                  className="text-muted-foreground hover:text-destructive text-xs font-bold hover:cursor-pointer px-3 py-2 hover:bg-destructive/10 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </SectionCard>
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