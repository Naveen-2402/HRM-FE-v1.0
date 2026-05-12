"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

export default function productVisualsSection() {
  return (
    <section className="container tracking-wide mx-auto px-4 pb-16 flex justify-center relative z-10">
      
      {/* Subtle background glow specifically for the mockup */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-[2.5rem] border border-border/30 bg-background/20 backdrop-blur-3xl p-4 md:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group"
      >
        {/* Glass reflection effect */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
        
        {/* Mockup of the AI Shortlisting Pipeline */}
        <div className="rounded-3xl bg-card/10 border border-border/20 p-6 md:p-8 flex flex-col gap-8 backdrop-blur-xl shadow-inner">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/30 pb-6 gap-4">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-3 text-foreground">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BrainCircuit className="size-5 text-primary" />
                </div>
                Senior Frontend Engineer
              </h3>
              <p className="text-sm text-muted-foreground mt-2 font-medium">AI Shortlisting Results • 120 Candidates Evaluated</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="rounded-full h-10 px-5 border-border/40 bg-background/30 backdrop-blur-md hover:bg-muted/30 hover:cursor-pointer transition-colors">
                Regenerate Dossiers
              </Button>
              <Button size="sm" className="rounded-full h-10 px-5 shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)] hover:shadow-[0_0_20px_-3px_rgba(var(--primary),0.6)] hover:cursor-pointer transition-all">
                Review Final Shortlist
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 */}
            <div className="bg-background/20 backdrop-blur-md border border-border/30 rounded-2xl p-5 min-h-[320px] flex flex-col">
              <h4 className="font-semibold mb-5 text-sm text-muted-foreground flex justify-between items-center">
                Phase 1: Fuzzy Match 
                <span className="bg-background/50 text-foreground px-2.5 py-1 rounded-full text-xs border border-border/40 shadow-sm">45</span>
              </h4>
              <Card className="mb-4 shadow-sm border-border/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardHeader className="p-5">
                  <CardTitle className="text-base text-foreground">Alex Mercer</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">Skills overlap: 85% • Exp: 5y</CardDescription>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="size-4 text-success" /> Passed initial filter
                  </div>
                </CardHeader>
              </Card>
            </div>
            
            {/* Column 2 */}
            <div className="bg-primary/5 backdrop-blur-md border border-primary/20 rounded-2xl p-5 min-h-[320px] relative overflow-hidden flex flex-col shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)]">
              {/* Inner ambient glow for the primary column */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/10 blur-[40px] pointer-events-none -z-10" />
              
              <h4 className="font-semibold mb-5 text-sm text-primary flex justify-between items-center">
                Phase 2: AI Dossier Match 
                <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs shadow-sm">12</span>
              </h4>
              <Card className="mb-4 shadow-md border-primary/30 backdrop-blur-md bg-card/70 transition-colors">
                <CardHeader className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-base text-foreground">Emily Rodriguez</CardTitle>
                    <span className="bg-success text-success-foreground text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wide shadow-sm">Optimal Fit</span>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground font-medium">Score: 92/100</CardDescription>
                  <div className="mt-4 text-xs bg-background/40 backdrop-blur-md p-3 rounded-xl border border-border/30 text-foreground/90 leading-relaxed shadow-inner">
                    <strong className="text-primary font-semibold mr-1">AI Reasoning:</strong> Strong alignment in React/Next.js. Advanced mode verified consistent GitHub contributions.
                  </div>
                </CardHeader>
              </Card>
            </div>
            
            {/* Column 3 */}
            <div className="bg-background/20 backdrop-blur-md border border-border/30 rounded-2xl p-5 min-h-[320px] flex flex-col">
              <h4 className="font-semibold mb-5 text-sm text-muted-foreground flex justify-between items-center">
                Requires Manual Review 
                <span className="bg-background/50 text-foreground px-2.5 py-1 rounded-full text-xs border border-border/40 shadow-sm">3</span>
              </h4>
              <Card className="mb-4 shadow-sm border-border/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardHeader className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-base text-foreground">David Chen</CardTitle>
                    <span className="bg-warning text-warning-foreground text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wide shadow-sm">Overfit</span>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground font-medium">Score: 78/100</CardDescription>
                  <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <AlertCircle className="size-4 text-warning mt-0.5 shrink-0" /> 
                    <span>Exceeds role significantly. High flight risk based on trajectory.</span>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}