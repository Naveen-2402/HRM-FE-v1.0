"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/_shared/Modal";
import { useUpdateCandidateApiV1CandidatesCandidateIdPatch } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { toast } from "react-toastify";

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any | null;
  onSuccess: () => void;
}

export default function EditCandidateModal({ isOpen, onClose, candidate, onSuccess }: EditCandidateModalProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    linkedin_url: "",
    github_url: "",
    key_role: "",
    experience_years: "",
    skills: ""
  });

  const { mutate: updateCandidate, isPending: isUpdatingCandidate } = useUpdateCandidateApiV1CandidatesCandidateIdPatch();

  useEffect(() => {
    if (candidate) {
      setEditForm({
        name: candidate.name || "",
        email: candidate.email || "",
        phone_number: candidate.phone_number || "",
        linkedin_url: candidate.linkedin_url || "",
        github_url: candidate.github_url || "",
        key_role: candidate.key_role || "",
        experience_years: candidate.experience_years ? String(candidate.experience_years) : "",
        skills: Array.isArray(candidate.skills) ? candidate.skills.join(", ") : ""
      });
    }
  }, [candidate]);

  const handleUpdateCandidate = async () => {
    if (!candidate) return;
    updateCandidate(
      {
        candidateId: candidate.id,
        data: {
          ...editForm,
          skills: editForm.skills ? editForm.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : []
        }
      },
      {
        onSuccess: () => {
          toast.success("Candidate updated successfully");
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to update candidate");
        }
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Candidate Details">
      <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto custom-scrollbar pr-2 py-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
            <input
              type="text"
              value={editForm.phone_number}
              onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Role / Designation</label>
            <input
              type="text"
              value={editForm.key_role}
              onChange={(e) => setEditForm({ ...editForm, key_role: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Years of Experience</label>
            <input
              type="number"
              value={editForm.experience_years}
              onChange={(e) => setEditForm({ ...editForm, experience_years: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LinkedIn URL</label>
            <input
              type="text"
              value={editForm.linkedin_url}
              onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GitHub URL</label>
            <input
              type="text"
              value={editForm.github_url}
              onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Skills (comma-separated)</label>
            <textarea
              value={editForm.skills}
              onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
              placeholder="React, TypeScript, Next.js, Node.js"
              rows={3}
              className="bg-background text-foreground border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateCandidate}
            disabled={isUpdatingCandidate}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isUpdatingCandidate ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
