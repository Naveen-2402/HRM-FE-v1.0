"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Briefcase,
  AlertCircle,
  Share2,
  DollarSign,
  Check,
  User,
  Users,
  Settings,
  Plus,
  Trash2,
  Video,
  Shield,
  Loader2,
  ChevronRight,
  ChevronDown,
  Info,
  X
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";

// API Hooks
import {
  useGetJobApiV1JobsJobIdGet,
  useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet,
  useUpdatePipelineApiV1JobsJobIdPipelinePut
} from "@repo/orval-config/src/api/job/jobs/jobs";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employees/employees";
import { Dropdown } from "@/components/_shared/Dropdown";
import { DateTimePicker } from "@/components/_shared/DateTimePicker";
import {
  useListInterviewsApiV1InterviewsGet,
  useGetJobConfigApiV1InterviewsJobConfigsJobIdGet,
  useCreateOrUpdateJobConfigApiV1InterviewsJobConfigsPost,
  useCreateInterviewApiV1InterviewsPost,
  useUpdateInterviewApiV1InterviewsInterviewIdPatch,
  useCreateInterviewSlotsApiV1InterviewsInterviewIdSlotsPost,
  useGenerateMagicLinkApiV1InterviewsMagicLinkPost,
  useRecommendSlotsApiV1InterviewsInterviewIdRecommendPost
} from "@repo/orval-config/src/api/interview/interviews/interviews";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { customInstance } from "@repo/orval-config/src/axios-setup";

// Component imports
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements_json: Record<string, string> | null;
  start_time: string | null;
  end_time: string | null;
  pipeline_stages: string[] | null;
  created_at: string;
  jobCategory?: string;
  experienceLevel?: string;
  employmentType?: string;
  workplaceModel?: string;
  location?: { city: string; state?: string; country: string } | null;
  department?: string;
  roleDescription?: { roleSummary?: string; keyResponsibilities?: string[] } | null;
  candidateQualifications?: { mustHaveRequirements?: string[]; preferredQualifications?: string[] } | null;
  compensationAndBenefits?: { salaryMin?: number; salaryMax?: number; currency?: string; compensationType?: string; benefitsSummary?: string[] } | null;
  applicationLogistics?: { applicationDeadline?: string } | null;
}

interface MappedJob {
  id: string;
  title: string;
  location: string;
  country: string;
  continent: string;
  type: string;
  experience: string;
  jobNo: string;
  skillRequired: string;
  qualifications: string;
  about: string;
  postedAt: string;
  category: string;
}

function mapJobToMappedJob(job: Job): MappedJob {
  const category = job.jobCategory || "General";
  const experience = job.experienceLevel || "Mid-level";
  const type = job.employmentType || "Full-time";

  const city = job.location?.city || "";
  const country = job.location?.country || "Anywhere";

  let location = job.workplaceModel || "Remote";
  if (city) {
    location = `${city} (${job.workplaceModel || "On-site"})`;
  }

  let continent = "Global";
  const countryLower = country.toLowerCase();
  if (["usa", "us", "canada", "united states"].some(c => countryLower.includes(c))) {
    continent = "North America";
  } else if (["uk", "united kingdom", "london", "germany", "france", "europe", "italy", "spain", "netherlands"].some(c => countryLower.includes(c))) {
    continent = "Europe";
  } else if (["india", "singapore", "japan", "china", "asia"].some(c => countryLower.includes(c))) {
    continent = "Asia";
  } else if (["australia"].some(c => countryLower.includes(c))) {
    continent = "Oceania";
  } else if (["brazil", "argentina"].some(c => countryLower.includes(c))) {
    continent = "South America";
  }

  let skillRequired = "See job description for specific requirements.";
  if (job.candidateQualifications?.mustHaveRequirements && job.candidateQualifications.mustHaveRequirements.length > 0) {
    skillRequired = job.candidateQualifications.mustHaveRequirements.join(", ");
  } else if (job.requirements_json && typeof job.requirements_json === 'object' && !Array.isArray(job.requirements_json)) {
    const reqKeys = Object.keys(job.requirements_json);
    if (reqKeys.length > 0) {
      skillRequired = reqKeys.join(", ");
    }
  }

  let qualifications = "Relevant degree or equivalent practical experience required.";
  if (job.candidateQualifications?.preferredQualifications && job.candidateQualifications.preferredQualifications.length > 0) {
    qualifications = job.candidateQualifications.preferredQualifications.join(", ");
  }

  const about = job.roleDescription?.roleSummary || job.description || "No description provided.";

  return {
    id: String(job.id),
    title: job.title || "Untitled Position",
    location,
    country,
    continent,
    type,
    experience,
    jobNo: `JOB-${job.id}`,
    category,
    skillRequired,
    qualifications,
    about,
    postedAt: job.created_at || new Date().toISOString()
  };
}

