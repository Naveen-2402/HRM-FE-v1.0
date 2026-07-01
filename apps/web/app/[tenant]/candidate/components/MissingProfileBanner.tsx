"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useGetCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function MissingProfileBanner() {
  const params = useParams();
  const tenant = params.tenant as string;
  const { isAuthenticated, user, setProfileModalOpen } = useAuthStore();
  const isCandidate = user?.realm_access?.roles?.includes("candidate");

  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    { query: { enabled: !!tenant && isAuthenticated } } as any
  );
  const tenantDetails = tenantQuery.data as any;

  const profileQuery = useGetCandidateMeApiV1CandidatesMeGet({
    request: { headers: { "X-Tenant-Id": tenantDetails?.id || "" } },
    query: { enabled: !!tenantDetails?.id && !!isAuthenticated && !!isCandidate, retry: false }
  } as any);

  const existingProfile = profileQuery.data as any;
  const isProfileIncomplete = profileQuery.isSuccess && (!existingProfile ||
    !existingProfile.name ||
    !existingProfile.key_role ||
    existingProfile.experience_years === undefined ||
    existingProfile.experience_years === null ||
    !existingProfile.resume_blob_url);

  const isProfileMissing = isAuthenticated && isCandidate && (
    (profileQuery.isError && (profileQuery.error as any)?.response?.status === 404) ||
    isProfileIncomplete
  );

  if (!isProfileMissing) return null;

  return (
    <div className="fixed top-16 left-0 w-full z-[55] bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-md">
      <AlertTriangle className="size-4" />
      <span>
        You haven't completed your profile.{" "}
        <button onClick={() => setProfileModalOpen(true)} className="underline font-bold hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors cursor-pointer">
          Complete here.
        </button>
      </span>
    </div>
  );
}
