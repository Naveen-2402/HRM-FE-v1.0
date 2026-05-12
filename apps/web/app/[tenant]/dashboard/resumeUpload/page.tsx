"use client";

import React from "react";
import IndependentResumeUpload from "../jobs/components/IndependentResumeUpload";

export default function ResumeUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Upload</h1>
          <p className="text-muted-foreground">
            Upload resumes to the candidate pool for processing and indexing.
          </p>
        </div>
        
        <IndependentResumeUpload />
      </div>
    </div>
  );
}