// ISO string to local datetime-local input format
const toDateTimeLocalString = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export default function JobDashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const jobIdStr = params.jobId as string;
  const jobId = Number(jobIdStr);

  const [activeTab, setActiveTab] = useState<"details" | "rounds">("details");
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);

  // Scheduling Configurations state
  const [roundDate, setRoundDate] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [minQuorum, setMinQuorum] = useState<number>(1);
  const [suggestedSlotsCount, setSuggestedSlotsCount] = useState<number>(3);
  const [assignedPanelMembers, setAssignedPanelMembers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSchedulingInProgress, setIsSchedulingInProgress] = useState<boolean>(false);
  const [mockCandidates, setMockCandidates] = useState<any[]>([]);
  const [aiDeadline, setAiDeadline] = useState<string>("");
  const [showStandardInfo, setShowStandardInfo] = useState<boolean>(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState<boolean>(true);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);

  // 1. Fetch Tenant details
  const { data: tenantDetails } = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    {
      query: {
        enabled: !!tenant,
      },
    } as any
  );
  const tenantId = (tenantDetails as any)?.id || "";

  // 2. Fetch Job Details (Private Authed endpoint)
  const { data: jobResponse, isLoading: isLoadingJob, refetch: refetchJob } = useGetJobApiV1JobsJobIdGet(
    jobId,
    {
      query: {
        enabled: !!jobId,
      }
    } as any
  );
  const job = jobResponse as Job | undefined;

  // Sync aiDeadline from raw stage object whenever the selected round changes
  useEffect(() => {
    if (!job?.pipeline_stages) return;
    const rawStage = (job.pipeline_stages as any[])[selectedRoundIndex];
    if (rawStage && typeof rawStage === "object" && (rawStage as any).ai_deadline) {
      const d = new Date((rawStage as any).ai_deadline);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setAiDeadline(local);
    } else {
      setAiDeadline("");
    }
  }, [selectedRoundIndex, job]);

  // 3. Fetch Job Config (Min Quorum)
  const { data: jobConfigResponse, refetch: refetchJobConfig } = useGetJobConfigApiV1InterviewsJobConfigsJobIdGet(
    jobId,
    {
      query: {
        enabled: !!jobId,
      }
    } as any
  );

  useEffect(() => {
    if (jobConfigResponse) {
      setMinQuorum((jobConfigResponse as any).min_quorum || 1);
    }
  }, [jobConfigResponse]);

  // 4. Fetch Candidates/Evaluations in Pipeline
  const { data: evaluationsResponse, isLoading: isLoadingEvaluations, refetch: refetchEvaluations } = useGetJobEvaluationsApiV1JobsJobIdEvaluationsGet(
    jobId,
    {
      query: {
        enabled: !!jobId,
      }
    } as any
  );
  const evaluationsList = useMemo(() => {
    return Array.isArray(evaluationsResponse) ? (evaluationsResponse as any[]) : [];
  }, [evaluationsResponse]);

  // 5. Fetch Interviews already created
  const { data: interviewsResponse, isLoading: isLoadingInterviews, refetch: refetchInterviews } = useListInterviewsApiV1InterviewsGet(
    { job_id: jobId } as any,
    {
      query: {
        enabled: !!jobId,
      }
    } as any
  );
  const interviewsList = useMemo(() => {
    return Array.isArray(interviewsResponse) ? (interviewsResponse as any[]) : [];
  }, [interviewsResponse]);

  // 6. Fetch Employees (Filter to recruiters, recruiting managers and hiring managers)
  const { data: employeesResponse } = useListEmployeesApiV1EmployeesGet(
    { limit: 100 },
    {
      query: {
        enabled: !!tenantId,
      }
    } as any
  );

  const employeesList = useMemo(() => {
    const list = (employeesResponse as any)?.employees;
    return Array.isArray(list) ? list : [];
  }, [employeesResponse]);

  // Filter employees for the panel selection pool: recruiters, recruiting managers, hiring managers, and interviewers
  const panelPool = useMemo(() => {
    return employeesList.filter((emp: any) => {
      const roleStr = (emp.tenant_role || emp.role || "").toLowerCase();
      return ["recruiter", "recruiting-manager", "recruiting_manager", "hiring-manager", "hiring_manager", "interviewer"].includes(roleStr);
    });
  }, [employeesList]);

  // Mutation hooks
  const updateJobConfigMutation = useCreateOrUpdateJobConfigApiV1InterviewsJobConfigsPost();
  const createInterviewMutation = useCreateInterviewApiV1InterviewsPost();
  const updateInterviewMutation = useUpdateInterviewApiV1InterviewsInterviewIdPatch();
  const updatePipelineMutation = useUpdatePipelineApiV1JobsJobIdPipelinePut();
  const createInterviewSlotsMutation = useCreateInterviewSlotsApiV1InterviewsInterviewIdSlotsPost();
  const generateMagicLinkMutation = useGenerateMagicLinkApiV1InterviewsMagicLinkPost();

  // Pipeline Stages definition (extract string names for display)
  const pipelineStages = useMemo(() => {
    if (!job?.pipeline_stages) {
      return ["Screening", "Human Interview", "Culture Fit", "Manager Round"];
    }
    return job.pipeline_stages.map((stage: any) =>
      typeof stage === "string" ? stage : (stage?.name || "Unknown Round")
    );
  }, [job]);

  // Keep raw stage objects for reading/writing per-stage metadata (e.g. ai_deadline)
  const rawPipelineStages = useMemo(() => {
    return job?.pipeline_stages || [];
  }, [job]);

  // Current selected stage name
  const currentStageName = useMemo(() => {
    return pipelineStages[selectedRoundIndex] || "Unknown Stage";
  }, [pipelineStages, selectedRoundIndex]);

  // Check if current stage is an AI interview round (not AI Screening — that's automatic)
  const isAIInterviewRound = useMemo(() => {
    const name = currentStageName.toLowerCase();
    return name.includes("ai") && name.includes("interview") && !name.includes("screen");
  }, [currentStageName]);

  // Check if current stage is human interview round or custom round (excludes AI Screening and AI Interview)
  const isHumanInterviewRound = useMemo(() => {
    if (isAIInterviewRound) return false;
    const name = currentStageName.toLowerCase();
    const isScreening = name.includes("ai") && name.includes("screen");
    return !isScreening;
  }, [currentStageName, isAIInterviewRound]);

  const isCurrentRoundCustom = useMemo(() => {
    const name = currentStageName.toLowerCase();
    const isAI = name.includes("ai");
    const isHuman = name.includes("hr interview") || name.includes("human");
    return !isAI && !isHuman;
  }, [currentStageName]);

  // Candidates currently in the selected stage
  const stageCandidates = useMemo(() => {
    const active = evaluationsList.filter(
      (ev: any) => ev.current_stage_index === selectedRoundIndex
    );
    return [...active, ...mockCandidates.filter(c => c.current_stage_index === selectedRoundIndex)];
  }, [evaluationsList, selectedRoundIndex, mockCandidates]);

  const mappedJob = useMemo(() => (job ? mapJobToMappedJob(job) : null), [job]);

  // Recommendation Engine API Hook
  const recommendMutation = useRecommendSlotsApiV1InterviewsInterviewIdRecommendPost();

  const handleGetSuggestions = async () => {
    if (!roundDate) {
      toast.error("Please select a target start date.");
      return;
    }

    if (new Date(roundDate).getTime() < Date.now()) {
      toast.error("Incorrect date or time chosen.");
      return;
    }

    if (stageCandidates.length === 0) {
      toast.error("No candidates in the queue to schedule.");
      return;
    }

    if (selectedCandidateIds.length === 0) {
      toast.error("Please select at least one candidate to schedule.");
      return;
    }

    const candidatesToSchedule = stageCandidates.filter((c: any) => selectedCandidateIds.includes(Math.abs(c.candidate_id || c.id)));

    if (isCurrentRoundCustom) {
      // Simple client-side slot generator for custom rounds
      const baseDate = new Date(roundDate);
      const startHour = baseDate.getHours() || 9;
      const startMinute = baseDate.getMinutes() || 0;

      const newSuggestions = candidatesToSchedule.map((cand: any, idx: number) => {
        const slots: { startTime: string; endTime: string }[] = [];

        for (let s = 0; s < suggestedSlotsCount; s++) {
          const dayOffset = Math.floor(s / 2);
          const hourOffset = (s % 2) * 2;

          const start = new Date(roundDate);
          start.setHours(startHour, startMinute + idx * (durationMinutes + 15), 0, 0);

          const slotStart = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

          slots.push({
            startTime: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            endTime: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
          });
        }

        return {
          candidateId: cand.candidate_id || cand.id,
          candidateName: cand.candidate_name || cand.name || `Candidate ${idx + 1}`,
          stageIndex: selectedRoundIndex,
          slots,
          panelMembers: [],
        };
      });

      setSuggestions(newSuggestions);
      toast.success("Generated slots for custom round.");
      return;
    }

    // Human Interview Round: call backend recommendation engine API
    if (assignedPanelMembers.length === 0) {
      toast.error("Please assign at least one panel member.");
      return;
    }

    try {
      const baseDate = new Date(roundDate);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const startDateStr = baseDate.toISOString();
      const endDateStr = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Pre-calculate panel rotation/quorum for each candidate to request specific conflict-free slots
      const candidatesPayload = candidatesToSchedule.map((cand: any, idx: number) => {
        let panel: string[] = [];
        if (assignedPanelMembers.length <= minQuorum) {
          panel = [...assignedPanelMembers];
        } else {
          panel = [];
          for (let i = 0; i < minQuorum; i++) {
            const pmIndex = (idx + i) % assignedPanelMembers.length;
            const memberId = assignedPanelMembers[pmIndex];
            if (memberId) {
              panel.push(memberId);
            }
          }
        }
        return {
          id: cand.candidate_id || cand.id,
          name: cand.candidate_name || cand.name || `Candidate ${idx + 1}`,
          panel_members: panel
        };
      });

      const payload = {
        duration_minutes: durationMinutes,
        buffer_minutes: 15,
        timezone: userTimezone,
        start_date: startDateStr,
        end_date: endDateStr,
        selected_interviewers: assignedPanelMembers,
        limit: suggestedSlotsCount,
        candidates: candidatesPayload
      };

      recommendMutation.mutate(
        {
          interviewId: 0,
          data: payload as any
        },
        {
          onSuccess: (response: any) => {
            if (!response) {
              toast.warn("No suggestions returned from the scheduling service.");
              setSuggestions([]);
              return;
            }

            let hasInvalidSlots = false;

            const newSuggestions = candidatesToSchedule.map((cand: any, idx: number) => {
              const candId = cand.candidate_id || cand.id;

              // Find candidate-specific recommendations
              let candRecs = response.recommendations || [];
              if (response.candidate_recommendations) {
                const found = response.candidate_recommendations.find(
                  (cr: any) => String(cr.candidate_id) === String(candId)
                );
                if (found) {
                  candRecs = found.recommendations || [];
                }
              }
              let slots = candRecs.map((rec: any) => ({
                startTime: rec.start_time,
                endTime: rec.end_time
              }));

              // Sort ascending
              slots.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

              // Filter out duplicates and past times
              const validSlots = [];
              const seen = new Set();
              for (const slot of slots) {
                if (new Date(slot.startTime).getTime() > Date.now() && !seen.has(slot.startTime)) {
                  seen.add(slot.startTime);
                  validSlots.push(slot);
                }
              }

              if (validSlots.length === 0 && candRecs.length > 0) {
                hasInvalidSlots = true;
              }

              slots = validSlots;

              const candPayload = candidatesPayload.find((cp: any) => String(cp.id) === String(candId));
              const panel = candPayload ? candPayload.panel_members : [...assignedPanelMembers];

              return {
                candidateId: candId,
                candidateName: cand.candidate_name || cand.name || `Candidate ${idx + 1}`,
                stageIndex: selectedRoundIndex,
                slots,
                panelMembers: panel,
              };
            });

            if (hasInvalidSlots) {
              toast.error("Incorrect date or time slot chosen. Please select a valid future date.");
              setSuggestions([]);
              return;
            }

            const hasEmptySlots = newSuggestions.some((s: any) => s.slots.length === 0);
            if (hasEmptySlots) {
              toast.warn("Could not find conflict-free slots for some candidates. Consider adjusting date range or interviewer hours.");
            }

            setSuggestions(newSuggestions);
            toast.success("Successfully generated scheduling suggestions based on interviewer availability.");
          },
          onError: (err: any) => {
            console.error(err);
            const detail = err?.response?.data?.detail || "Failed to generate suggestions. Please check your inputs.";
            toast.error(detail);
            setSuggestions([]);
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    }
  };

  // Update specific slot datetime value
  const updateSlotDateTime = (candidateIdx: number, slotIdx: number, datetimeStr: string) => {
    if (!datetimeStr) return;
    const start = new Date(datetimeStr);

    if (start.getTime() < Date.now()) {
      toast.error("Cannot select a time in the past.");
      return;
    }

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const newStartStr = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    // Check for duplicates
    const candidate = suggestions[candidateIdx];
    if (candidate) {
      const isDuplicate = candidate.slots.some((s: any, sIdx: number) => sIdx !== slotIdx && s.startTime === newStartStr);
      if (isDuplicate) {
        toast.error("This time slot already exists for this candidate.");
        return;
      }
    }

    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;

      const updatedSlots = item.slots.map((s: any, sIdx: number) => sIdx === slotIdx ? {
        startTime: newStartStr,
        endTime: format(end, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
      } : s);

      // Sort chronological
      updatedSlots.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return {
        ...item,
        slots: updatedSlots
      };
    }));
  };

  // Add slot option to a candidate's suggestion
  const addSlotOption = (candidateIdx: number) => {
    const candidate = suggestions[candidateIdx];
    if (!candidate) return;

    // Sort to easily find the latest slot
    const sortedSlots = [...candidate.slots].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    let start: Date;
    if (lastSlot) {
      // Set to 15 mins after the end of the latest slot
      start = new Date(new Date(lastSlot.endTime).getTime() + 15 * 60 * 1000);
    } else {
      start = new Date(roundDate || Date.now());
      start = new Date(start.getTime() + 60 * 60 * 1000);
    }

    // Ensure not in the past
    if (start.getTime() < Date.now()) {
      start = new Date(Date.now() + 15 * 60 * 1000); // at least 15 min from now
    }

    let end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    let newStartStr = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    // Check duplicate
    let isDuplicate = candidate.slots.some((s: any) => s.startTime === newStartStr);
    if (isDuplicate) {
      start = new Date(start.getTime() + (durationMinutes + 15) * 60 * 1000);
      end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      newStartStr = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }

    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;

      const updatedSlots = [
        ...item.slots,
        {
          startTime: newStartStr,
          endTime: format(end, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
        }
      ];

      updatedSlots.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return {
        ...item,
        slots: updatedSlots
      };
    }));
  };

  // Remove slot option from a candidate's suggestion
  const removeSlotOption = (candidateIdx: number, slotIdx: number) => {
    setSuggestions(prev => prev.map((item, idx) => {
      if (idx !== candidateIdx) return item;
      if (item.slots.length <= 1) {
        toast.warning("Candidates must have at least one time slot option.");
        return item;
      }
      return {
        ...item,
        slots: item.slots.filter((_: any, sIdx: number) => sIdx !== slotIdx)
      };
    }));
  };

  // Toggle single panel member inside a specific slot
  const togglePanelMemberForCandidate = (index: number, employeeId: string) => {
    setSuggestions(prev => prev.map((s, idx) => {
      if (idx !== index) return s;
      const alreadyAssigned = s.panelMembers.includes(employeeId);
      const newPanel = alreadyAssigned
        ? s.panelMembers.filter((id: string) => id !== employeeId)
        : [...s.panelMembers, employeeId];
      return { ...s, panelMembers: newPanel };
    }));
  };

  // Dispatch scheduled slots to backend
  const handleConfirmSchedule = async () => {
    if (suggestions.length === 0) {
      toast.error("No suggestions generated yet.");
      return;
    }

    const missingPanel = suggestions.find(s => s.panelMembers.length === 0);
    if (missingPanel) {
      toast.error(`Please assign at least one panel member for ${missingPanel.candidateName}.`);
      return;
    }

    // Validate slots on client side first to ensure none are in the past
    const now = new Date();
    for (const item of suggestions) {
      for (const slot of item.slots) {
        if (new Date(slot.startTime) < now) {
          toast.error(`Cannot schedule interview with slots in the past (candidate: ${item.candidateName})`);
          return;
        }
      }
    }

    setIsSchedulingInProgress(true);
    let successCount = 0;

    try {
      // 1. Update/Save quorum configuration on backend
      await new Promise((resolve, reject) => {
        updateJobConfigMutation.mutate(
          {
            data: {
              job_id: jobId,
              min_quorum: minQuorum,
            }
          },
          {
            onSuccess: resolve,
            onError: reject
          }
        );
      });

      // 2. Loop through suggestions and create scheduled interviews
      for (const item of suggestions) {
        // Map panel members to payload payload format: [{user_id: string, role: string}]
        const panelPayload = item.panelMembers.map((id: string) => {
          const emp = panelPool.find(e => e.id === id);
          return {
            user_id: id,
            role: emp?.tenant_role || emp?.role || "interviewer"
          };
        });

        // A. Create interview
        let createdInterview: any = null;
        try {
          createdInterview = await new Promise((resolve, reject) => {
            createInterviewMutation.mutate(
              {
                data: {
                  job_id: jobId,
                  candidate_id: item.candidateId,
                  title: `${currentStageName} - ${item.candidateName}`,
                  round_number: selectedRoundIndex,
                  duration_minutes: durationMinutes,
                  panel_members: panelPayload
                }
              },
              {
                onSuccess: (data) => resolve(data),
                onError: (err) => reject(err)
              }
            );
          });

          // B. Add slot options
          await new Promise((resolve, reject) => {
            createInterviewSlotsMutation.mutate(
              {
                interviewId: createdInterview.id,
                data: {
                  slots: item.slots.map((s: any) => ({
                    start_time: s.startTime,
                    end_time: s.endTime
                  }))
                }
              },
              {
                onSuccess: resolve,
                onError: reject
              }
            );
          });

          // C. Generate magic link
          await new Promise((resolve, reject) => {
            generateMagicLinkMutation.mutate(
              {
                data: {
                  interview_id: createdInterview.id,
                  expires_in_hours: 48
                }
              },
              {
                onSuccess: resolve,
                onError: reject
              }
            );
          });

          successCount++;
        } catch (innerError: any) {
          // If we created the interview but slot creation or magic link fails, delete the interview to avoid broken state
          if (createdInterview?.id) {
            try {
              await customInstance({
                url: `/api/v1/interviews/${createdInterview.id}`,
                method: "DELETE",
                headers: {
                  "X-Tenant-Id": tenantId
                }
              } as any);
            } catch (delErr) {
              console.error("Failed to delete/rollback interview:", delErr);
            }
          }
          throw innerError;
        }
      }
      toast.success(`Successfully configured and scheduled ${successCount} interviews!`);
      setRoundDate("");
      setSuggestions([]);
      setMockCandidates([]);
      refetchInterviews();
      refetchJobConfig();
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail || "An error occurred during scheduling.";
      toast.error(detail);
    } finally {
      setIsSchedulingInProgress(false);
    }
  };

  if (isLoadingJob || isLoadingEvaluations || isLoadingInterviews) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 text-muted-foreground">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="font-bold text-sm">Loading job position details...</p>
      </div>
    );
  }

  if (!job || !mappedJob) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 text-muted-foreground">
        <AlertCircle className="size-10 text-destructive" />
        <p className="font-bold text-sm">Job position not found or no longer active.</p>
        <Button onClick={() => router.push(`/${tenant}/dashboard/jobs`)} className="text-xs bg-primary text-primary-foreground cursor-pointer">
          Back to Jobs List
        </Button>
      </div>
    );
  }

  // Get active interviews for selected round
  const activeInterviews = interviewsList.filter(iv => iv.round_number === selectedRoundIndex);

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-4 pb-8 flex flex-col gap-4 h-full overflow-y-auto relative">

      {/* Glow elements */}
      <div className="absolute top-10 right-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navigation & Header */}
      <div className="flex flex-col gap-4 relative z-10">
        <button
          onClick={() => router.push(`/${tenant}/dashboard/jobs`)}
          className="-mt-2 group flex items-center gap-2 text-sm text-white font-medium hover:opacity-80 transition-opacity cursor-pointer w-fit"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to job management
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="size-3.5" /> {mappedJob.category}
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight text-tight leading-tight">
              {mappedJob.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium mt-2">
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" /> {mappedJob.location}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-primary" /> {mappedJob.type}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><User className="size-3.5 text-primary" /> {mappedJob.experience}</span>
              <span>•</span>
              <span className="border border-border px-2 py-0.5 rounded bg-muted/50">ID: {mappedJob.jobNo}</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex bg-muted/50 border border-border p-1 rounded-xl h-11 w-fit">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "details"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab("rounds")}
              className={`px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "rounds"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Rounds & Scheduling
              <span className="size-2 rounded-full bg-primary animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content conditional rendering */}
      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait">

          {/* TAB 1: Job Details Display */}
          {activeTab === "details" && (
            <motion.div
              key="details-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* Left Column: Descriptions, Responsibilities, Requirements */}
              <div className="lg:col-span-2 space-y-10 text-foreground/90 leading-relaxed text-sm">

                {/* About the Role */}
                <section className="bg-card/45 border border-border/50 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground mb-4">About the Role</h2>
                  <p className="text-muted-foreground font-medium mb-3">{job.roleDescription?.roleSummary || job.description}</p>
                </section>

                {/* Key Responsibilities */}
                {job.roleDescription?.keyResponsibilities && job.roleDescription.keyResponsibilities.length > 0 && (
                  <section className="bg-card/45 border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-4">Key Responsibilities</h2>
                    <ul className="space-y-3">
                      {job.roleDescription.keyResponsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Requirements */}
                <section className="bg-card/45 border border-border/50 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground mb-4">Candidate Requirements</h2>
                  <div className="space-y-6">
                    {job.candidateQualifications?.mustHaveRequirements && job.candidateQualifications.mustHaveRequirements.length > 0 ? (
                      <div>
                        <h3 className="text-xs font-bold text-primary mb-2.5 uppercase tracking-wider">Must-Have Qualifications</h3>
                        <ul className="space-y-3.5">
                          {job.candidateQualifications.mustHaveRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                              <span className="text-muted-foreground">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-primary" />
                          <span><strong className="text-foreground">Core Skills:</strong> <span className="text-muted-foreground">{mappedJob.skillRequired}</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-primary" />
                          <span><strong className="text-foreground">Experience:</strong> <span className="text-muted-foreground">{mappedJob.experience} of industry matching experience.</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-primary" />
                          <span><strong className="text-foreground">Education:</strong> <span className="text-muted-foreground">{mappedJob.qualifications}</span></span>
                        </li>
                      </ul>
                    )}

                    {job.candidateQualifications?.preferredQualifications && job.candidateQualifications.preferredQualifications.length > 0 && (
                      <div className="pt-4 border-t border-border/40">
                        <h3 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wider">Preferred Qualifications</h3>
                        <ul className="space-y-3">
                          {job.candidateQualifications.preferredQualifications.map((pref, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="mt-1.5 size-1.5 rounded-full bg-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{pref}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {/* Compensation & Benefits */}
                {((job.compensationAndBenefits?.salaryMin || job.compensationAndBenefits?.salaryMax) ||
                  (job.compensationAndBenefits?.benefitsSummary && job.compensationAndBenefits.benefitsSummary.length > 0)) && (
                    <section className="bg-card/45 border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
                      <h2 className="text-xl font-bold text-foreground mb-4">Compensation & Benefits</h2>

                      {((job.compensationAndBenefits?.salaryMin || job.compensationAndBenefits?.salaryMax)) && (
                        <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-start gap-3 w-fit">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <DollarSign className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-xs text-muted-foreground font-semibold">Salary Range</h4>
                            <p className="text-base font-extrabold text-foreground mt-0.5">
                              {job.compensationAndBenefits.salaryMin ? `${job.compensationAndBenefits.currency || "USD"} ${job.compensationAndBenefits.salaryMin.toLocaleString()}` : ""}
                              {job.compensationAndBenefits.salaryMin && job.compensationAndBenefits.salaryMax ? " - " : ""}
                              {job.compensationAndBenefits.salaryMax ? `${job.compensationAndBenefits.currency || "USD"} ${job.compensationAndBenefits.salaryMax.toLocaleString()}` : ""}
                            </p>
                            {job.compensationAndBenefits.compensationType && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {job.compensationAndBenefits.compensationType}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {job.compensationAndBenefits?.benefitsSummary && job.compensationAndBenefits.benefitsSummary.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Perks & Benefits</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {job.compensationAndBenefits.benefitsSummary.map((benefit, idx) => (
                              <li key={idx} className="flex items-center gap-2.5 border border-border/50 p-3 rounded-xl bg-muted/10">
                                <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                                <span className="text-muted-foreground text-xs font-medium">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}
              </div>

              {/* Right Column: Overview Card */}
              <div className="lg:col-span-1 space-y-8">
                <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-foreground mb-2">Job Overview</h3>
                  <div className="space-y-3">
                    {job.department && (
                      <div className="flex justify-between items-center text-xs py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-semibold text-foreground">{job.department}</span>
                      </div>
                    )}
                    {job.jobCategory && !job.department && (
                      <div className="flex justify-between items-center text-xs py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-semibold text-foreground">{job.jobCategory}</span>
                      </div>
                    )}
                    {job.employmentType && (
                      <div className="flex justify-between items-center text-xs py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Job Type</span>
                        <span className="font-semibold text-foreground">{job.employmentType}</span>
                      </div>
                    )}
                    {job.workplaceModel && (
                      <div className="flex justify-between items-center text-xs py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Workplace</span>
                        <span className="font-semibold text-foreground">{job.workplaceModel}</span>
                      </div>
                    )}
                    {job.experienceLevel && (
                      <div className="flex justify-between items-center text-xs py-2 border-b border-border/50">
                        <span className="text-muted-foreground">Experience</span>
                        <span className="font-semibold text-foreground">{job.experienceLevel}</span>
                      </div>
                    )}
                    {job.applicationLogistics?.applicationDeadline && (
                      <div className="flex justify-between items-center text-xs py-2">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-semibold text-foreground">
                          {new Date(job.applicationLogistics.applicationDeadline).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Rounds & Scheduling */}
          {activeTab === "rounds" && (
            <motion.div
              key="rounds-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Pane: Rounds List (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-foreground px-1 mb-2">Job Evaluation Pipeline</h3>

                <div className="flex flex-col gap-2 relative">
                  {pipelineStages.map((stage: string, idx: number) => {
                    const activeCount = evaluationsList.filter((e: any) => e.current_stage_index === idx).length;
                    const isSelected = selectedRoundIndex === idx;
                    const stageLower = stage.toLowerCase();
                    const isRoundAI = stageLower.includes("ai");
                    const isRoundHuman = stageLower.includes("hr interview") || stageLower.includes("human");
                    const isRoundCustom = !isRoundAI && !isRoundHuman;

                    return (
                      <div key={idx} className="relative z-10">
                        <button
                          onClick={() => {
                            setSelectedRoundIndex(idx);
                            setMockCandidates([]);
                            setSuggestions([]);
                            setSelectedCandidateIds([]);
                          }}
                          className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer group ${isSelected
                            ? "bg-primary/5 border-primary text-foreground shadow-sm"
                            : "bg-card/45 border-border/50 text-muted-foreground hover:bg-white/[0.02] hover:border-border"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected
                              ? "bg-primary/20 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground"
                              }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-foreground group-hover:text-primary transition-colors">{stage}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                {isRoundHuman ? (
                                  <span className="text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase tracking-wider">Human Round</span>
                                ) : isRoundAI ? (
                                  <span className="text-blue-500 font-bold bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded uppercase tracking-wider">AI Round</span>
                                ) : (
                                  <span className="text-orange-500 font-bold bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.2 rounded uppercase tracking-wider">Custom</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeCount > 0
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground border border-transparent"
                              }`}>
                              {activeCount} active
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>

                        {/* Pipeline Connector Line - placed between items */}
                        {idx < pipelineStages.length - 1 && (
                          <div className="absolute left-[29px] top-full h-2 w-[2px] bg-primary/30 z-[-1]" />
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Right Pane: Selected Round Configuration & Smart Scheduler (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">

                {/* Round Header Details */}
                <div className="bg-card/45 border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="w-full">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      {currentStageName} Round
                      {!isHumanInterviewRound && !isAIInterviewRound && (
                        <button
                          onClick={() => setShowStandardInfo(!showStandardInfo)}
                          className={`p-1 rounded-full transition-colors cursor-pointer ${showStandardInfo ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'}`}
                        >
                          <Info className="size-4" />
                        </button>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure parameters and schedule interview slots for {stageCandidates.length} candidate(s) in this stage.
                    </p>

                    {/* Collapsible Info for Standard Round */}
                    {!isHumanInterviewRound && !isAIInterviewRound && showStandardInfo && (
                      <div className="mt-4 bg-white/5 border border-dashed border-border rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <h4 className="text-sm font-bold text-foreground mb-1">Standard Screening / Evaluation Stage</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This stage does not require a live human interview config. Review candidate profiles, parse resumes, and update their pipeline stages to route them to the interview loops.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE CANDIDATES QUEUE */}
                <div className="bg-card/45 border border-border/50 rounded-2xl p-0 shadow-sm overflow-hidden">
                  {/* Collapsible Header */}
                  <div
                    onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-border/0 data-[expanded=true]:border-border/50"
                    data-expanded={isQueueExpanded}
                  >
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      Candidates Queue in {currentStageName}
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono text-[10px]">
                        {stageCandidates.length}
                      </span>
                    </h3>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span className="text-[10px] font-medium">{isQueueExpanded ? "Hide Details" : "View Details"}</span>
                      <ChevronDown className={`size-4 transition-transform duration-300 ${isQueueExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isQueueExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-2">
                          {stageCandidates.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-border/50 rounded-xl bg-white/5">
                              <p className="text-xs text-muted-foreground italic">No candidates currently awaiting this round.</p>
                            </div>
                          ) : (
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar rounded-xl border border-border/50 bg-white/5">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-black/20 sticky top-0 z-10 backdrop-blur-md">
                                  <tr>
                                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 w-12 text-center">
                                      <Checkbox 
                                        checked={stageCandidates.length > 0 && selectedCandidateIds.length === stageCandidates.length}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedCandidateIds(stageCandidates.map(c => Math.abs(c.candidate_id || c.id)));
                                          } else {
                                            setSelectedCandidateIds([]);
                                          }
                                        }}
                                      />
                                    </th>
                                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50">Candidate Name</th>
                                    <th className="py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stageCandidates.map((cand, idx) => {
                                    const alreadyScheduled = activeInterviews.find(iv => iv.candidate_id === (cand.candidate_id || cand.id));
                                    const cId = Math.abs(cand.candidate_id || cand.id);
                                    const cName = cand.candidate_name || cand.name || `Candidate ${cId}`;
                                    const isSelected = selectedCandidateIds.includes(cId);

                                    return (
                                      <tr
                                        key={cand.id || idx}
                                        className="border-b border-border/30 hover:bg-white/5 transition-colors last:border-0"
                                      >
                                        <td className="py-3 px-4 text-center">
                                          <Checkbox 
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedCandidateIds(prev => Array.from(new Set([...prev, cId])));
                                              } else {
                                                setSelectedCandidateIds(prev => prev.filter(id => id !== cId));
                                              }
                                            }}
                                          />
                                        </td>
                                        <td className="py-3 px-4 font-bold text-foreground">{cName}</td>
                                        <td className="py-3 px-4 text-right">
                                          {alreadyScheduled ? (
                                            alreadyScheduled.status === "AWAITING_BOOKING" ? (
                                              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold text-[9px] uppercase tracking-wider">
                                                Awaiting Booking
                                              </span>
                                            ) : (
                                              <span className="inline-flex px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-[9px] uppercase tracking-wider">
                                                Scheduled
                                              </span>
                                            )
                                          ) : (
                                            <span className="inline-flex px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[9px] uppercase tracking-wider">
                                              Pending Slot
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SMART SCHEDULER: Only active for Human Interview Rounds */}
                {isHumanInterviewRound ? (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-200">

                    {/* Settings Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Configuration Card 1: Scheduling Details */}
                      <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-amber-500" /> Scheduling Details
                        </h4>

                        <div className="space-y-3.5">
                          {/* Round Date */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date to be Held</label>
                            <DateTimePicker
                              value={roundDate}
                              onChange={(val) => setRoundDate(val)}
                              placeholder="Select date & time"
                            />
                          </div>

                          {/* Duration Minutes */}
                          <div className="space-y-1">
                            <Dropdown
                              label="Interview Duration"
                              value={String(durationMinutes)}
                              onChange={(val) => setDurationMinutes(Number(val))}
                              options={[
                                { label: "30 Minutes", value: "30" },
                                { label: "45 Minutes", value: "45" },
                                { label: "60 Minutes", value: "60" },
                                { label: "90 Minutes", value: "90" },
                              ]}
                              searchable={false}
                              className="w-full"
                            />
                          </div>

                          {/* Suggested Slots Count */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Number of Slots to Propose</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={suggestedSlotsCount}
                              onChange={(e) => setSuggestedSlotsCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
                            />
                            <p className="text-[9px] text-muted-foreground leading-relaxed mt-1">
                              Number of auto-generated slot options candidates can choose from.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Configuration Card 2: Interviewer Quorum */}
                      {!isCurrentRoundCustom && (
                        <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="size-3.5 text-amber-500" /> Quorum settings
                          </h4>

                          <div className="space-y-3.5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviewers count</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={minQuorum}
                                onChange={(e) => setMinQuorum(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                              Specifies how many panel members will be allocated to evaluate each candidate slot.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Configuration Card 3: Panel Selection Pool */}
                    {!isCurrentRoundCustom && (
                      <div className="bg-card/45 border border-border/60 rounded-2xl p-5 shadow-premium flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="size-3.5 text-amber-500" /> Panel Pool Assignment
                        </h4>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-[350px] shrink-0">
                            <Dropdown
                              placeholder="Add panel member"
                              options={panelPool.map((emp: any) => ({
                                label: `${emp.first_name} ${emp.last_name} (${emp.tenant_role || emp.role})`,
                                value: emp.id,
                              }))}
                              value=""
                              onChange={(memberId) => {
                                if (memberId && !assignedPanelMembers.includes(memberId)) {
                                  setAssignedPanelMembers(prev => [...prev, memberId]);
                                }
                              }}
                              className="w-full"
                            />
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                              Search and add the employees who will be part of the interview loops for this job round.
                            </p>
                          </div>

                          <div className="flex-1 w-full min-h-[40px] p-4 bg-white/[0.02] border border-border/50 rounded-xl">
                            {assignedPanelMembers.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic flex items-center h-full justify-center opacity-70">No panel members assigned yet.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2.5">
                                {assignedPanelMembers.map((empId) => {
                                  const emp = panelPool.find((e: any) => e.id === empId);
                                  if (!emp) return null;
                                  return (
                                    <div
                                      key={empId}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-foreground text-xs font-bold shadow-sm"
                                    >
                                      <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px]">
                                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                                      </div>
                                      <span>{emp.first_name} {emp.last_name}</span>
                                      <button
                                        type="button"
                                        onClick={() => setAssignedPanelMembers(prev => prev.filter(id => id !== empId))}
                                        className="hover:text-destructive text-sm font-extrabold cursor-pointer ml-1 text-muted-foreground transition-colors"
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Get Suggestions Action */}
                    <div className="flex justify-end mt-4 mb-6">
                      <Button
                        onClick={handleGetSuggestions}
                        disabled={recommendMutation.isPending || !roundDate || stageCandidates.length === 0 || (!isCurrentRoundCustom && assignedPanelMembers.length === 0)}
                        className="font-bold px-6 text-xs h-10 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all rounded-xl cursor-pointer"
                      >
                        {recommendMutation.isPending ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Finding slots...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3.5" />
                            Get Suggestions
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Suggestions Table / Scheduling suggestions output */}
                    {suggestions.length > 0 ? (
                      <div className="bg-card/45 border border-border/60 rounded-2xl p-6 shadow-premium flex flex-col gap-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center pb-3 border-b border-border/40">
                          <div>
                            <h3 className="text-sm font-black text-foreground">Suggested Time Slots & Panels</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              System suggested slots of {durationMinutes} minutes with 15m breaks. Customize the start times or panel allocations if required.
                            </p>
                          </div>
                          <Button
                            onClick={handleConfirmSchedule}
                            disabled={isSchedulingInProgress}
                            className="font-bold px-6 text-xs h-9 cursor-pointer"
                          >
                            {isSchedulingInProgress ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin mr-2" />
                                Scheduling...
                              </>
                            ) : (
                              "Confirm & Dispatch Schedule"
                            )}
                          </Button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                <th className="pb-3 pl-4">Candidate</th>
                                <th className="pb-3">Round</th>
                                <th className="pb-3">Suggested Time Slot (Override)</th>
                                <th className="pb-3">Assigned Panel (Override)</th>
                                <th className="pb-3 pr-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {suggestions.map((item, idx) => {
                                return (
                                  <tr key={idx} className="hover:bg-white/[0.01]">
                                    <td className="py-4 pl-4 font-bold text-xs text-foreground">
                                      {item.candidateName}
                                    </td>
                                    <td className="py-4 text-[10px] text-muted-foreground">
                                      <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                                        {currentStageName}
                                      </span>
                                    </td>
                                    <td className="py-4 text-xs">
                                      <div className="flex flex-col gap-2.5">
                                        {item.slots?.map((slot: any, sIdx: number) => (
                                          <div key={sIdx} className="flex items-center gap-2 group/slot">
                                            <div className="w-[220px] shrink-0">
                                              <DateTimePicker
                                                value={slot.startTime}
                                                onChange={(val) => updateSlotDateTime(idx, sIdx, val)}
                                              />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono min-w-[70px]">
                                              to {format(new Date(slot.endTime), "h:mm a")}
                                            </span>
                                            {item.slots.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => removeSlotOption(idx, sIdx)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover/slot:opacity-100 transition-opacity cursor-pointer"
                                              >
                                                <X className="size-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => addSlotOption(idx)}
                                          className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 mt-1 w-fit cursor-pointer"
                                        >
                                          <Plus className="size-3" /> Add Slot Option
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-4 text-xs">
                                      <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-sm">
                                        {assignedPanelMembers.map(empId => {
                                          const emp = panelPool.find((e: any) => e.id === empId);
                                          const isChecked = item.panelMembers.includes(empId);
                                          return (
                                            <label
                                              key={empId}
                                              className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-muted-foreground hover:text-foreground"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => togglePanelMemberForCandidate(idx, empId)}
                                                className="rounded border-border bg-background accent-primary size-3.5"
                                              />
                                              <span>{emp ? `${emp.first_name} ${emp.last_name?.charAt(0)}.` : "Panel"}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="py-4 pr-4 text-right">
                                      <Button
                                        variant="ghost"
                                        onClick={() => {
                                          setSuggestions(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-white/5 border border-dashed border-border rounded-2xl p-10 text-center">
                        <Calendar className="size-10 text-muted-foreground/60 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-foreground">Awaiting Suggestions Parameters</h4>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                          Select a date, select duration, check panel members from the list, and make sure candidates are available in the queue to get smart scheduling suggestions.
                        </p>
                      </div>
                    )}

                  </div>
                ) : isAIInterviewRound ? (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                    <div className="bg-card/45 border border-border/60 rounded-2xl p-6 shadow-premium flex flex-col gap-5">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-sky-400" /> AI Interview Deadline
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                        Set a deadline before which candidates must complete their AI-powered interview. The AI bot will be available to candidates until this date.
                      </p>

                      <div className="space-y-1 max-w-sm mt-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion Deadline</label>
                        <input
                          type="datetime-local"
                          value={aiDeadline}
                          onChange={(e) => setAiDeadline(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-sky-400/50 text-foreground"
                        />
                      </div>

                      {aiDeadline && (
                        <div className="bg-sky-400/5 border border-sky-400/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200 mt-2">
                          <Info className="size-4 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-foreground">Deadline set</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              All {stageCandidates.length} candidate(s) in this round must complete their AI interview before{" "}
                              <span className="font-bold text-sky-400">{new Date(aiDeadline).toLocaleString()}</span>.
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        disabled={!aiDeadline || updatePipelineMutation.isPending}
                        onClick={() => {
                          if (!job?.pipeline_stages) return;
                          // Build updated stages array with the deadline embedded in the selected stage
                          const updatedStages = job.pipeline_stages.map((stage: any, idx: number) => {
                            if (idx === selectedRoundIndex) {
                              const stageObj = typeof stage === "string" ? { name: stage } : { ...stage };
                              stageObj.ai_deadline = new Date(aiDeadline).toISOString();
                              return stageObj;
                            }
                            return stage;
                          });
                          updatePipelineMutation.mutate(
                            { jobId: jobId, data: { pipeline_stages: updatedStages } },
                            {
                              onSuccess: () => {
                                toast.success("AI interview deadline saved successfully.");
                                refetchJob();
                              },
                              onError: () => {
                                toast.error("Failed to save AI interview deadline.");
                              }
                            }
                          );
                        }}
                        className="w-fit font-bold px-6 text-xs h-9 cursor-pointer mt-2"
                      >
                        {updatePipelineMutation.isPending ? "Saving..." : "Save Deadline"}
                      </Button>
                    </div>
                  </div>
                ) : null}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
