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
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select",
  label,
  disabled = false,
  className = "",
  searchable = true,
  searchPlaceholder = "Search",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <span className={selectedOption ? "font-medium text-foreground" : "text-muted-foreground"}>
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
            className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[10rem] rounded-md border border-border bg-card shadow-lg"
          >
            {searchable && (
              <div className="px-2 pt-2 pb-1 border-b border-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-background text-foreground border border-input rounded px-2 py-1 text-xs focus:ring-1 focus:ring-ring outline-none"
                  onClick={(e) => e.stopPropagation()} // Prevent click from bubbling and closing dropdown
                />
              </div>
            )}
            <div className="max-h-[180px] overflow-y-scroll overscroll-contain custom-scrollbar p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-3 px-2 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
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
                      <div className="flex items-center gap-3 truncate">
                        {option.icon && <span className="text-muted-foreground flex items-center shrink-0 [&>svg]:size-4">{option.icon}</span>}
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