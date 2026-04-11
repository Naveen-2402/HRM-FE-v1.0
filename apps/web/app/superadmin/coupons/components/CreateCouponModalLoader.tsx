import React from "react";
import { Loader2 } from "lucide-react";

export default function CreateCouponModalLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ── Header Skeleton ── */}
        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="space-y-2.5">
            <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-3.5 w-64 bg-muted/60 rounded-md animate-pulse" />
          </div>
          <Loader2 className="size-5 text-muted-foreground animate-spin opacity-40" />
        </div>
        
        {/* ── Body Skeleton ── */}
        <div className="p-6 space-y-5">
          
          {/* Top Row: Name & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Middle Row: Type, Value, Currency */}
          <div className="grid grid-cols-3 gap-4 border-y border-border py-4">
            <div className="space-y-2.5 col-span-3 sm:col-span-1">
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <div className="h-3 w-14 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2.5 col-span-1 sm:col-span-1">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Product Dropdown */}
          <div className="space-y-2.5">
            <div className="h-3 w-40 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted/40 border border-border/50 rounded-md animate-pulse" />
            <div className="h-2.5 w-3/4 bg-muted/60 rounded animate-pulse" />
          </div>

          {/* Allocations Box */}
          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
            <div className="space-y-2.5">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-background border border-border/50 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-background border border-border/50 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-full bg-muted/60 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-primary/40 rounded-md animate-pulse" />
          </div>

        </div>
      </div>
    </div>
  );
}