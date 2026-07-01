"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Shield,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  User,
  Users,
  Settings,
  Plus,
  Trash2,
  ChevronRight,
  Handshake
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import { AccentBar, SectionCard } from "@/components/_shared";
import { Dropdown } from "@/components/_shared/Dropdown";

import {
  useListServicesApiV1AdminApprovalConfigServicesGet,
  useListRulesApiV1AdminApprovalConfigServicesServiceKeyRulesGet,
  useUpdateRuleApiV1AdminApprovalConfigRulesRuleIdPut,
  useGetRoleHierarchyRouteApiV1AdminApprovalConfigRolesHierarchyGet
} from "@repo/orval-config/src/api/tenant/admin-approval-config/admin-approval-config";

// Human-readable labels for system roles
const ROLE_LABELS: Record<string, string> = {
  "hr-director": "HR Director",
  "hr-manager": "HR Manager",
  "hrbp": "HR Business Partner (HRBP)",
  "hr-generalist": "HR Generalist",
  "recruiting-manager": "Recruiting Manager",
  "recruiter": "Recruiter",
  "hiring-manager": "Hiring Manager",
  "interviewer": "Interviewer",
  "payroll-manager": "Payroll Manager",
  "payroll-specialist": "Payroll Specialist",
  "employee": "Employee (Self)",
  "tenant-admin": "Tenant Admin",
};

// Human-readable labels for service keys
const SERVICE_LABELS: Record<string, string> = {
  "job-service": "Recruitment & Jobs",
  "employee-service": "Employee Directory",
  "tenant-service": "Workspace Admin",
  "billing-service": "Billing & Credits",
};

