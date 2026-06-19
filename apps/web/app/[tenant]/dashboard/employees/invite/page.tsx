"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, 
  CheckCircle2, UploadCloud, Trash2, Users, Plus, Shield, ShieldCheck, Mail, Database, AlertTriangle
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { useAuthStore } from "@/store/useAuthStore";
import { useBulkOnboardEmployeesTenantsEmployeesBulkOnboardPost } from "@repo/orval-config/src/api/default/default";
import { useGetEnumValuesApiV1SuperadminEnumsGet } from "@repo/orval-config/src/api/superadmin/superadmin";

// Import the shared aesthetic components you use in settings
import { AccentBar, TestSectionCard } from "@/components/_shared"; 
import { Dropdown } from "@/components/_shared/Dropdown";

const roleLabels: Record<string, string> = {
  "employee": "Employee",
  "manager": "Manager",
  "tenant-admin": "Administrator",
  "admin": "Administrator",
  "recruiter": "Recruiter",
  "viewer": "Viewer",
  "hiring-manager": "Hiring Manager",
  "interviewer": "Interviewer",
  "recruiting-manager": "Recruiting Manager",
  "candidate": "Candidate",
  "hr-director": "HR Director",
  "hr-manager": "HR Manager",
  "hrbp": "HRBP",
  "hr-generalist": "HR Generalist",
  "payroll-manager": "Payroll Manager",
  "payroll-specialist": "Payroll Specialist",
};

// ── Validation Helpers ────────────────────────────────────────────────────────
const validateRequired = (val: string, fieldName: string) => {
  const result = z.string().min(1, `${fieldName} is required`).safeParse(val);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};

const validateEmail = (val: string) => {
  const result = z.string().email("Please enter a valid email").safeParse(val);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};

const validateOptionalEmail = (val: string) => {
  if (!val || val.trim() === "") return undefined;
  const result = z.string().email("Please enter a valid email").safeParse(val);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};

// ── Role Normalizer Helper ───────────────────────────────────────────────────
const normalizeRole = (rawRole: string | undefined): string => {
  if (!rawRole) return "employee";
  let role = rawRole.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (role === "admin") return "tenant-admin";
  return role;
};

// ── Fallback ID Generator ─────────────────────────────────────────────────────
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// ─────────────────────────────────────────────────────────────────────────────
type StagedEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_email?: string;
  tenant_role: string;
};

