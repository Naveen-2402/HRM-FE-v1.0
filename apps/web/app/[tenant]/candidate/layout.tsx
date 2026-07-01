"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useGetCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/candidate/candidates/candidates";
import { CandidateTopbar } from "@/app/[tenant]/components/candidate-topbar";
import { CandidateSidebar } from "@/app/[tenant]/components/candidate-sidebar";
import { CreateProfileModal } from "@/app/[tenant]/candidate/components/CreateProfileModal";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { MissingProfileBanner } from "@/app/[tenant]/candidate/components/MissingProfileBanner";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  const { isAuthenticated, user, logout, isProfileModalOpen, setProfileModalOpen } = useAuthStore();
  const isCandidate = user?.realm_access?.roles?.includes("candidate");

  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    { query: { enabled: !!tenant } } as any
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

  // Paths that should NOT have the CandidateTopbar
  const isAuthRoute = pathname.includes("/login") || pathname.includes("/register") || pathname.includes("/callback");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (tenantQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-semibold text-sm">Loading portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <CandidateTopbar
        tenant={tenant}
        tenantName={tenantDetails?.name || "Company Portal"}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={() => { logout(); toast.info("Logged out successfully"); }}
        onBrandClick={() => router.push(`/${tenant}`)}
        onSignIn={() => router.push(`/${tenant}/candidate/login`)}
        onSignUp={() => router.push(`/${tenant}/candidate/register`)}
        onMyApplications={() => router.push(`/${tenant}/candidate/dashboard`)}
        onProfile={() => router.push(`/${tenant}/candidate/profile`)}
      />
      
      {!isProfileModalOpen && (
        <MissingProfileBanner />
      )}

      {/* ── Candidate Sidebar ── */}
      <CandidateSidebar tenant={tenant} isProfileMissing={!!isProfileMissing} />
      
      {/* Universal Profile Modal */}
      <CreateProfileModal 
        isOpen={!!isProfileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        tenantDetails={tenantDetails} 
        existingProfile={existingProfile}
        refetchProfile={() => profileQuery.refetch()}
      />

      <div className={`flex-1 w-full flex flex-col ${isProfileMissing && !isProfileModalOpen ? 'pt-[104px]' : 'pt-16'} transition-all duration-300 ${isAuthenticated && isCandidate ? 'pl-16' : ''} ${isProfileModalOpen ? 'blur-sm grayscale-[0.2] pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  );
}
