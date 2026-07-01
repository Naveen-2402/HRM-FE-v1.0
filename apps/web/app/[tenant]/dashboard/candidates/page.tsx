"use client";

import React, { useState } from "react";
import { Modal } from "@/components/_shared/Modal";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import { Dropdown, DropdownOption } from "@/components/_shared/Dropdown";
import { useParams } from "next/navigation";
import {
  useGetJobsApiV1JobsGet,
  useApplyToJobApiV1JobsJobIdApplyPost
} from "@repo/orval-config/src/api/job/jobs/jobs";
import {
  useGetCandidatesApiV1CandidatesGet,
  useDeleteCandidateApiV1CandidatesCandidateIdDelete,
  getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet
} from "@repo/orval-config/src/api/candidate/candidates/candidates";
import {
  useGetCreditBalanceApiV1BillingCreditsGet
} from "@repo/orval-config/src/api/billing/billing/billing";
import dynamic from "next/dynamic";

const UploadResumesModal = dynamic(() => import("./components/UploadResumesModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-lg w-full max-w-2xl rounded-xl flex flex-col animate-pulse">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="h-6 w-36 bg-muted rounded"></div>
          <div className="h-6 w-6 bg-muted rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="h-4 w-3/4 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-3 w-28 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded-md"></div>
          </div>
          <div className="flex justify-between gap-3 pt-6 border-t border-border mt-4">
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="h-10 w-32 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

const ShortlistCandidatesModal = dynamic(() => import("./components/ShortlistCandidatesModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-lg w-full max-w-2xl rounded-xl flex flex-col animate-pulse">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="h-6 w-40 bg-muted rounded"></div>
          <div className="h-6 w-6 bg-muted rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded-md"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-32 bg-muted rounded"></div>
            <div className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-4 w-28 bg-muted rounded"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <div className="flex-1 h-10 bg-muted rounded-lg"></div>
            <div className="flex-1 h-10 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

const EditCandidateModal = dynamic(() => import("./components/EditCandidateModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-lg w-full max-w-2xl rounded-xl flex flex-col animate-pulse">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="h-6 w-44 bg-muted rounded"></div>
          <div className="h-6 w-6 bg-muted rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <div className="h-3 w-16 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded-md"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded-md"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded-md"></div>
            </div>
            <div className="space-y-2 col-span-2">
              <div className="h-3 w-32 bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded-md"></div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="h-10 w-32 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
});
import { toast } from "react-toastify";
import { SectionCard } from "@/components/_shared";
import { RefreshCcw, UserPlus, Zap, Filter, Search, ChevronDown, Download, Eye, Trash2, Linkedin, Github, Pencil } from "lucide-react";

export default function CandidatesPage() {
  const params = useParams();
  const tenantId = params?.tenant as string;

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // Data
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [applyCandidateId, setApplyCandidateId] = useState<number | null>(null);
  const [applyJobId, setApplyJobId] = useState<string>("");
  const [editCandidate, setEditCandidate] = useState<any | null>(null);

  // API: Fetch Jobs for the dropdown
  const { data: jobsResponse } = useGetJobsApiV1JobsGet();
  const jobs = Array.isArray(jobsResponse) ? jobsResponse : [];

  // API: Fetch Candidates (Resume Bank)
  const { data: candidatesResponse, isLoading, refetch, isFetching } = useGetCandidatesApiV1CandidatesGet();
  const candidates = Array.isArray(candidatesResponse) ? candidatesResponse : [];

  // API: Apply Candidate to Job
  const { mutate: applyToJob, isPending: isApplying } = useApplyToJobApiV1JobsJobIdApplyPost();

  // API: Delete Candidate
  const { mutate: deleteCandidate, isPending: isDeletingCandidate } = useDeleteCandidateApiV1CandidatesCandidateIdDelete();

  // API: Fetch Credits Balance (Public API)
  const { data: creditsData } = useGetCreditBalanceApiV1BillingCreditsGet();
  const credits = creditsData
    ? (creditsData as any).credit_balance - (creditsData as any).consumed_credits - (creditsData as any).reserved_credits
    : 0;

  const jobOptions: DropdownOption[] = [
    { label: "Select a job...", value: "" },
    ...jobs.map((j: any) => ({ label: j.title, value: j?.id?.toString() }))
  ];

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCandidate({ candidateId: deleteId }, {
      onSuccess: () => {
        toast.success("Candidate deleted successfully");
        refetch();
        setDeleteId(null);
      },
      onError: (error: any) => {
        console.error("Delete failed:", error);
        toast.error(error?.response?.data?.detail || "Failed to delete candidate");
      }
    });
  };

  const handleViewFile = async (candidateId: number, filePath: string) => {
    if (!filePath) return;
    try {
      const res: any = await getDownloadSasApiV1CandidatesCandidateIdDownloadSasGet(candidateId, { file_path: filePath });
      if (res?.download_url) {
        window.open(res.download_url, '_blank');
      }
    } catch (error) {
      console.error("Failed to get download URL:", error);
      toast.error("Could not open file");
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success("JSON copied to clipboard!"))
        .catch(() => toast.error("Failed to copy JSON."));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("JSON copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy JSON.");
      } finally {
        textArea.remove();
      }
    }
  };

  const handleOpenEdit = (c: any) => {
    setEditCandidate(c);
  };

  const handleApplyToJob = () => {
    if (!applyCandidateId || !applyJobId) return;
    applyToJob(
      { jobId: parseInt(applyJobId), data: { candidate_id: applyCandidateId, source: "hr_sourced" } },
      {
        onSuccess: () => {
          toast.success("Candidate added to job successfully.");
          setApplyCandidateId(null);
          setApplyJobId("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to add candidate to job.");
        }
      }
    );
  };

  const statsTotal = candidates.length;
  const statsParsed = candidates.filter((c: any) => c.status?.toLowerCase() === "completed" || !c.status).length;

  return (
    <div className="bg-background min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-tight">Candidate Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {statsTotal} total · {statsParsed} parsed · <span className="text-primary font-semibold">{credits} credits</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsShortlistModalOpen(true)}
            className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer flex items-center gap-2 transition-all hover:bg-secondary/80"
          >
            Shortlist
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <UserPlus className="size-4" /> Upload resumes
          </button>
          <button
            onClick={() => refetch()}
            className="bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:cursor-pointer transition-all hover:bg-secondary/80"
          >
            <RefreshCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <SectionCard className="overflow-hidden p-0 border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium">NAME</th>
                <th className="px-4 py-3 font-medium">PHONE</th>
                <th className="px-4 py-3 font-medium">ROLE</th>
                <th className="px-4 py-3 font-medium text-center">EXP</th>
                <th className="px-4 py-3 font-medium">SKILLS</th>
                <th className="px-4 py-3 font-medium">LINKS</th>
                <th className="px-4 py-3 font-medium text-center">DATA</th>
                <th className="px-4 py-3 font-medium text-center">STATUS</th>
                <th className="px-4 py-3 font-medium text-center">FILES</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading candidates...</td></tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground italic text-sm">No candidates found in the pipeline.</p>
                    </div>
                  </td>
                </tr>
              ) : candidates.map((c: any) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/10">
                  <td className="px-4 py-3 text-primary font-medium">{c.name || "—"}</td>
                  <td className="px-4 py-3 text-primary font-medium">{c.phone_number || "—"}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{c.key_role || "—"}</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">{c.experience_years || 0} yr</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(c.skills || []).slice(0, 2).map((skill: string) => (
                        <span key={skill} className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/10 font-medium">
                          {skill}
                        </span>
                      ))}
                      {(c.skills || []).length > 2 && (
                        <span className="text-primary text-[10px] font-bold">+{(c.skills || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {c.linkedin_url && (
                        <a
                          href={c.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0a66c2] hover:text-[#0a66c2]/80 transition-colors p-1 hover:bg-[#0a66c2]/5 rounded"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="size-4 shrink-0" />
                        </a>
                      )}
                      {c.github_url && (
                        <a
                          href={c.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#24292e] dark:text-foreground hover:text-foreground/80 transition-colors p-1 hover:bg-muted rounded"
                          title="GitHub Profile"
                        >
                          <Github className="size-4 shrink-0" />
                        </a>
                      )}
                      {!c.linkedin_url && !c.github_url && <span className="text-muted-foreground ml-1">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setSelectedCandidate(c); setIsJsonModalOpen(true); }}
                      className="border border-primary/20 text-primary px-3 py-1 rounded text-[11px] font-medium bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      View JSON
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-success/10 text-success border border-success px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      {c.status || "Completed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleViewFile(c.id, c.resume_blob_url)}
                        className="bg-warning/10 text-warning border border-warning/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-warning/20"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleViewFile(c.id, c.parsed_md_url)}
                        className="bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-success/20"
                      >
                        MD
                      </button>
                      <button
                        onClick={() => handleViewFile(c.id, c.dossier_md_url)}
                        className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-primary/20"
                      >
                        AI
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* <button
                        onClick={() => setApplyCandidateId(c.id)}
                        className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all"
                      >
                        Add to Job
                      </button> */}
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                        title="Edit Candidate"
                      >
                        <Pencil className="size-4 shrink-0" />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                        title="Delete Candidate"
                      >
                        <Trash2 className="size-4 shrink-0" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Lazy Loaded Modals */}
      {isUploadModalOpen && (
        <UploadResumesModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={refetch}
        />
      )}

      {isShortlistModalOpen && (
        <ShortlistCandidatesModal
          isOpen={isShortlistModalOpen}
          onClose={() => setIsShortlistModalOpen(false)}
          onSuccess={refetch}
          candidates={candidates}
          jobOptions={jobOptions}
        />
      )}

      {!!editCandidate && (
        <EditCandidateModal
          isOpen={!!editCandidate}
          onClose={() => setEditCandidate(null)}
          candidate={editCandidate}
          onSuccess={refetch}
        />
      )}

      {/* JSON Viewer Modal */}
      <Modal isOpen={isJsonModalOpen} onClose={() => setIsJsonModalOpen(false)} title="Extracted profile JSON">
        <div className="relative group">
          <button
            onClick={() => {
              if (selectedCandidate) {
                const { id, user_id, status, investigation_mode, name, email, phone_number, linkedin_url, github_url, key_role, experience_years, skills, education } = selectedCandidate;
                copyToClipboard(JSON.stringify({ id, user_id, status, investigation_mode, name, email, phone_number, linkedin_url, github_url, key_role, experience_years, skills, education }, null, 2));
              }
            }}
            className="absolute right-4 top-4 bg-muted text-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Copy
          </button>
          <pre className="bg-slate-950 text-slate-100 p-6 rounded-lg text-xs overflow-x-auto max-h-[500px] font-mono leading-relaxed">
            {selectedCandidate && (() => {
              const { id, user_id, status, investigation_mode, name, email, phone_number, linkedin_url, github_url, key_role, experience_years, skills, education } = selectedCandidate;
              return JSON.stringify({ id, user_id, status, investigation_mode, name, email, phone_number, linkedin_url, github_url, key_role, experience_years, skills, education }, null, 2);
            })()}
          </pre>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Candidate"
        description="Are you sure you want to delete this candidate? This action cannot be undone."
        isLoading={isDeletingCandidate}
        isDestructive={true}
      />

      {/* Add To Job Modal */}
      <Modal isOpen={!!applyCandidateId} onClose={() => { setApplyCandidateId(null); setApplyJobId(""); }} title="Add to Job Pipeline">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Select a job to manually add this candidate to the pipeline.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Job</label>
            <Dropdown options={jobOptions} value={applyJobId} onChange={setApplyJobId} className="w-full" />
          </div>
          <div className="flex justify-end pt-4 border-t border-border mt-2">
            <button
              onClick={handleApplyToJob}
              disabled={!applyJobId || isApplying}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isApplying ? "Adding..." : "Add to Job"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}