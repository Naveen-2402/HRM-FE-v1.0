"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

export default function productVisualsSection() {
  return (
    <section className="container mx-auto px-4 pb-16 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="w-full max-w-5xl rounded-xl border bg-card p-4 shadow-2xl"
          >
            {/* Mockup of a Kanban Board */}
            <div className="rounded-lg bg-background border border-border/50 p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2"><LayoutDashboard className="size-5 text-primary"/> Senior Frontend Engineer</h3>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20"></div>
                  <div className="h-8 w-8 rounded-full bg-primary/40"></div>
                  <Button size="sm">Add Candidate</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="bg-muted/30 rounded-lg p-4 min-h-[300px]">
                  <h4 className="font-medium mb-4 text-sm text-muted-foreground flex justify-between">Applied <span className="bg-muted px-2 rounded text-xs">12</span></h4>
                  <Card className="mb-3 shadow-sm"><CardHeader className="p-4"><CardTitle className="text-sm">Sarah Jenkins</CardTitle><CardDescription className="text-xs">Stripe • 4y exp</CardDescription></CardHeader></Card>
                  <Card className="mb-3 shadow-sm"><CardHeader className="p-4"><CardTitle className="text-sm">David Chen</CardTitle><CardDescription className="text-xs">Google • 6y exp</CardDescription></CardHeader></Card>
                </div>
                {/* Column 2 */}
                <div className="bg-muted/30 rounded-lg p-4 min-h-[300px]">
                  <h4 className="font-medium mb-4 text-sm text-muted-foreground flex justify-between">Interviewing <span className="bg-muted px-2 rounded text-xs">4</span></h4>
                  <Card className="mb-3 shadow-sm border-primary/50"><CardHeader className="p-4"><CardTitle className="text-sm">Emily Rodriguez</CardTitle><CardDescription className="text-xs">Technical Round at 2 PM</CardDescription></CardHeader></Card>
                </div>
                {/* Column 3 */}
                <div className="bg-muted/30 rounded-lg p-4 min-h-[300px]">
                  <h4 className="font-medium mb-4 text-sm text-muted-foreground flex justify-between">Offer Extended <span className="bg-muted px-2 rounded text-xs">1</span></h4>
                  <Card className="mb-3 shadow-sm bg-primary/5"><CardHeader className="p-4"><CardTitle className="text-sm">Marcus Johnson</CardTitle><CardDescription className="text-xs text-primary font-medium">Offer sent yesterday</CardDescription></CardHeader></Card>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
  )
}
