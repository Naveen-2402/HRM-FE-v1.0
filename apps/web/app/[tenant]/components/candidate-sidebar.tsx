"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Briefcase } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useListInterviewsApiV1InterviewsGet } from "@repo/orval-config/src/api/interview/interviews/interviews";

interface CandidateSidebarProps {
  tenant: string;
  isProfileMissing?: boolean;
}

export function CandidateSidebar({ tenant, isProfileMissing = false }: CandidateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated, user } = useAuthStore();
  const isCandidate = user?.realm_access?.roles?.includes("candidate");

  if (!isAuthenticated || !isCandidate) {
    return null;
  }

  // Orval Query: Tenant details by subdomain to get tenantId
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    {
      query: {
        enabled: !!tenant && isAuthenticated && !!isCandidate,
      }
    } as any
  );

  const tenantDetails = tenantQuery.data as any;

  // Orval Query: Candidate interviews list to check for pending actions
  const { data: interviewsResponse } = useListInterviewsApiV1InterviewsGet(
    {},
    {
      query: {
        enabled: !!tenantDetails?.id && isAuthenticated && !!isCandidate,
      },
      request: {
        headers: {
          "X-Tenant-Id": tenantDetails?.id || "",
        },
      },
    } as any
  );

  const hasPendingAction = Array.isArray(interviewsResponse) 
    ? interviewsResponse.some(iv => 
        ((iv.status === "AWAITING_BOOKING" || iv.status === "RESCHEDULE_APPROVED" || iv.status === "INTERVIEWER_NO_SHOW") && iv.magic_link_token) ||
        (iv.status === "BOOKED" && !iv.candidate_confirmed)
      )
    : false;

  const sidebarItems = [
    {
      icon: Search,
      label: "Search Jobs",
      href: `/${tenant}`,
      isActive: pathname === `/${tenant}`,
    },
    {
      icon: Briefcase,
      label: "My Applications",
      href: `/${tenant}/candidate/dashboard`,
      isActive: pathname.includes('/candidate/dashboard'),
      hasDot: hasPendingAction,
    }
  ];

  return (
    <aside className={`fixed ${isProfileMissing ? 'top-[104px] h-[calc(100vh-104px)]' : 'top-16 h-[calc(100vh-64px)]'} left-0 z-[50] bg-card border-r border-border flex flex-col py-4 transition-all duration-300 ease-in-out w-16 hover:w-60 group shadow-xl overflow-hidden`}>
      <nav className="flex-1 w-full flex flex-col gap-2 px-2">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all relative whitespace-nowrap overflow-hidden cursor-pointer ${item.isActive
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              title={item.label}
            >
              <div className="relative">
                <Icon className="size-5 shrink-0" />
                {item.hasDot && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
              </div>
              <span className="font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
