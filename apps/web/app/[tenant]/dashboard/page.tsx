"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Briefcase, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { StatsCard } from "./components/StatsCard";
import { AnalyticsChart } from "./components/AnalyticsChart";
import { customInstance } from "@repo/orval-config/src/axios-setup";
import { useGetCreditBalanceApiV1BillingCreditsGet } from "@repo/orval-config/src/api/billing/billing/billing";
import { Button } from "@repo/ui/components/ui/button";

export default function DashboardPage() {
  // 1. Fetch Candidate Analytics
  const { data: candidateAnalytics, isLoading: isCandLoading } = useQuery({
    queryKey: ["candidate-analytics"],
    queryFn: () => customInstance<any>({ url: "/api/v1/candidates/analytics", method: "GET" }),
  });

  // 2. Fetch Job Stats
  const { data: jobStats, isLoading: isJobLoading } = useQuery({
    queryKey: ["job-stats"],
    queryFn: () => customInstance<any>({ url: "/api/v1/jobs/stats", method: "GET" }),
  });

  // 3. Fetch Credits (Real data)
  const { data: creditsData } = useGetCreditBalanceApiV1BillingCreditsGet();
  const credits = creditsData 
    ? (creditsData as any).credit_balance - (creditsData as any).consumed_credits - (creditsData as any).reserved_credits
    : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Mocked top skills if data is empty
  const topSkills = candidateAnalytics?.top_skills?.length > 0 
    ? candidateAnalytics.top_skills 
    : [
        { skill: "React", count: 0 },
        { skill: "Python", count: 0 },
        { skill: "Node.js", count: 0 },
        { skill: "TypeScript", count: 0 },
        { skill: "Docker", count: 0 }
      ];

  // Formatting status data for Bar Chart
  const statusData = candidateAnalytics?.status_summary 
    ? Object.entries(candidateAnalytics.status_summary).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value
      }))
    : [
        { name: "Completed", value: 0 },
        { name: "Pending", value: 0 },
        { name: "Failed", value: 0 }
      ];

  // Formatting evaluation status for Pie Chart
  const evaluationData = jobStats?.evaluation_status_summary
    ? Object.entries(jobStats.evaluation_status_summary).map(([key, value]) => ({
        name: key,
        value
      }))
    : [
        { name: "Shortlisted", value: 0 },
        { name: "Interviewing", value: 0 },
        { name: "Rejected", value: 0 },
        { name: "Pending", value: 0 }
      ];

  return (
    <div className="min-h-screen space-y-8 selection:bg-primary/30">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-muted-foreground/80 mt-1">
            Welcome back! Here's what's happening with your recruitment pipeline today.
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatsCard 
          title="Total Talent Pool"
          value={candidateAnalytics?.total_candidates || 0}
          icon={Users}
          trend={{ value: 12, isUp: true }}
          description="Candidates in your database"
          color="indigo"
          delay={0.1}
        />
        <StatsCard 
          title="Active Jobs"
          value={jobStats?.total_jobs || 0}
          icon={Briefcase}
          trend={{ value: 5, isUp: true }}
          description="Currently open positions"
          color="violet"
          delay={0.2}
        />
        <StatsCard 
          title="AI Power (Tokens)"
          value={credits.toLocaleString()}
          icon={Cpu}
          description="Available for AI extraction"
          color="pink"
          delay={0.3}
        />
        <StatsCard 
          title="Parsing Success"
          value="98.2%"
          icon={CheckCircle2}
          trend={{ value: 0.5, isUp: true }}
          description="Successful resume extractions"
          color="emerald"
          delay={0.4}
        />
      </motion.div>

      {/* ── Charts Section ── */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Growth Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-full rounded-[2.5rem] border border-border/50 bg-card/30 p-8 backdrop-blur-xl lg:col-span-4"
        >
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="size-5 text-primary" />
                Talent Acquisition Trend
              </h4>
              <p className="text-xs text-muted-foreground/60 font-medium">Candidate growth over the last 30 days</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Monthly
              </span>
            </div>
          </div>
          
          <AnalyticsChart 
            type="area" 
            data={candidateAnalytics?.daily_trends || []} 
            dataKey="count" 
            categoryKey="date"
            colors={["#6366f1"]}
          />
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="col-span-full rounded-[2.5rem] border border-border/50 bg-card/30 p-8 backdrop-blur-xl lg:col-span-3"
        >
          <div className="mb-8 space-y-1">
            <h4 className="flex items-center gap-2 text-lg font-bold">
              <Activity className="size-5 text-violet-500" />
              Pipeline Health
            </h4>
            <p className="text-xs text-muted-foreground/60 font-medium">Current status of resume parsing tasks</p>
          </div>
          
          <AnalyticsChart 
            type="bar" 
            data={statusData} 
            dataKey="value" 
            categoryKey="name"
            colors={["#6366f1", "#8b5cf6", "#ec4899"]}
          />
        </motion.div>
      </div>

      {/* ── Lower Section: Skills & Insights ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skills Analysis */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-[2.5rem] border border-border/50 bg-card/30 p-8 backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-lg font-bold">
              <Zap className="size-5 text-amber-500" />
              Skill Frequency
            </h4>
          </div>
          <div className="space-y-4">
            {topSkills.map((skill: any, i: number) => (
              <div key={i} className="group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{skill.skill}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.count / topSkills[0].count) * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 + (i * 0.1) }}
                      className="h-full bg-gradient-to-r from-primary to-violet-500"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-foreground/70">{skill.count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Evaluation Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="col-span-full rounded-[2.5rem] border border-border/50 bg-card/30 p-8 backdrop-blur-xl lg:col-span-2"
        >
          <div className="mb-8 space-y-1">
            <h4 className="flex items-center gap-2 text-lg font-bold">
              <BarChart3 className="size-5 text-primary" />
              Evaluation Distribution
            </h4>
            <p className="text-xs text-muted-foreground/60 font-medium">Candidate selection breakdown</p>
          </div>
          
          <AnalyticsChart 
            type="pie" 
            data={evaluationData} 
            dataKey="value" 
            categoryKey="name"
            colors={["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"]}
            height={220}
          />

          <div className="mt-6 grid grid-cols-2 gap-4">
            {evaluationData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"][i] }} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.name}</span>
                <span className="ml-auto text-[11px] font-black">{item.value as React.ReactNode}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
