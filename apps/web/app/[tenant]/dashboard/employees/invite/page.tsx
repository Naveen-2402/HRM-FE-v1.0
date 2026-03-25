"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, 
  CheckCircle2, UploadCloud, Trash2, Users, Plus 
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";

import { useAuthStore } from "@/store/useAuthStore";
import { useBulkOnboardEmployeesTenantsEmployeesBulkOnboardPost } from "@repo/orval-config/src/api/default/default";

// Manual validation helpers
const validateRequired = (val: string, fieldName: string) => {
  const result = z.string().min(1, `${fieldName} is required`).safeParse(val);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};

const validateEmail = (val: string) => {
  const result = z.string().email("Please enter a valid email address").safeParse(val);
  return result?.success ? undefined : result?.error?.issues[0]?.message;
};

type StagedEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function EmployeeInvitePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stagedEmployees, setStagedEmployees] = useState<StagedEmployee[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  
  // Extract org_id from Zustand
  const user = useAuthStore((state) => state.user);
  const orgClaim = user?.organization || {};
  const orgId = Object.keys(orgClaim)[0] || "";

  const inviteMutation = useBulkOnboardEmployeesTenantsEmployeesBulkOnboardPost();

  // Form for manually adding a SINGLE employee to the staging list
  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      // Add to staging list instead of submitting to API directly
      setStagedEmployees((prev) => [
        ...prev, 
        { ...value, id: crypto.randomUUID() }
      ]);
      form.reset();
    },
  });

  // Handle CSV Upload and Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Split by newlines and remove empty rows
        const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
        
        // Assume first row is header, process the rest
        const dataRows = rows.slice(1);
        
        const newEmployees: StagedEmployee[] = dataRows.map(row => {
          // Handle standard comma separation (basic parsing)
          const [first, last, email] = row.split(',').map(item => item.trim());
          return {
            id: crypto.randomUUID(),
            first_name: first || "",
            last_name: last || "",
            email: email || ""
          };
        }).filter(emp => emp.email && emp.first_name); // Only keep valid rows

        setStagedEmployees(prev => [...prev, ...newEmployees]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setGlobalError(null);
      } catch (err) {
        setGlobalError("Failed to parse CSV file. Please ensure it has first_name, last_name, email columns.");
      }
    };
    reader.readAsText(file);
  };

  const removeStagedEmployee = (id: string) => {
    setStagedEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  // The actual API Submission
  const handleSubmitAll = async () => {
    if (stagedEmployees.length === 0) return;
    setGlobalError(null);
    setIsSuccess(false);
    
    try {
      const payload = {
        organization_id: orgId,
        employees: stagedEmployees.map(({ first_name, last_name, email }) => ({
          first_name,
          last_name,
          email,
        }))
      };

      await inviteMutation.mutateAsync({ data: payload });
      
      setIsSuccess(true);
      setStagedEmployees([]);
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error: any) {
      setGlobalError(error?.response?.data?.detail || "Failed to invite employees. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-5 px-4">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Users className="size-8 text-primary" />
          Bulk Onboard Teammates
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Add employees manually or upload a CSV file to invite your entire team at once.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Input Methods */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border p-4 flex flex-row items-center justify-between">
              <div className="flex bg-muted p-1 rounded-md">
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors hover:cursor-pointer ${
                    activeTab === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Add Manually
                </button>
                <button
                  onClick={() => setActiveTab("csv")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-colors hover:cursor-pointer ${
                    activeTab === "csv" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upload CSV
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {activeTab === "manual" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <form.Field
                      name="first_name"
                      validators={{ onChange: ({ value }) => validateRequired(value, "First Name") }}
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name} className="text-foreground text-xs font-semibold">First Name</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Jane"
                            className="border-input bg-background text-foreground focus-visible:ring-ring h-10"
                          />
                        </div>
                      )}
                    />

                    {/* Last Name */}
                    <form.Field
                      name="last_name"
                      validators={{ onChange: ({ value }) => validateRequired(value, "Last Name") }}
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name} className="text-foreground text-xs font-semibold">Last Name</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Doe"
                            className="border-input bg-background text-foreground focus-visible:ring-ring h-10"
                          />
                        </div>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <form.Field
                    name="email"
                    validators={{ onChange: ({ value }) => validateEmail(value) }}
                    children={(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name} className="text-foreground text-xs font-semibold">Email Address</Label>
                        <Input
                          id={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="jane.doe@company.com"
                          className="border-input bg-background text-foreground focus-visible:ring-ring h-10"
                        />
                      </div>
                    )}
                  />

                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full mt-2 hover:cursor-pointer"
                  >
                    <Plus className="mr-2 size-4" /> Add to List
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-muted/10 text-center">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <UploadCloud className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
                    File must contain headers: <br/><span className="font-mono text-xs bg-muted p-1 rounded">first_name, last_name, email</span>
                  </p>
                  
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                    className="hover:cursor-pointer"
                  >
                    Select File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Staging Area */}
        <div className="lg:col-span-2">
          {/* 1. Added h-[550px] to force a fixed height container */}
          <Card className="bg-card border-border shadow-sm h-[341px] flex flex-col relative overflow-hidden">
            
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 left-0 w-full bg-primary text-primary-foreground p-3 flex items-center justify-center gap-2 z-10 text-sm"
                >
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Invites sent!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Added shrink-0 to prevent the header from squishing */}
            <CardHeader className="bg-muted/30 border-b border-border py-4 shrink-0">
              <CardTitle className="text-base text-card-foreground flex justify-between items-center">
                Staged Invites
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-bold">
                  {stagedEmployees.length}
                </span>
              </CardTitle>
            </CardHeader>
            
            {/* 3. Changed max-h to pure flex-1 overflow-y-auto so it perfectly fills the remaining space and scrolls */}
            <CardContent className="p-0 flex-1 overflow-y-auto scroll-smooth">
              {stagedEmployees.length === 0 ? (
                <div className="p-8 h-full text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
                  <Users className="size-8 mb-2 opacity-20" />
                  No employees staged yet. Add them manually or upload a CSV.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {stagedEmployees.map((emp) => (
                    <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-sm text-foreground truncate">{emp.first_name} {emp.last_name}</span>
                        <span className="text-xs text-muted-foreground truncate">{emp.email}</span>
                      </div>
                      <button 
                        onClick={() => removeStagedEmployee(emp.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors hover:cursor-pointer flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>

            {/* 4. Added shrink-0 here as well */}
            <CardFooter className="bg-muted/10 border-t border-border p-4 flex flex-col gap-3 shrink-0">
              {globalError && (
                <div className="w-full p-3 rounded bg-destructive/10 border border-destructive text-destructive text-xs font-medium">
                  {globalError}
                </div>
              )}
              
              <Button 
                onClick={handleSubmitAll}
                disabled={stagedEmployees.length === 0 || inviteMutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:cursor-pointer"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Send Invites ({stagedEmployees.length}) <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
      </div>
    </div>
  );
}