"use client";

import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const parsedDate = value ? new Date(value) : undefined;

  // Time state
  const [hours, setHours] = useState(parsedDate ? parsedDate.getHours() : 12);
  const [minutes, setMinutes] = useState(parsedDate ? parsedDate.getMinutes() : 0);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: "hours" | "minutes", val: number) => {
    const newDate = parsedDate ? new Date(parsedDate) : new Date();
    if (type === "hours") {
      setHours(val);
      newDate.setHours(val);
    } else {
      setMinutes(val);
      newDate.setMinutes(val);
    }
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate.toISOString());
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={[
            "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors text-left",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            disabled
              ? "cursor-not-allowed opacity-50 border-border bg-muted/50 text-muted-foreground"
              : "cursor-pointer border-input bg-background hover:bg-muted/10 text-foreground",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className={parsedDate ? "text-foreground font-medium" : "text-muted-foreground"}>
              {parsedDate ? format(parsedDate, "PPP p") : placeholder}
            </span>
          </div>
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="z-50 w-auto rounded-md border border-border bg-card p-3 shadow-md outline-none animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <div className="flex flex-col gap-4">
          <DayPicker
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            className="m-0"
          />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>Time</span>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={hours}
                onChange={(e) => handleTimeChange("hours", parseInt(e.target.value))}
                className="bg-background text-foreground border border-input rounded px-1.5 py-1 text-xs outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground">:</span>
              <select
                value={minutes}
                onChange={(e) => handleTimeChange("minutes", parseInt(e.target.value))}
                className="bg-background text-foreground border border-input rounded px-1.5 py-1 text-xs outline-none"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const val = i * 5;
                  return (
                    <option key={val} value={val}>
                      {val.toString().padStart(2, "0")}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
