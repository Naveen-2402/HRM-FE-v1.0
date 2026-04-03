"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected option (safely handles empty strings)
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          disabled
            ? "cursor-not-allowed opacity-50 border-border bg-muted/50 text-muted-foreground"
            : "cursor-pointer border-input bg-background hover:bg-muted/10 text-foreground",
          isOpen ? "ring-1 ring-ring border-ring" : ""
        ].join(" ")}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="text-muted-foreground">{selectedOption.icon}</span>}
          <span className="font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[10rem] overflow-hidden rounded-md border border-border bg-card shadow-lg"
          >
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {options.length === 0 ? (
                <div className="py-3 px-2 text-center text-sm text-muted-foreground">
                  No options
                </div>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={[
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors",
                        "hover:bg-muted text-foreground",
                        isSelected ? "bg-muted/80 font-semibold" : "font-medium"
                      ].join(" ")}
                    >
                      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                        {isSelected && <Check className="size-4 text-primary" />}
                      </span>
                      <div className="flex items-center gap-2 truncate">
                        {option.icon && <span className="text-muted-foreground size-4">{option.icon}</span>}
                        <span className="truncate">{option.label}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}