import React, { useState } from "react";
import { Plus, BrainCircuit, Users, ChevronDown, ChevronUp, Clock, Calendar, Users2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown } from "@/components/_shared/Dropdown";
export interface PipelineStageConfig {
  name: string;
  duration?: string;
  time_slots?: string;
  panel_members?: string[];
}

interface Employee {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
}

interface HiringRoundsPipelineBuilderProps {
  stages: any[]; // using any[] to support string (legacy) or PipelineStageConfig
  onChange: (stages: any[]) => void;
  employeesList?: Employee[];
  isCreationMode?: boolean;
}

const AVAILABLE_ROUNDS = [
  { name: "AI Screening", type: "AI Round", colorClass: "bg-blue-500/10 text-blue-500" },
  { name: "AI Interview", type: "AI Round", colorClass: "bg-blue-500/10 text-blue-500" },
  { name: "HR Interview", type: "Human Round", colorClass: "bg-emerald-500/10 text-emerald-500" },
  { name: "Custom Round", type: "Custom", colorClass: "bg-orange-500/10 text-orange-500" }
];

// Map common stage names to icons and colors
const STAGE_METADATA: Record<string, { icon: React.ElementType; color: string }> = {
  "AI Screening": { icon: BrainCircuit, color: "blue-500" },
  "HR Interview": { icon: Users, color: "green-500" },
  "AI Interview": { icon: BrainCircuit, color: "purple-500" },
  "Custom Round": { icon: Users, color: "orange-500" },
};

const getStageMetadata = (stageObj: any) => {
  const stageName = typeof stageObj === 'string' ? stageObj : (stageObj?.name ?? '');
  return STAGE_METADATA[stageName] || { icon: Users, color: "slate-500" };
};

