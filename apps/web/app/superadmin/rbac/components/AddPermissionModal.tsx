"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { 
  Loader2, ShieldPlus, Fingerprint, UserCircle2
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useAddRolePermissionApiV1SuperadminRbacPermissionsPost,
  useGetEnumValuesApiV1SuperadminEnumsGet,
  getListRolePermissionsApiV1SuperadminRbacPermissionsGetQueryKey
} from "@repo/orval-config/src/api/superadmin/superadmin/superadmin";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Dropdown } from "@/components/_shared/Dropdown";

interface AddPermissionModalProps {
  onClose: () => void;
}

export default function AddPermissionModal({ onClose }: AddPermissionModalProps) {
  const queryClient = useQueryClient();
  
  // ── Data Fetching ──
  const { data: enumsData, isLoading: isLoadingEnums } = useGetEnumValuesApiV1SuperadminEnumsGet();
  const roles = (enumsData as any)?.tenant_roles || [];
  
  // ── Mutations ──
  const addMutation = useAddRolePermissionApiV1SuperadminRbacPermissionsPost();
    
  const form = useForm({
    defaultValues: {
      role_name: "",
      permission: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await addMutation.mutateAsync({ 
          data: {
            role_name: value.role_name,
            permission: value.permission.trim()
          } 
        });
        toast.success("Permission association added!");
        
        form.reset();
        onClose();
        queryClient.invalidateQueries({ queryKey: getListRolePermissionsApiV1SuperadminRbacPermissionsGetQueryKey() });
        
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || "Failed to add permission.");
      }
    },
  });

  const roleOptions = [
    { label: "Select a Role Group", value: "" },
    ...roles.map((role: string) => ({
      label: role.toUpperCase(),
      value: role,
      icon: <UserCircle2 className="size-4" />
    }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Add Association</h2>
              <p className="text-sm text-muted-foreground">Grant a permission to a role group.</p>
            </div>
          </div>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }} 
          className="p-6 space-y-6"
        >
          <form.Field
            name="role_name"
            validators={{
              onChange: ({ value }) => (!value ? "Please select a role" : undefined)
            }}
            children={(field) => (
              <div className="space-y-2">
                <Dropdown
                  label="Role Group"
                  options={roleOptions}
                  value={field.state.value} 
                  onChange={(val) => field.handleChange(val as string)}
                  disabled={isLoadingEnums}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(',')}</p>
                )}
              </div>
            )}
          />

          <form.Field
            name="permission"
            validators={{
              onChange: ({ value }) => {
                const res = z.string().min(3, "Permission string is too short").safeParse(value);
                return res.success ? undefined : JSON.parse(res.error.message)[0].message;
              }
            }}
            children={(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Permission String
                  </label>
                  <Fingerprint className="size-3.5 text-muted-foreground/50" />
                </div>
                <Input 
                  id={field.name}
                  value={field.state.value} 
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)} 
                  className="bg-background h-11 border-input focus-visible:ring-ring font-mono text-sm" 
                  placeholder="e.g. candidate:read" 
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Enter the exact permission string required by the API (e.g., <code className="text-primary">billing:access</code>).
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(',')}</p>
                )}
              </div>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 hover:cursor-pointer border-border"
            >
              Cancel
            </Button>
            
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button 
                  type="submit" 
                  disabled={!canSubmit || isSubmitting || addMutation.isPending} 
                  className="flex-1 bg-primary text-primary-foreground hover:cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting || addMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Add Mapping"
                  )}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
