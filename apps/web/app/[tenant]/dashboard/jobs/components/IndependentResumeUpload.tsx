"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface JobCreationFlowProps {
  onComplete?: () => void;
}

export default function IndependentResumeUpload({ onComplete }: JobCreationFlowProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const uploadResumeApi = async (
    files: File[], 
    jobId: string | null = null
  ): Promise<{ success: boolean; message: string }> => {
    console.log(`Mock API: Uploading ${files.length} resumes. Job ID: ${jobId || "None (Pool)"}`);
    const formData = new FormData();
    files.forEach((file) => formData.append("resumes", file));
    if (jobId) formData.append("job_id", jobId);

    return new Promise((resolve) => 
      setTimeout(() => resolve({ success: true, message: "Uploaded to blob successfully" }), 1500)
    );
  };

  const uploadMutation = useMutation({
    mutationFn: () => uploadResumeApi(selectedFiles, null), // null jobId indicates Pool upload
    onSuccess: () => {
      setSelectedFiles([]);
      // Optional: Add a toast notification here
    },
  });

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 max-w-2xl mx-auto mt-8">
      <div className="mb-6">
        <h2 className="text-foreground text-xl font-bold">Add to Candidate Pool</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Upload resumes to process and store in your global candidate database. They will be available for future shortlisting.
        </p>
      </div>

      <div className="bg-muted border border-border border-dashed p-10 text-center rounded-lg flex flex-col items-center justify-center gap-4">
        <div className="bg-background border border-border p-3 rounded-full">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        
        <div>
          <input
            type="file"
            multiple
            accept=".pdf,.docx"
            className="hidden"
            id="resume-upload-pool"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          />
          <label 
            htmlFor="resume-upload-pool" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium hover:cursor-pointer inline-block"
          >
            Browse Files
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <ul className="text-sm text-foreground space-y-1 mt-4 w-full max-w-xs text-left">
            {selectedFiles.map((file, idx) => (
              <li key={idx} className="flex justify-between items-center bg-background px-3 py-2 rounded border border-border">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button 
                  onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                  className="text-destructive hover:text-destructive/80 font-bold hover:cursor-pointer"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => uploadMutation.mutate()}
          disabled={selectedFiles.length === 0 || uploadMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium hover:cursor-pointer disabled:opacity-50"
        >
          {uploadMutation.isPending ? "Uploading to Pool..." : "Upload to Pool"}
        </button>
      </div>

      {uploadMutation.isSuccess && (
        <div className="mt-4 p-3 bg-success text-success-foreground rounded-md text-sm font-medium text-center">
          Successfully uploaded! The Parsing Service is now analyzing these resumes.
        </div>
      )}
      
      {uploadMutation.isError && (
        <div className="mt-4 p-3 bg-destructive text-destructive-foreground rounded-md text-sm font-medium text-center">
          An error occurred while uploading. Please try again.
        </div>
      )}
    </div>
  );
}