export default function EmployeeInvitePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stagedEmployees, setStagedEmployees] = useState<StagedEmployee[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState<{ current: number; total: number } | null>(null);
  
  const user = useAuthStore((state) => state.user);
  const orgClaim = user?.organization || {};
  const orgId = Object.keys(orgClaim)[0] || "";

  const inviteMutation = useBulkOnboardEmployeesTenantsEmployeesBulkOnboardPost();
  const { data: enums } = useGetEnumValuesApiV1SuperadminEnumsGet();
  
  // Safely unwrap the Axios response if nested
  const enumData = (enums as any)?.data || enums || {};

  const roleOptions = useMemo(() => {
    const roles = (enumData?.tenant_roles || ["employee", "manager", "tenant-admin"]);
    return roles.map((role: string) => ({
      label: roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1),
      value: role,
      icon: <Shield className="size-4" />
    }));
  }, [enumData]);

  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      contact_email: "",
      tenant_role: "employee", 
    },
    onSubmit: async ({ value }) => {
      setStagedEmployees((prev) => [
        ...prev, 
        { 
          ...value, 
          contact_email: value.contact_email.trim() !== "" ? value.contact_email : undefined,
          id: generateId() 
        }
      ]);
      form.reset();
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
        if (rows.length < 2) {
          setGlobalError("The CSV file must contain at least a header row and one data row.");
          return;
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(rows[0] || "").map(h => h.toLowerCase().replace(/[\s_]/g, ''));
        const firstNameIdx = headers.findIndex(h => h === "firstname" || h === "first" || h === "givenname");
        const lastNameIdx = headers.findIndex(h => h === "lastname" || h === "last" || h === "surname");
        const emailIdx = headers.findIndex(h => h === "email" || h === "mail" || h === "workemail");
        const contactEmailIdx = headers.findIndex(h => h === "contactemail" || h === "personalemail" || h === "deliveryemail");
        const roleIdx = headers.findIndex(h => h === "tenantrole" || h === "role" || h === "workspacerole");

        if (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
          setGlobalError("Required headers not found. The CSV must contain columns for First Name, Last Name, and Email.");
          return;
        }

        const dataRows = rows.slice(1);
        const newEmployees: StagedEmployee[] = dataRows.map(rowLine => {
          const columns = parseCSVLine(rowLine);
          const email = columns[emailIdx] || "";
          const firstName = columns[firstNameIdx] || "";
          const lastName = columns[lastNameIdx] || "";
          const contactEmail = contactEmailIdx !== -1 ? columns[contactEmailIdx] : undefined;
          const rawRole = roleIdx !== -1 ? columns[roleIdx] : "employee";
          
          return {
            id: generateId(),
            first_name: firstName,
            last_name: lastName,
            email: email,
            contact_email: contactEmail && contactEmail.trim() !== "" ? contactEmail : undefined,
            tenant_role: normalizeRole(rawRole)
          };
        }).filter(emp => emp.email && emp.first_name);

        if (newEmployees.length === 0) {
          setGlobalError("No valid employee records were found in the CSV.");
          return;
        }

        setStagedEmployees(prev => [...prev, ...newEmployees]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setGlobalError(null);
      } catch (err) {
        setGlobalError("Failed to parse CSV file. Please ensure it matches the required format.");
      }
    };
    reader.readAsText(file);
  };

  const removeStagedEmployee = (id: string) => {
    setStagedEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const handleSubmitAll = async () => {
    if (stagedEmployees.length === 0) return;
    setGlobalError(null);
    setIsSuccess(false);
    setIsDeploying(true);
    setDeployProgress({ current: 0, total: stagedEmployees.length });

    const CHUNK_SIZE = 50; 
    const allEmployees = [...stagedEmployees];
    const failedOnboard: StagedEmployee[] = [];
    const errorDetails: string[] = [];

    try {
      for (let i = 0; i < allEmployees.length; i += CHUNK_SIZE) {
        const chunk = allEmployees.slice(i, i + CHUNK_SIZE);
        const payload = {
          organization_id: orgId,
          employees: chunk.map(({ first_name, last_name, email, contact_email, tenant_role }) => ({
            first_name,
            last_name,
            email,
            contact_email: contact_email || undefined,
            tenant_role
          }))
        };

        try {
          const response = await inviteMutation.mutateAsync({ data: payload });
          const resData = (response as any)?.data || response || {};
          
          if (resData.failed && resData.failed.length > 0) {
            for (const failedItem of resData.failed) {
              const matchedEmp = chunk.find(e => e.email.toLowerCase() === failedItem.email.toLowerCase());
              if (matchedEmp) {
                failedOnboard.push({
                  ...matchedEmp,
                  first_name: `${matchedEmp.first_name} (Error: ${failedItem.error || "Failed"})`
                });
              }
            }
          }
        } catch (error: any) {
          console.error("Failed to deploy chunk starting at index", i, error);
          let errorMsg = "API or Network Error";
          const data = error?.response?.data;
          if (data) {
            if (typeof data.detail === "string") {
              errorMsg = data.detail;
            } else if (Array.isArray(data.detail)) {
              errorMsg = data.detail[0]?.msg || data.detail[0]?.message || JSON.stringify(data.detail);
            }
          }
          errorDetails.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${errorMsg}`);
          
          for (const emp of chunk) {
            failedOnboard.push({
              ...emp,
              first_name: `${emp.first_name} (Failed: ${errorMsg})`
            });
          }
        }

        setDeployProgress({ current: Math.min(i + chunk.length, allEmployees.length), total: allEmployees.length });
      }

      if (failedOnboard.length === 0) {
        setIsSuccess(true);
        setStagedEmployees([]);
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        setStagedEmployees(failedOnboard);
        let errorSummary = `Onboarded ${allEmployees.length - failedOnboard.length} of ${allEmployees.length} successfully. ${failedOnboard.length} failed.`;
        if (errorDetails.length > 0) {
          errorSummary += ` Errors: ${errorDetails.join("; ")}`;
        }
        setGlobalError(errorSummary);
      }
    } catch (err) {
      setGlobalError("An unexpected error occurred during deployment.");
    } finally {
      setIsDeploying(false);
      setDeployProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background sm:px-8 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Onboarding
          </p>
          <h1 className="text-[28px] font-semibold tracking-wide text-foreground flex items-center gap-3">
            Invite Team
          </h1>
          <p className="text-sm text-muted-foreground">
            Add employees manually or upload a CSV file to provision their workspace accounts.
          </p>
        </div>

        {/* Tab Bar (Mirrored from Settings) */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
          {(["manual", "csv"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "hover:cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60",
              ].join(" ")}
            >
              {tab === "manual" ? <Plus className="size-4" /> : <UploadCloud className="size-4" />}
              {tab === "manual" ? "Add Manually" : "Upload CSV"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">  
          {/* ── Left Column: Input Methods ─────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            <TestSectionCard>
              <AccentBar />
              
              <div className="border-b border-border px-6 py-5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                  <Users className="size-3" /> Data Entry
                </div>
                <h2 className="text-base font-semibold text-card-foreground">
                  {activeTab === "manual" ? "Employee Details" : "Bulk Upload"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "manual" 
                    ? "Fill out the fields below to stage a new user." 
                    : "Upload a structured file to map multiple users at once."}
                </p>
              </div>

              <div className="p-6">
                {activeTab === "manual" ? (
                  <form
                    id="manual-invite-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <form.Field
                        name="first_name"
                        validators={{ onChange: ({ value }) => validateRequired(value, "First Name") }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">First Name</Label>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Jane"
                              className="h-10 border-input bg-background text-foreground text-sm focus-visible:ring-ring"
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                            )}
                          </div>
                        )}
                      />

                      <form.Field
                        name="last_name"
                        validators={{ onChange: ({ value }) => validateRequired(value, "Last Name") }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Doe"
                              className="h-10 border-input bg-background text-foreground text-sm focus-visible:ring-ring"
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <form.Field
                        name="email"
                        validators={{ onChange: ({ value }) => validateEmail(value) }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace Email</Label>
                            <Input
                              id={field.name}
                              type="email"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="jane@company.com"
                              className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring"
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                            )}
                          </div>
                        )}
                      />

                      <form.Field
                        name="contact_email"
                        validators={{ onChange: ({ value }) => validateOptionalEmail(value) }}
                        children={(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Personal Email (Optional)</Label>
                            <Input
                              id={field.name}
                              type="email"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="jane.doe@gmail.com"
                              className="h-10 border-input bg-background text-foreground font-mono text-sm focus-visible:ring-ring"
                            />
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    <div className="h-px bg-border my-4" />

                    <form.Field
                      name="tenant_role"
                      children={(field) => (
                        <div className="space-y-2">
                          <Dropdown
                            label="Workspace Role"
                            options={roleOptions}
                            value={field.state.value}
                            onChange={(val) => field.handleChange(val)}
                          />
                        </div>
                      )}
                    />
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* CSV Upload Dropzone */}
                    <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl py-10 px-6 bg-muted/20 text-center transition-all hover:bg-muted/40 hover:border-foreground/30">
                      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card mb-4">
                        <Database className="size-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 text-sm">Upload Data File</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Upload a CSV file containing your employee roster.
                      </p>
                      
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          variant="outline"
                          className="hover:cursor-pointer bg-card text-xs h-9"
                        >
                          <UploadCloud className="mr-2 size-3.5" /> Select .CSV File
                        </Button>
                        <Button 
                          onClick={() => {
                            const headers = "First Name,Last Name,Email,Personal Email,Workspace Role\n";
                            const example1 = "Jane,Doe,jane.doe@company.com,jane.doe@personal.com,employee\n";
                            const example2 = "John,Smith,john.smith@company.com,,hiring-manager\n";
                            const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + example1 + example2);
                            const link = document.createElement("a");
                            link.setAttribute("href", csvContent);
                            link.setAttribute("download", "employee_invite_template.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }} 
                          variant="secondary"
                          className="hover:cursor-pointer text-xs h-9"
                        >
                          Download Template
                        </Button>
                      </div>
                    </div>

                    {/* CSV Guidelines & Roles list */}
                    <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Database className="size-4 text-chart-2" />
                        <span>CSV Format & Guidelines</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground">Required Columns</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
                            <li><strong className="text-foreground">First Name</strong> (e.g. Jane)</li>
                            <li><strong className="text-foreground">Last Name</strong> (e.g. Doe)</li>
                            <li><strong className="text-foreground">Email</strong> (e.g. jane@company.com)</li>
                            <li><strong className="text-foreground">Personal Email</strong> (delivery email)</li>
                          </ul>
                          <p className="font-semibold text-muted-foreground mt-3">Optional Columns</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">sss
                            <li><strong className="text-foreground">Workspace Role</strong> (defaults to 'employee')</li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-muted-foreground mb-1.5">Allowed Workspace Roles</p>
                            <div className="flex flex-wrap gap-1">
                              {roleOptions.map((role: { label: string; value: string }) => (
                                <span 
                                  key={role.value} 
                                  className="bg-card border border-border text-foreground px-2 py-0.5 rounded-md text-[10px] font-mono"
                                  title={role.label}
                                >
                                  {role.value}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            💡 <strong className="text-foreground font-medium">Auto-Correction:</strong> Roles are case-insensitive and spaces are automatically converted to hyphens (e.g., <code className="bg-muted px-1 py-0.5 rounded">Hiring Manager</code> is auto-corrected to <code className="bg-muted px-1 py-0.5 rounded">hiring-manager</code>).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer (Only shown for Manual) */}
              {activeTab === "manual" && (
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5" /> Required fields marked
                  </div>
                  <Button 
                    type="submit"
                    form="manual-invite-form"
                    variant="outline"
                    className="inline-flex items-center gap-2 bg-card text-foreground hover:bg-muted font-medium text-sm px-5 py-2 rounded-xl shadow-sm hover:cursor-pointer"
                  >
                    <Plus className="size-4" /> Stage User
                  </Button>
                </div>
              )}
            </TestSectionCard>
          </div>

          {/* ── Right Column: Staging Area ─────────────────────────────────── */}
          <div className="lg:col-span-2">
            <TestSectionCard>
              <AccentBar />
              
              <AnimatePresence>
                {isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 w-full bg-success text-success-foreground px-4 py-3 flex items-center justify-center gap-2 z-20 text-sm font-semibold shadow-sm border-b border-success/20"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Invitations sent successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-b border-border px-5 py-4 shrink-0 bg-muted/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-card-foreground text-sm">Staged Roster</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Pending deployment</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold border border-primary/20">
                    {stagedEmployees.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto scroll-smooth bg-card">
                {stagedEmployees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/50 mb-3">
                      <Users className="size-5 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No users staged</p>
                    <p className="text-xs mt-1 max-w-[200px]">Add employees manually or upload a CSV to populate this list.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {stagedEmployees.map((emp) => (
                      <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors group">
                        <div className="flex flex-col overflow-hidden w-full pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground truncate">{emp.first_name} {emp.last_name}</span>
                            <span className="text-[9px] uppercase tracking-wider bg-secondary/50 border border-border text-secondary-foreground px-2 py-0.5 rounded-full font-bold shrink-0">
                              {roleLabels[emp.tenant_role] || emp.tenant_role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate" title={`Work: ${emp.email}`}>
                            <Mail className="size-3 opacity-70" /> {emp.email}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeStagedEmployee(emp.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors hover:cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                          title="Remove from staging"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border bg-muted/30 p-5 shrink-0 flex flex-col gap-3">
                {globalError && (
                  <div className="w-full px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <p>{globalError}</p>
                  </div>
                )}

                {deployProgress && (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Deploying accounts...</span>
                      <span>{deployProgress.current} / {deployProgress.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(deployProgress.current / deployProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleSubmitAll}
                  disabled={stagedEmployees.length === 0 || isDeploying}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer font-semibold shadow-sm h-11 rounded-xl"
                >
                  {isDeploying ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Deploying...</>
                  ) : (
                    <>Deploy {stagedEmployees.length} Accounts <ArrowRight className="ml-2 size-4" /></>
                  )}
                </Button>
              </div>
            </TestSectionCard>
          </div>
          
        </div>
      </div>
    </div>
  );
}