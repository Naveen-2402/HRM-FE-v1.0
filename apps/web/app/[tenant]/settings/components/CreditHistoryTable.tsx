"use client";

import React, { useState, useEffect } from "react";
import { Loader2, History, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { customInstance } from "@repo/orval-config/src/axios-setup";
import { motion, AnimatePresence } from "framer-motion";

export function CreditHistoryTable() {
    const [history, setHistory] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const limit = 10;

    useEffect(() => {
        if (isExpanded) {
            fetchHistory();
        }
    }, [page, isExpanded]);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await customInstance<{ items: any[], total: number }>({
                url: `/api/v1/billing/credits/history?limit=${limit}&offset=${page * limit}`,
                method: "GET",
            });
            setHistory((data as any).items || []);
            setTotal((data as any).total || 0);
        } catch (err: any) {
            console.error("Failed to fetch credit history:", err);
            setError("Failed to load transaction history.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(date);
    };

    const hasNextPage = (page + 1) * limit < total;
    const hasPrevPage = page > 0;

    return (
        <div className="bg-card/45 border border-border/50 rounded-2xl p-0 shadow-sm overflow-hidden">
            {/* Collapsible Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-border/0 data-[expanded=true]:border-border/50"
                data-expanded={isExpanded}
            >
                <div className="flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        Transaction History
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono text-[10px]">
                            {total > 0 ? `${total} records` : "History"}
                        </span>
                    </h3>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                    <span className="text-[10px] font-medium">{isExpanded ? "Hide Details" : "View Details"}</span>
                    <ChevronDown className={`size-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-0 border-t border-border/50">
                            {isLoading && history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="size-6 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading history...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-destructive font-medium">{error}</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchHistory}>
                                        Try Again
                                    </Button>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-16">
                                    <History className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm font-medium">No transactions found.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="divide-y divide-border/50 bg-white/5">
                                        {history.map((tx) => {
                                            const isUsage = tx.transaction_type === "usage" || tx.amount < 0 || tx.transaction_type === "resume_parsing" || tx.transaction_type === "shortlisting";
                                            
                                            // Determine service label
                                            let serviceLabel = "Transaction";
                                            if (tx.service_type) {
                                                serviceLabel = tx.service_type.replace(/_/g, " ");
                                            } else if (tx.transaction_type === "resume_parsing") {
                                                serviceLabel = "Resume Parsing";
                                            } else if (tx.transaction_type === "shortlisting") {
                                                serviceLabel = "Candidate Shortlisting";
                                            } else if (tx.transaction_type === "purchase") {
                                                serviceLabel = "Credit Purchase";
                                            } else if (tx.transaction_type === "interview") {
                                                serviceLabel = "Interview Processing";
                                            }

                                            return (
                                                <div
                                                    key={tx.id}
                                                    className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${isUsage ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                                                            {isUsage ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-foreground capitalize">
                                                                    {tx.transaction_type.replace(/_/g, " ")}
                                                                </p>
                                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                                    {serviceLabel}
                                                                </span>
                                                            </div>
                                                            {tx.description && (
                                                                <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                                                                    {tx.description}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                                                {formatDate(tx.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className={`text-base font-black tracking-tight ${isUsage ? "text-foreground" : "text-success"}`}>
                                                            {isUsage ? "−" : "+"}{Math.abs(tx.amount).toLocaleString()} credits
                                                        </div>
                                                        {tx.balance_after !== undefined && (
                                                            <div className="text-[10px] text-muted-foreground font-medium mt-1">
                                                                Balance: {tx.balance_after.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {(hasPrevPage || hasNextPage) && (
                                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={!hasPrevPage || isLoading}
                                            >
                                                <ChevronLeft className="size-4 mr-1" /> Previous
                                            </Button>
                                            <div className="text-xs text-muted-foreground font-medium">
                                                Page {page + 1} of {Math.ceil(total / limit)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={!hasNextPage || isLoading}
                                            >
                                                Next <ChevronRight className="size-4 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