export default function HiringRoundsPipelineBuilder({
  stages,
  onChange,
  employeesList = [],
  isCreationMode = false
}: HiringRoundsPipelineBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleRemove = (index: number) => {
    const updated = stages.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  const handleAdd = () => {
    if (stages.length >= 20) return;
    onChange([...stages, { name: "AI Screening" }]);
  };

  const updateStageField = (index: number, field: keyof PipelineStageConfig, value: any) => {
    const updated = [...stages];
    const currentStage = updated[index];

    if (typeof currentStage === 'string') {
      updated[index] = { name: currentStage, [field]: value };
    } else {
      updated[index] = { ...currentStage, [field]: value };
    }

    onChange(updated);
  };

  const handlePanelMemberToggle = (index: number, memberId: string) => {
    const currentStage = stages[index];
    const members = currentStage?.panel_members || [];

    if (members.includes(memberId)) {
      updateStageField(index, 'panel_members', members.filter((id: string) => id !== memberId));
    } else {
      updateStageField(index, 'panel_members', [...members, memberId]);
    }
  };

  const getStageName = (s: any) => typeof s === 'string' ? s : (s?.name ?? '');

  return (
    <div className="flex flex-col gap-1">
      <label className="text-foreground text-sm font-semibold mb-1">
        Hiring Rounds (Max 20) <span className="text-destructive">*</span>
      </label>

      {/* Pipeline Timeline */}
      <div className="relative flex flex-col">
        <AnimatePresence initial={false}>
          {stages.map((stageObj, idx) => {
            const stageName = getStageName(stageObj);
            const stageData = typeof stageObj === 'string' ? { name: stageObj } : stageObj;
            const meta = getStageMetadata(stageName);
            const Icon = meta.icon;
            const isExpanded = expandedIndex === idx;

            const isAI = stageName === "AI Screening" || stageName === "AI Interview";
            const showPanelMembers = !isAI;

            return (
              <motion.div
                key={`stage-${idx}`}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative"
              >
                {/* Stage Card */}
                <div
                  className={[
                    "relative rounded-xl transition-all duration-200",
                    isExpanded
                      ? "bg-card shadow-sm mb-2"
                      : "bg-card/60 hover:bg-card mb-2",
                  ].join(" ")}
                >
                  {/* Header Row */}
                  <div className="w-full flex items-center gap-3 px-3.5 py-3 group text-left">
                    {/* Step Number */}
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors border ${isExpanded
                        ? `bg-[color:var(--${meta.color})]/15 text-[color:var(--${meta.color})] border-[color:var(--${meta.color})]/25`
                        : "bg-muted/40 text-muted-foreground border-border/50"
                        }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Stage Name Dropdown or Input */}
                    <div className="flex gap-2">
                      <>
                          <div className="w-[350px]">
                            <Dropdown
                              options={AVAILABLE_ROUNDS.map(r => ({
                                label: r.name,
                                value: r.name,
                                icon: <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.colorClass}`}>{r.type}</span>
                              }))}
                              value={AVAILABLE_ROUNDS.some(r => r.name === stageName) ? stageName : "Custom Round"}
                              onChange={(val) => updateStageField(idx, "name", val === "Custom Round" ? "" : val)}
                              placeholder="Select Round"
                              searchable={false}
                            />
                          </div>
                          {!AVAILABLE_ROUNDS.some(r => r.name === stageName) && (
                            <input
                              type="text"
                              value={stageName}
                              onChange={(e) => updateStageField(idx, "name", e.target.value)}
                              placeholder="e.g. Technical Round"
                              autoFocus
                              className="w-[200px] h-10 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:ring-1 focus:ring-ring outline-none"
                            />
                          )}
                        </>
                    </div>


                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Expand/Collapse Chevron Button OR Remove Button */}
                    {!isCreationMode ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(idx)}
                        className="flex items-center justify-center w-8 h-8 shrink-0 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      idx > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="flex items-center justify-center w-8 h-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                          title="Remove Round"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 shrink-0" />
                      )
                    )}
                  </div>

                  {/* Expanded Details Form */}
                  {!isCreationMode && (
                    <AnimatePresence>
                      {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">

                            {/* Duration */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Duration
                              </label>
                              <Dropdown
                                options={[
                                  { label: "15 mins", value: "15 mins" },
                                  { label: "30 mins", value: "30 mins" },
                                  { label: "45 mins", value: "45 mins" },
                                  { label: "1 hour", value: "1 hour" },
                                  { label: "90 mins", value: "90 mins" }
                                ]}
                                value={stageData.duration || ""}
                                onChange={(val) => updateStageField(idx, "duration", val)}
                                placeholder="Select duration..."
                                searchable={false}
                              />
                            </div>

                            {/* Time Slots */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Time Slots
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Mon-Wed Afternoons"
                                value={stageData.time_slots || ""}
                                onChange={(e) => updateStageField(idx, "time_slots", e.target.value)}
                                className="bg-background text-sm text-foreground border border-input rounded-md px-3 py-2 w-full outline-none focus:ring-1 focus:ring-ring"
                              />
                            </div>

                            {/* Panel Members */}
                            {showPanelMembers && (
                              <div className="flex flex-col gap-1.5 md:col-span-2 border border-border/50 rounded-lg p-3 bg-muted/10">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                                  <Users2 className="w-3.5 h-3.5" />
                                  Panel Members
                                </label>

                                <div className="flex flex-wrap gap-2">
                                  {employeesList.map(emp => {
                                    const isSelected = (stageData.panel_members || []).includes(String(emp.id));
                                    return (
                                      <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => handlePanelMemberToggle(idx, String(emp.id))}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${isSelected
                                          ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                                          }`}
                                      >
                                        {emp.first_name} {emp.last_name}
                                      </button>
                                    );
                                  })}
                                  {employeesList.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">No employees available</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              onClick={() => handleRemove(idx)}
                              className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors"
                            >
                              Remove Round
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add New Stage Component */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={stages.length >= 20}
          className="w-full flex items-center justify-center gap-2 bg-muted/30 hover:bg-muted/60 text-foreground border border-dashed border-border p-3 rounded-xl transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {stages.length >= 20 ? "Maximum Rounds Reached (20)" : "Add Round"}
        </button>
      </div>
    </div>
  );
}
