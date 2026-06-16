"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  RotateCcw,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Hexagon,
  AlertCircle,
  Briefcase,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useGetCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { useListJobsPublicApiV1JobsPublicListGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";
import { CandidateTopbar } from "@/app/[tenant]/components/candidate-topbar";
import { CandidateSidebar } from "@/app/[tenant]/components/candidate-sidebar";

// --- API Types ---
interface Job {
  id: number;
  title: string;
  description: string;
  requirements_json: Record<string, string | number | boolean> | null;
  start_time: string | null;
  end_time: string | null;
  pipeline_stages: string[] | null;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
}

// --- UI Mapped Type ---
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

export default function TenantPublicJobBoard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenant = params.tenant as string;

  const { isAuthenticated, user, logout } = useAuthStore();
  const isCandidate = user?.realm_access?.roles?.includes("candidate");



  // --- API Calls ---
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    { query: { enabled: !!tenant } } as any
  );
  const tenantDetails = tenantQuery.data as any;

  // Fetch candidate profile to check if it's missing
  const profileQuery = useGetCandidateMeApiV1CandidatesMeGet({
    request: {
      headers: { "X-Tenant-Id": tenantDetails?.id || "" }
    },
    query: {
      enabled: !!tenantDetails?.id && !!user && isCandidate,
      retry: false,
    }
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

  const jobsQuery = useListJobsPublicApiV1JobsPublicListGet({
    request: { headers: { "X-Tenant-Id": tenantDetails?.id || "" } },
    query: { enabled: !!tenantDetails?.id } as any
  });

  const rawJobs = (jobsQuery.data as Job[]) || [];
  const loading = tenantQuery.isLoading || jobsQuery.isLoading;
  const isError = tenantQuery.isError || jobsQuery.isError;

  // --- Smart Data Mapper ---
  const mappedJobs: MappedJob[] = useMemo(() => {
    return rawJobs.map((job) => {
      const titleLower = (job.title || "").toLowerCase();
      const descLower = (job.description || "").toLowerCase();

      // 1. Heuristic Category assignment
      let category = "General";
      if (/(engineer|developer|tech|programmer|architect)/.test(titleLower)) category = "Engineering";
      else if (/(product|design|ux|ui)/.test(titleLower)) category = "Product";
      else if (/(sales|market|account|executive)/.test(titleLower)) category = "Sales";
      else if (/(data|analytic|scientist|researcher)/.test(titleLower)) category = "Data";
      else if (/(ops|operations|success|support|manager)/.test(titleLower)) category = "Operations";

      // 2. Heuristic Experience level
      let experience = "Mid Level (3-5 years)";
      if (/(senior|lead|principal|director|head|manager)/.test(titleLower)) experience = "Senior (5+ years)";
      else if (/(junior|entry|intern|associate)/.test(titleLower)) experience = "Entry Level (0-2 years)";

      // 3. Heuristic Geography
      let location = "Remote";
      let country = "Anywhere";
      let continent = "Global";

      if (descLower.includes("new york") || titleLower.includes("new york") || titleLower.includes(" ny ")) {
        location = "New York"; country = "USA"; continent = "North America";
      } else if (descLower.includes("san francisco") || titleLower.includes("sf")) {
        location = "San Francisco"; country = "USA"; continent = "North America";
      } else if (descLower.includes("london")) {
        location = "London"; country = "UK"; continent = "Europe";
      } else if (descLower.includes("hybrid") || titleLower.includes("hybrid")) {
        location = "Hybrid";
      } else if (descLower.includes("on-site") || descLower.includes("onsite")) {
        location = "On-site";
      }

      // 4. Job Type
      let type = "Full time";
      if (descLower.includes("contract") || titleLower.includes("contract")) type = "Contract";
      else if (descLower.includes("part-time") || titleLower.includes("part time")) type = "Part time";

      // 5. Requirements Parser
      let skillRequired = "See job description for specific requirements.";
      if (job.requirements_json && typeof job.requirements_json === 'object' && !Array.isArray(job.requirements_json)) {
        const reqKeys = Object.keys(job.requirements_json);
        if (reqKeys.length > 0) {
          skillRequired = reqKeys.join(", ");
        }
      }

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
        qualifications: "Relevant degree or equivalent practical experience required.",
        about: job.description || "No description provided.",
        postedAt: job.created_at || new Date().toISOString()
      };
    });
  }, [rawJobs]);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContinent, setSelectedContinent] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  // Navigation State

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectJob = (job: MappedJob | null) => {
    if (job) {
      router.push(`/${tenant}/job/${job.id}`);
    }
  };

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, opt: string) => {
    setState((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };


  // --- Dynamic Option Availability (Geographic Dependencies) ---
  const availableContinents = useMemo(() => {
    return new Set(mappedJobs.filter(j =>
      (selectedCountry.length === 0 || selectedCountry.includes(j.country)) &&
      (selectedLocation.length === 0 || selectedLocation.includes(j.location))
    ).map(j => j.continent));
  }, [mappedJobs, selectedCountry, selectedLocation]);

  const availableCountries = useMemo(() => {
    return new Set(mappedJobs.filter(j =>
      (selectedContinent.length === 0 || selectedContinent.includes(j.continent)) &&
      (selectedLocation.length === 0 || selectedLocation.includes(j.location))
    ).map(j => j.country));
  }, [mappedJobs, selectedContinent, selectedLocation]);

  const availableLocations = useMemo(() => {
    return new Set(mappedJobs.filter(j =>
      (selectedContinent.length === 0 || selectedContinent.includes(j.continent)) &&
      (selectedCountry.length === 0 || selectedCountry.includes(j.country))
    ).map(j => j.location));
  }, [mappedJobs, selectedContinent, selectedCountry]);


  // --- Filtering Logic for Main Display ---
  const filteredJobs = useMemo(() => {
    return mappedJobs.filter((job) => {

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(searchLower) ||
        job.skillRequired.toLowerCase().includes(searchLower) ||
        job.about.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (selectedContinent.length > 0 && !selectedContinent.includes(job.continent)) return false;
      if (selectedCountry.length > 0 && !selectedCountry.includes(job.country)) return false;
      if (selectedLocation.length > 0 && !selectedLocation.includes(job.location)) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(job.category)) return false;
      if (selectedExperience.length > 0 && !selectedExperience.includes(job.experience)) return false;
      if (selectedType.length > 0 && !selectedType.includes(job.type)) return false;

      return true;
    });
  }, [mappedJobs, searchQuery, selectedContinent, selectedCountry, selectedLocation, selectedCategory, selectedExperience, selectedType]);




  // --- Filter Configuration Configurations ---
  const continents = Array.from(new Set(mappedJobs.map(j => j.continent)));
  const countries = Array.from(new Set(mappedJobs.map(j => j.country)));
  const locations = Array.from(new Set(mappedJobs.map(j => j.location)));
  const categories = Array.from(new Set(mappedJobs.map(j => j.category)));
  const jobTypes = Array.from(new Set(mappedJobs.map(j => j.type)));
  const experiences = [
    "Entry Level (0-2 years)",
    "Mid Level (3-5 years)",
    "Senior (5+ years)"
  ];

  const activeFilterCount =
    selectedContinent.length +
    selectedCountry.length +
    selectedLocation.length +
    selectedCategory.length +
    selectedExperience.length +
    selectedType.length +
    (searchQuery ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedContinent([]);
    setSelectedCountry([]);
    setSelectedLocation([]);
    setSelectedCategory([]);
    setSelectedExperience([]);
    setSelectedType([]);
  };

  const filterBlocks = [
    { title: "Continent", state: selectedContinent, setter: setSelectedContinent, options: continents, validSet: availableContinents },
    { title: "Country", state: selectedCountry, setter: setSelectedCountry, options: countries, validSet: availableCountries },
    { title: "Location", state: selectedLocation, setter: setSelectedLocation, options: locations, validSet: availableLocations },
    { title: "Department", state: selectedCategory, setter: setSelectedCategory, options: categories },
    { title: "Job Type", state: selectedType, setter: setSelectedType, options: jobTypes },
    { title: "Experience", state: selectedExperience, setter: setSelectedExperience, options: experiences },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col relative overflow-hidden">

      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(var(--primary),0.1),transparent_50%)] pointer-events-none" />

      {/* Unified Candidate Topbar */}
      <CandidateTopbar
        tenant={tenant}
        tenantName={tenantDetails?.name || "Company Portal"}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={() => { logout(); toast.info("Logged out successfully"); }}
        onBrandClick={() => { handleSelectJob(null); }}
        onSignIn={() => router.push(`/${tenant}/candidate/login`)}
        onSignUp={() => router.push(`/${tenant}/candidate/register`)}
        onMyApplications={() => router.push(`/${tenant}/candidate/dashboard`)}
        onProfile={() => router.push(`/${tenant}/candidate/profile`)}
      />

      {/* ── Static Hover-Expandable Sidebar ── */}
      <CandidateSidebar tenant={tenant} isProfileMissing={!!isProfileMissing} />

      {/* Global Missing Profile Banner (Fixed under Topbar) */}
      {isProfileMissing && (
        <div className="fixed top-16 left-0 w-full z-[55] bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-md">
          <AlertTriangle className="size-4" />
          <span>
            You haven't completed your profile.{" "}
            <Link href={`/${tenant}/candidate/profile?edit=true`} className="underline font-bold hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors">
              Complete here.
            </Link>
          </span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className={`w-full max-w-[1600px] mx-auto px-6 lg:px-12 ${isProfileMissing ? 'pt-[152px]' : 'pt-28'} pb-20 flex-1 relative z-10 transition-all duration-300 ${isAuthenticated && isCandidate ? 'pl-24 lg:pl-28' : ''}`}>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <AlertCircle className="size-16 text-destructive mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-3">Failed to load opportunities</h2>
            <p className="text-muted-foreground mb-8 max-w-md">There was an error communicating with the server. Please try refreshing the page or check your connection.</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-border text-foreground hover:bg-muted rounded-full px-8">
              Refresh Page
            </Button>
          </div>
        ) : (
          /* VIEW 2: JOB LIST & FILTERS VIEW */
          <div className="flex flex-col md:flex-row gap-10">

            {/* LEFT COLUMN: Scrollable Sidebar */}
            <aside className="w-full md:w-[280px] shrink-0 md:sticky md:top-28 self-start max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pr-4 pb-10">
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-background pt-2 pb-4 z-10">
                <h2 className="text-xl font-bold text-foreground text-tight">Refine Search</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold flex items-center gap-1.5 text-primary hover:opacity-80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    Reset <RotateCcw className="size-3" />
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {/* Search */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Keywords</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 bg-input/50 border-border text-sm rounded-xl text-foreground h-12 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Filter Blocks */}
                {filterBlocks.map((filter) => (
                  <div key={filter.title}>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 block">{filter.title}</label>
                    <div className="space-y-2.5">
                      <label
                        className="flex items-center group cursor-pointer"
                        onClick={() => filter.setter([])}
                      >
                        <div className={`size-5 rounded-md border flex items-center justify-center transition-all duration-200 ${filter.state.length === 0
                          ? "bg-primary border-primary shadow-sm"
                          : "bg-card border-border group-hover:border-primary/50"
                          }`}>
                          {filter.state.length === 0 && <Check className="size-3.5 text-primary-foreground" />}
                        </div>
                        <span className={`ml-3 text-sm transition-colors ${filter.state.length === 0 ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                          All
                        </span>
                      </label>

                      {filter.options.map((opt) => {
                        const isActive = filter.state.includes(opt);
                        const isDisabled = filter.validSet ? !filter.validSet.has(opt) : false;

                        return (
                          <label
                            key={opt}
                            className={`flex items-center group ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                                return;
                              }
                              toggleFilter(filter.setter, opt);
                            }}
                          >
                            <div className={`size-5 rounded-md border flex items-center justify-center transition-all duration-200 ${isActive
                              ? "bg-primary border-primary shadow-sm"
                              : isDisabled
                                ? "bg-card border-border"
                                : "bg-card border-border group-hover:border-primary/50"
                              }`}>
                              {isActive && <Check className="size-3.5 text-primary-foreground" />}
                            </div>
                            <span className={`ml-3 text-sm transition-colors ${isActive
                              ? "text-foreground font-medium"
                              : isDisabled
                                ? "text-muted-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                              }`}>
                              {opt}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT COLUMN: Premium Job Feed */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-foreground mb-2 text-tighter">Open Opportunities</h1>
                  <p className="text-muted-foreground text-sm">Showing {filteredJobs.length} roles powered by intelligent processing.</p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-5 text-center rounded-3xl border border-dashed border-border bg-card/30">
                  <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm font-semibold">Loading open positions...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="py-32 text-center rounded-3xl border border-dashed border-border bg-card/30">
                  <Briefcase className="size-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-2xl font-bold text-foreground mb-3 text-tight">No positions found</p>
                  <p className="text-muted-foreground text-sm">Try tweaking your keywords or filters to discover active opportunities.</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-6 border-border text-foreground hover:bg-muted rounded-full px-6">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectJob(job)}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl glass-card hover:bg-card/80 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-xs font-semibold text-foreground">
                            {job.category}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" /> {new Date(job.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors text-tight flex items-center gap-3">
                          {job.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {job.location}, {job.country}</span>
                          <span className="size-1 rounded-full bg-border" />
                          <span>{job.type}</span>
                          <span className="size-1 rounded-full bg-border" />
                          <span>{job.experience}</span>
                        </div>
                      </div>

                      <div className="mt-6 md:mt-0 shrink-0 flex justify-end">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-5 py-2.5 rounded-full opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          View Details <ChevronRight className="size-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
