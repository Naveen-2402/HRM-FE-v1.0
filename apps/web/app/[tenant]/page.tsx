"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  User, 
  LogOut,
  SlidersHorizontal,
  Building
} from "lucide-react";
import { useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { useListJobsPublicApiV1JobsPublicListGet } from "@repo/orval-config/src/api/job/jobs/jobs";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-toastify";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements_json: any;
  start_time: string | null;
  end_time: string | null;
  pipeline_stages: string[] | null;
  created_at: string;
}

export default function TenantPublicJobBoard() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  const { isAuthenticated, user, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Orval Query: Get Tenant by Subdomain
  const tenantQuery = useGetTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(
    tenant,
    {
      query: {
        enabled: !!tenant,
      }
    } as any
  );

  const tenantDetails = tenantQuery.data as any;

  // Orval Query: List Public Jobs scoped by resolved Tenant ID header
  const jobsQuery = useListJobsPublicApiV1JobsPublicListGet({
    request: {
      headers: {
        "X-Tenant-Id": tenantDetails?.id || "",
      }
    },
    query: {
      enabled: !!tenantDetails?.id,
    }
  } as any);

  const jobs = (jobsQuery.data as Job[]) || [];
  const loading = tenantQuery.isLoading || jobsQuery.isLoading;

  // Filter jobs based on search query and category
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple category mapping
    if (selectedCategory === "All") return matchesSearch;
    if (selectedCategory === "Engineering") return matchesSearch && (job.title.toLowerCase().includes("engineer") || job.title.toLowerCase().includes("developer") || job.title.toLowerCase().includes("tech"));
    if (selectedCategory === "Product") return matchesSearch && (job.title.toLowerCase().includes("product") || job.title.toLowerCase().includes("designer"));
    if (selectedCategory === "Sales") return matchesSearch && (job.title.toLowerCase().includes("sales") || job.title.toLowerCase().includes("market") || job.title.toLowerCase().includes("account"));
    return matchesSearch;
  });

  const categories = ["All", "Engineering", "Product", "Sales"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building className="size-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              {tenantDetails ? tenantDetails.name : "Company Portal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user?.realm_access?.roles?.includes("candidate") ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push(`/${tenant}/candidate/dashboard`)}
                  className="text-xs hover:bg-slate-900 rounded-lg text-slate-300"
                >
                  <User className="size-4 mr-2 text-indigo-400" />
                  My Applications
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => { logout(); toast.info("Logged out successfully"); }}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                >
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push(`/${tenant}/candidate/login`)}
                  className="text-xs hover:bg-slate-900 rounded-lg text-slate-300"
                >
                  Candidate Sign In
                </Button>
                <Button 
                  onClick={() => router.push(`/${tenant}/candidate/register`)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center max-w-4xl mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 px-3.5 py-1 text-xs font-semibold bg-indigo-950/40 text-indigo-400 backdrop-blur-sm shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]">
            <Sparkles className="size-3.5" /> Open Positions
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Build the future of technology with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              {tenantDetails ? tenantDetails.name : "us"}
            </span>
          </h1>

          <p className="text-base text-slate-400 max-w-2xl mx-auto font-medium">
            Explore our open vacancies and find the perfect match for your career trajectory. 
            All of our applications are assessed powered by modern AI matching.
          </p>
        </motion.div>
      </section>

      {/* Filter and Search Section */}
      <section className="max-w-7xl mx-auto px-4 w-full mb-12">
        <div className="p-6 rounded-[2rem] border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-4.5" />
              <Input
                type="text"
                placeholder="Search jobs by title, keyword, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-slate-950 border-slate-800 rounded-xl focus:border-indigo-500 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <SlidersHorizontal className="size-4 text-slate-400 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-2 rounded-lg font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Grid */}
      <main className="max-w-7xl mx-auto px-4 w-full flex-1 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Loading open positions...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Briefcase className="size-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No positions found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              We don't have any open listings matching your criteria at the moment. Please check back later!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group p-6 rounded-3xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                      Full-time
                    </span>
                    <span className="flex items-center text-[10px] text-slate-500 font-semibold">
                      <Clock className="size-3 mr-1" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-medium">
                      {job.description}
                    </p>
                  </div>

                  {/* Requirements Preview */}
                  {job.requirements_json && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {Object.keys(job.requirements_json).slice(0, 3).map((reqKey) => (
                        <span 
                          key={reqKey}
                          className="inline-flex text-[10px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded-md border border-slate-800"
                        >
                          {reqKey}
                        </span>
                      ))}
                      {Object.keys(job.requirements_json).length > 3 && (
                        <span className="inline-flex text-[10px] text-slate-500 px-1 py-0.5">
                          +{Object.keys(job.requirements_json).length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center text-xs text-slate-400 font-semibold">
                    <MapPin className="size-3.5 mr-1 text-slate-500" />
                    Remote / Hybrid
                  </span>

                  <Button
                    onClick={() => router.push(`/${tenant}/job/${job.id}`)}
                    variant="ghost"
                    className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center p-0 hover:bg-transparent"
                  >
                    View Details
                    <ChevronRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {tenantDetails ? tenantDetails.name : "Company"}. Powered by AgentsFactory HRM Platform.</p>
        </div>
      </footer>
    </div>
  );
}
