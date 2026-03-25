"use client";

import { motion } from "framer-motion";
import { XCircle, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-xl bg-card text-card-foreground text-center overflow-hidden">
          {/* Top Banner Area */}
          <div className="bg-destructive/10 py-10 flex justify-center border-b border-border/50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <XCircle className="size-20 text-destructive" strokeWidth={1.5} />
            </motion.div>
          </div>
          
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="text-3xl font-extrabold tracking-tight">Payment Cancelled</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-3 leading-relaxed">
              Your checkout process was safely aborted. No charges have been made to your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you experienced a technical issue or have questions about our plans, please reach out to our support team.
            </p>
          </CardContent>
          
          <CardFooter className="pb-8 pt-4 flex flex-col gap-3 px-8">
            <Button 
              onClick={() => router.push("/pricing")}
              className="w-full h-12 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              <ArrowLeft className="mr-2 size-5" /> Return to Pricing Plans
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}