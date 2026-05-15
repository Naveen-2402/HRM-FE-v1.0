"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  color?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  color = "primary",
  delay = 0 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-6 backdrop-blur-md transition-all hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        
        <div className={`rounded-2xl bg-${color}/10 p-3 text-${color} border border-${color}/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="size-6" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend.isUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {trend.isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trend.value}%
          </div>
        )}
        <p className="text-[11px] font-medium text-muted-foreground/60">
          {description}
        </p>
      </div>

      {/* Subtle background glow */}
      <div className={`absolute -right-4 -top-4 size-24 rounded-full bg-${color}/5 blur-3xl transition-all group-hover:bg-${color}/10`} />
    </motion.div>
  );
}
