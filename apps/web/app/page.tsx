"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Users, Calendar, BarChart3, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { ModeToggle } from "../components/theme-toggle";

// Reusable animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Users className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">HRM Platform</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors cursor-pointer">Features</Link>
            <Link href="#solutions" className="hover:text-foreground transition-colors cursor-pointer">Solutions</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors cursor-pointer">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/login">
              <Button variant="ghost" className="cursor-pointer">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="cursor-pointer">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-32 text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-8 cursor-default">
              🎉 Welcome to the future of HR
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6">
              Make the shift to a simple, <br className="hidden md:block" />
              <span className="text-primary">straightforward HR solution.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mb-10">
              Streamline all your HR processes and deliver exceptional employee experiences with a cloud-based platform that's intuitive, agile, and built for modern teams.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base cursor-pointer">
                  Sign up for free trial <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base cursor-pointer">
                  Request Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Abstract Dashboard Mockup Graphic */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-16 w-full max-w-5xl rounded-xl border bg-card p-2 shadow-2xl"
          >
            <div className="rounded-lg bg-muted aspect-video flex items-center justify-center border border-dashed border-muted-foreground/30">
               <span className="text-muted-foreground font-medium">Dashboard App UI Preview</span>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <div className="text-center mb-16">
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">Core HR management, elevated</motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Boost workplace efficiency with a robust HR system. Simplify your routine processes and manage all your employee information from a single database.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Employee Database", icon: Users, desc: "Centralize all employee data, documents, and history in one secure, easily accessible directory." },
                  { title: "Time & Attendance", icon: Calendar, desc: "Effortlessly track hours, manage leave requests, and automate timesheet approvals." },
                  { title: "Performance Reviews", icon: BarChart3, desc: "Conduct seamless 360-degree feedback, set OKRs, and track employee growth over time." },
                  { title: "Payroll Integration", icon: ShieldCheck, desc: "Connect directly to your favorite payroll providers to ensure accurate and timely compensation." }
                ].map((feature, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <feature.icon className="size-10 text-primary mb-4" />
                        <CardTitle>{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {feature.desc}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value Prop Section */}
        <section className="py-24 container mx-auto px-4 overflow-hidden">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <motion.div variants={fadeInUp} className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Hiring and onboarding made simple.</h2>
              <p className="text-lg text-muted-foreground">
                Great hires are the foundation of successful teams. Identify, attract, and recruit the right talent, and elevate the onboarding experience with personalized workflows.
              </p>
              <ul className="space-y-4 pt-4">
                {['Automated hiring pipelines', 'Offer letters with e-sign', 'Custom onboarding workflows'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Button variant="outline" className="cursor-pointer">Explore Hiring Solutions</Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex-1 w-full"
            >
              <div className="aspect-square rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center p-8">
                 <Card className="w-full shadow-lg">
                   <CardHeader>
                     <CardTitle className="text-lg">Candidate Matches</CardTitle>
                     <CardDescription>AI-powered talent screening</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="h-12 rounded bg-muted/50 animate-pulse"></div>
                     <div className="h-12 rounded bg-muted/50 animate-pulse"></div>
                     <div className="h-12 rounded bg-muted/50 animate-pulse"></div>
                   </CardContent>
                 </Card>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} HRM Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}