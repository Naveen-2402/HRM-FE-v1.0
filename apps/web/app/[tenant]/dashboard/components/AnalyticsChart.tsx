"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

interface ChartProps {
  type: "area" | "bar" | "pie";
  data: any[];
  height?: number;
  dataKey: string;
  categoryKey: string;
  colors?: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-extrabold text-foreground">
          {payload[0].value} <span className="text-[10px] font-medium text-muted-foreground">candidates</span>
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ type, data, height = 300, dataKey, categoryKey, colors = ["#6366f1", "#8b5cf6", "#ec4899"] }: ChartProps) {
  if (type === "area") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey={categoryKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "pie") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={dataKey}
              nameKey={categoryKey}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