// Metadata for grouping workflow rules by domain/prefix
const DOMAIN_METADATA: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  job: { label: "Job Management Rules", icon: Handshake, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  candidate: { label: "Candidate Pipeline Rules", icon: Users, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  evaluation: { label: "Evaluations & Overrides", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  employee: { label: "Employee Directory Rules", icon: User, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  billing: { label: "Billing & Credits Rules", icon: Settings, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  tenant: { label: "Workspace & Security Rules", icon: Shield, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  general: { label: "General & Misc Rules", icon: Sliders, color: "text-muted-foreground bg-muted/20 border-border/50" }
};

// Format permission keys to look user-friendly
function formatPermissionKey(key: string): string {
  if (!key) return "Unknown Action";
  // e.g. "candidate:override" -> "Override Candidate Stage"
  // e.g. "job:publish" -> "Publish Job Requisition"
  const parts = key.split(":");
  if (parts.length === 2) {
    const domain = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "";
    const action = parts[1] ? parts[1].replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
    return `${action} (${domain})`;
  }
  return key.replace(/[:-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

interface RuleEditorState {
  mechanism: string;
  approver_mode: string;
  approver_role: string;
  dedicated_approver_user_id: string;
  timeout_hours: number;
  timeout_resolution: string;
  useMultiStep: boolean;
  chain_steps: Array<{ approver_role: string; timeout_hours: number }>;
}

export default function WorkflowTab() {
  const [selectedService, setSelectedService] = useState<string>("");
  const [editingRules, setEditingRules] = useState<Record<string, RuleEditorState>>({});

  // ── Data Fetching ──
  const { 
    data: services, 
    isLoading: isLoadingServices, 
    refetch: refetchServices 
  } = useListServicesApiV1AdminApprovalConfigServicesGet();

  const {
    data: rules,
    isLoading: isLoadingRules,
    refetch: refetchRules
  } = useListRulesApiV1AdminApprovalConfigServicesServiceKeyRulesGet(selectedService, {
    query: {
      enabled: !!selectedService,
    } as any
  });

  const { data: hierarchyData } = useGetRoleHierarchyRouteApiV1AdminApprovalConfigRolesHierarchyGet();
  
  // ── Mutation ──
  const updateRuleMutation = useUpdateRuleApiV1AdminApprovalConfigRulesRuleIdPut();

  // Set default selected service once loaded
  useEffect(() => {
    if (services && services.length > 0 && !selectedService) {
      setSelectedService(services?.[0]?.service_key || "");
    }
  }, [services, selectedService]);

  // Sync loaded rules into editing state
  useEffect(() => {
    if (rules) {
      const initialStates: Record<string, RuleEditorState> = {};
      rules.forEach(rule => {
        initialStates[rule.id] = {
          mechanism: rule.mechanism || "bypass",
          approver_mode: rule.approver_mode || "group",
          approver_role: (rule.approver_role as string) || "hr-manager",
          dedicated_approver_user_id: (rule.dedicated_approver_user_id as string) || "",
          timeout_hours: (rule.timeout_hours as number) || 72,
          timeout_resolution: rule.timeout_resolution || "auto_deny",
          useMultiStep: !!(rule.chain_steps && rule.chain_steps.length > 0),
          chain_steps: rule.chain_steps?.map(step => ({
            approver_role: step.approver_role,
            timeout_hours: step.timeout_hours
          })) || []
        };
      });
      setEditingRules(initialStates);
    }
  }, [rules]);

  // Group rules by permission key prefix (domain)
  const groupedRules = React.useMemo(() => {
    if (!rules) return {};
    const groups: Record<string, typeof rules> = {};
    rules.forEach((rule) => {
      const parts = rule.permission_key.split(":");
      const domain = (parts.length > 1 ? parts[0] : "general") || "general";
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain]!.push(rule);
    });
    return groups;
  }, [rules]);

  // Extract available roles from hierarchy keys
  const availableRoles = hierarchyData ? Object.keys(hierarchyData as object) : Object.keys(ROLE_LABELS);

  const approverRoleOptions = availableRoles.map(role => ({
    value: role,
    label: ROLE_LABELS[role] || role
  }));

  const approverModeOptions = [
    { value: "group", label: "Role-Based Group (Dynamic Escalation)" },
    { value: "dedicated", label: "Dedicated Specific User (Fixed ID)" }
  ];

  const timeoutResolutionOptions = [
    { value: "auto_deny", label: "Auto Deny (Reject & Archive)" },
    { value: "auto_approve", label: "Auto Approve (Bypass on expiry)" },
    { value: "hold_for_admin", label: "Hold for Admin (Freeze state)" }
  ];

  const handleStateChange = (ruleId: string, updates: Partial<RuleEditorState>) => {
    setEditingRules(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId]!,
        ...updates
      }
    }));
  };

  const addChainStep = (ruleId: string) => {
    const current = editingRules[ruleId];
    if (!current) return;
    handleStateChange(ruleId, {
      chain_steps: [...current.chain_steps, { approver_role: "hr-generalist", timeout_hours: 72 }]
    });
  };

  const removeChainStep = (ruleId: string, index: number) => {
    const current = editingRules[ruleId];
    if (!current) return;
    const steps = [...current.chain_steps];
    steps.splice(index, 1);
    handleStateChange(ruleId, { chain_steps: steps });
  };

  const updateChainStep = (ruleId: string, index: number, updates: Partial<{ approver_role: string; timeout_hours: number }>) => {
    const current = editingRules[ruleId];
    if (!current) return;
    const steps = current.chain_steps.map((step, i) => {
      if (i === index) return { ...step, ...updates };
      return step;
    });
    handleStateChange(ruleId, { chain_steps: steps });
  };

  const handleSaveRule = async (ruleId: string) => {
    const state = editingRules[ruleId];
    if (!state) return;

    try {
      const payload: any = {
        mechanism: state.mechanism,
        timeout_hours: state.timeout_hours,
        timeout_resolution: state.timeout_resolution,
      };

      if (state.mechanism === "approve") {
        payload.approver_mode = state.approver_mode;
        if (state.approver_mode === "dedicated") {
          if (!state.dedicated_approver_user_id.trim()) {
            toast.error("Dedicated user ID is required for dedicated approver mode.");
            return;
          }
          payload.dedicated_approver_user_id = state.dedicated_approver_user_id.trim();
        } else {
          payload.approver_role = state.approver_role;
        }

        if (state.useMultiStep) {
          if (state.chain_steps.length === 0) {
            toast.error("At least one step is required for multi-step approval chain.");
            return;
          }
          payload.chain_steps = state.chain_steps;
        } else {
          payload.chain_steps = [];
        }
      }

      await updateRuleMutation.mutateAsync({
        ruleId,
        data: payload
      });

      toast.success("Workflow rule saved successfully.");
      refetchRules();
      refetchServices();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save workflow rule.");
    }
  };

  if (isLoadingServices) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="size-8 animate-spin text-chart-4" />
        <p className="text-sm text-muted-foreground">Loading workflow services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <SectionCard>
        <AccentBar />
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-chart-4 text-xs font-bold uppercase tracking-widest">
            <Sliders className="size-4" /> Workflow Engine
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Approval & Acknowledgment Rules
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Configure system-wide actions that require manual sign-off. Workflows follow the 
            <strong> Hierarchical Role-Based Access Control (HRBAC)</strong> tree. If no direct owner 
            is assigned, requests escalate automatically up the management chain.
          </p>
        </div>
      </SectionCard>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ── Left Sidebar (Services list) ── */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
            Services
          </p>
          {services?.map((svc) => {
            const isSelected = selectedService === svc.service_key;
            return (
              <button
                key={svc.service_key}
                onClick={() => setSelectedService(svc.service_key)}
                className={[
                  "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 hover:cursor-pointer flex items-center justify-between group",
                  isSelected
                    ? "bg-card text-foreground border-chart-4 shadow-sm"
                    : "bg-card/40 text-muted-foreground border-border hover:bg-card/80 hover:text-foreground"
                ].join(" ")}
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold tracking-wide capitalize">
                    {SERVICE_LABELS[svc.service_key] || svc.service_key.replace("-service", "")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {svc.rule_count || 0} configured rules
                  </p>
                </div>
                <ChevronRight 
                  className={[
                    "size-4 opacity-0 transition-all duration-200 group-hover:opacity-100",
                    isSelected ? "opacity-100 text-chart-4 translate-x-1" : "text-muted-foreground"
                  ].join(" ")} 
                />
              </button>
            );
          })}
        </div>

        {/* ── Right Content Area (Rules for Service) ── */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {SERVICE_LABELS[selectedService] || selectedService} Workflow Configurations
            </h3>
            {isLoadingRules && <Loader2 className="size-4 animate-spin text-chart-4" />}
          </div>

          {!isLoadingRules && (!rules || rules.length === 0) && (
            <div className="rounded-2xl border border-border bg-card/50 p-12 text-center text-muted-foreground">
              <Info className="size-8 mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-sm font-medium">No rules configured for this service.</p>
            </div>
          )}

          <div className="space-y-10">
            {Object.entries(groupedRules).map(([domain, groupRules]) => {
              const meta = (DOMAIN_METADATA[domain] || DOMAIN_METADATA.general) as { label: string; icon: React.ComponentType<any>; color: string };
              const Icon = meta.icon;

              return (
                <div key={domain} className="space-y-4">
                  {/* Group Header */}
                  <div className="flex items-center gap-3 px-1 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className={`p-2 rounded-xl border ${meta.color} flex items-center justify-center`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {meta.label}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {groupRules.length} workflow rules under {domain} domain
                      </p>
                    </div>
                    <div className="h-px bg-border flex-1 ml-2" />
                  </div>

                  <div className="space-y-6">
                    {groupRules.map((rule) => {
              const state = editingRules[rule.id];
              if (!state) return null;

              // Check if there are local modifications compared to original rule
              const isModified = 
                state.mechanism !== rule.mechanism ||
                state.timeout_hours !== rule.timeout_hours ||
                state.timeout_resolution !== rule.timeout_resolution ||
                (state.mechanism === "approve" && (
                  state.approver_mode !== rule.approver_mode ||
                  (state.approver_mode === "group" && state.approver_role !== rule.approver_role) ||
                  (state.approver_mode === "dedicated" && state.dedicated_approver_user_id !== rule.dedicated_approver_user_id) ||
                  state.useMultiStep !== !!(rule.chain_steps && rule.chain_steps.length > 0) ||
                  JSON.stringify(state.chain_steps) !== JSON.stringify(rule.chain_steps?.map(s => ({ approver_role: s.approver_role, timeout_hours: s.timeout_hours })) || [])
                ));

              return (
                <div 
                  key={rule.id}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="border-b border-border bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-bold text-foreground tracking-wide">
                          {formatPermissionKey(rule.permission_key)}
                        </h4>
                        {isModified && (
                          <Badge className="bg-warning-subtle text-warning-foreground border border-warning/30 font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                            Unsaved Changes
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rule.description || `Controls authorization requirements for action: ${rule.permission_key}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Performing Role:
                      </span>
                      <Badge variant="outline" className="rounded-lg text-xs font-semibold capitalize bg-muted/40">
                        {ROLE_LABELS[rule.role_performing] || rule.role_performing}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-6">
                    {/* Mechanism Selection */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Trigger Condition
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Bypass */}
                        <label 
                          className={[
                            "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            state.mechanism === "bypass"
                              ? "bg-muted/40 border-border shadow-inner text-foreground"
                              : "border-border/60 hover:bg-muted/10 text-muted-foreground"
                          ].join(" ")}
                        >
                          <input 
                            type="radio" 
                            name={`mechanism-${rule.id}`}
                            value="bypass"
                            checked={state.mechanism === "bypass"}
                            onChange={() => handleStateChange(rule.id, { mechanism: "bypass" })}
                            className="mt-1 accent-chart-4"
                          />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold flex items-center gap-1.5">
                              <Zap className="size-3.5 text-warning" /> Bypass
                            </span>
                            <span className="text-[11px] block leading-normal text-muted-foreground">
                              Action is auto-approved instantly without any review cycles.
                            </span>
                          </div>
                        </label>

                        {/* Acknowledge */}
                        <label 
                          className={[
                            "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            state.mechanism === "acknowledge"
                              ? "bg-muted/40 border-border shadow-inner text-foreground"
                              : "border-border/60 hover:bg-muted/10 text-muted-foreground"
                          ].join(" ")}
                        >
                          <input 
                            type="radio" 
                            name={`mechanism-${rule.id}`}
                            value="acknowledge"
                            checked={state.mechanism === "acknowledge"}
                            onChange={() => handleStateChange(rule.id, { mechanism: "acknowledge" })}
                            className="mt-1 accent-chart-4"
                          />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold flex items-center gap-1.5">
                              <Info className="size-3.5 text-chart-2" /> Acknowledge (FYI)
                            </span>
                            <span className="text-[11px] block leading-normal text-muted-foreground">
                              Completes instantly but sends warning notifications to supervisors.
                            </span>
                          </div>
                        </label>

                        {/* Approve */}
                        <label 
                          className={[
                            "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            state.mechanism === "approve"
                              ? "bg-muted/40 border-border shadow-inner text-foreground"
                              : "border-border/60 hover:bg-muted/10 text-muted-foreground"
                          ].join(" ")}
                        >
                          <input 
                            type="radio" 
                            name={`mechanism-${rule.id}`}
                            value="approve"
                            checked={state.mechanism === "approve"}
                            onChange={() => handleStateChange(rule.id, { mechanism: "approve" })}
                            className="mt-1 accent-chart-4"
                          />
                          <div className="space-y-1">
                            <span className="text-sm font-semibold flex items-center gap-1.5">
                              <Shield className="size-3.5 text-success" /> Manual Approval
                            </span>
                            <span className="text-[11px] block leading-normal text-muted-foreground">
                              Action is locked/queued until reviewed by authorized approvers.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Manual Approval Settings - Conditional */}
                    {state.mechanism === "approve" && (
                      <div className="pt-4 border-t border-border/80 space-y-6 animate-in fade-in-50 duration-200">
                        
                        {/* Mode & Basic Approver */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Approver Mode
                            </Label>
                            <Dropdown
                              options={approverModeOptions}
                              value={state.approver_mode}
                              onChange={(val) => handleStateChange(rule.id, { approver_mode: val })}
                              placeholder="Select Approver Mode"
                            />
                          </div>

                          {state.approver_mode === "group" ? (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground">
                                Approver Role
                              </Label>
                              <Dropdown
                                options={approverRoleOptions}
                                value={state.approver_role}
                                onChange={(val) => handleStateChange(rule.id, { approver_role: val })}
                                placeholder="Select Approver Role"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground">
                                Dedicated User ID
                              </Label>
                              <Input
                                type="text"
                                placeholder="Enter Keycloak User UUID (e.g. 91ae643e...)"
                                value={state.dedicated_approver_user_id}
                                onChange={(e) => handleStateChange(rule.id, { dedicated_approver_user_id: e.target.value })}
                                className="h-11 rounded-xl border-border focus:ring-chart-4"
                              />
                            </div>
                          )}
                        </div>

                        {/* Timeout & Resolution */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Review Window (Hours)
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={1}
                                max={720}
                                value={state.timeout_hours}
                                onChange={(e) => handleStateChange(rule.id, { timeout_hours: parseInt(e.target.value) || 72 })}
                                className="h-11 rounded-xl border-border pr-12 focus:ring-chart-4"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                hours
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Timeout SLA Resolution Action
                            </Label>
                            <Dropdown
                              options={timeoutResolutionOptions}
                              value={state.timeout_resolution}
                              onChange={(val) => handleStateChange(rule.id, { timeout_resolution: val })}
                              placeholder="Select Resolution Action"
                            />
                          </div>
                        </div>

                        {/* Multi-step chain configuration */}
                        <div className="space-y-3 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-semibold text-foreground">
                                Multi-Step Approval Chain
                              </Label>
                              <span className="text-xs text-muted-foreground block">
                                Configure sequential steps that must be approved in order.
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const useMulti = !state.useMultiStep;
                                handleStateChange(rule.id, {
                                  useMultiStep: useMulti,
                                  chain_steps: useMulti && state.chain_steps.length === 0 
                                    ? [{ approver_role: state.approver_role, timeout_hours: state.timeout_hours }] 
                                    : state.chain_steps
                                  });
                              }}
                              className="rounded-xl border-border text-xs hover:cursor-pointer"
                            >
                              {state.useMultiStep ? "Disable Multi-Step" : "Enable Multi-Step"}
                            </Button>
                          </div>

                          {state.useMultiStep && (
                            <div className="space-y-3 p-4 rounded-xl border border-dashed border-border bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                              {state.chain_steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border shadow-xs">
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-4/15 text-chart-4 text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                    <Dropdown
                                      options={approverRoleOptions}
                                      value={step.approver_role}
                                      onChange={(val) => updateChainStep(rule.id, idx, { approver_role: val })}
                                      placeholder="Select Approver Role"
                                    />
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex-1">
                                        <input
                                          type="number"
                                          min={1}
                                          value={step.timeout_hours}
                                          onChange={(e) => updateChainStep(rule.id, idx, { timeout_hours: parseInt(e.target.value) || 72 })}
                                          className="w-full bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-chart-4"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">
                                          hrs
                                        </span>
                                      </div>
                                      
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeChainStep(rule.id, idx)}
                                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg hover:cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addChainStep(rule.id)}
                                className="w-full rounded-lg border-dashed text-xs py-1.5 flex items-center justify-center gap-1 hover:cursor-pointer mt-1"
                              >
                                <Plus className="size-3.5" /> Add Approval Stage
                              </Button>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  {isModified && (
                    <div className="border-t border-border bg-muted/10 px-6 py-3 flex justify-end gap-3 animate-in fade-in-30 duration-200">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Revert state to original rule configuration
                          handleStateChange(rule.id, {
                            mechanism: rule.mechanism || "bypass",
                            approver_mode: rule.approver_mode || "group",
                            approver_role: (rule.approver_role as string) || "hr-manager",
                            dedicated_approver_user_id: (rule.dedicated_approver_user_id as string) || "",
                            timeout_hours: (rule.timeout_hours as number) || 72,
                            timeout_resolution: rule.timeout_resolution || "auto_deny",
                            useMultiStep: !!(rule.chain_steps && rule.chain_steps.length > 0),
                            chain_steps: rule.chain_steps?.map(step => ({
                              approver_role: step.approver_role,
                              timeout_hours: step.timeout_hours
                            })) || []
                          });
                        }}
                        className="rounded-xl text-xs hover:cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateRuleMutation.isPending}
                        onClick={() => handleSaveRule(rule.id)}
                        className="bg-chart-4 text-white hover:bg-chart-4/90 rounded-xl text-xs shadow-xs px-5 hover:cursor-pointer"
                      >
                        {updateRuleMutation.isPending && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Save Rule Config
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
