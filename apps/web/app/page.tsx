"use client";

import Link from "next/link";
import { motion, Variants} from "framer-motion";
import dynamic from "next/dynamic";
import { useInView } from "react-intersection-observer";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { 
  Users, Calendar, ArrowRight, CheckCircle2, 
  XCircle, Briefcase, FileText, MessageSquare, LayoutDashboard, 
  Mail, Video, Slack, Linkedin, BrainCircuit, Database, ShieldCheck, Zap
} from "lucide-react";
import { ModeToggle } from "../components/theme-toggle";
import { SectionErrorBoundary } from "../components/section-error-boundary";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const SectionLoader = () => (
  <div className="w-full py-32 flex items-center justify-center bg-transparent">
    <div className="w-full max-w-5xl h-64 bg-muted/20 backdrop-blur-md animate-pulse rounded-3xl border border-border/30" />
  </div>
);

const ProductVisual = dynamic(() => import('./sections/productVisualsSection'), { loading: () => <SectionLoader /> });
const PricingSection = dynamic(() => import('./sections/pricingSection'), { loading: () => <SectionLoader /> });

export default function MarketingPage() {
  const { ref, inView } = useInView({ 
    triggerOnce: true, 
    rootMargin: "200px 0px" 
  });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      
      {/* --- Ambient Glassmorphism Background --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/20 blur-[150px] opacity-50" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-primary/5 blur-[100px] opacity-50" />
      </div>

      {/* 1. Navbar - Floating & Glassy */}
      <header className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between px-6 rounded-2xl bg-background/40 backdrop-blur-2xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 hover:cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="size-10 flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="AgentsFactory HRM Logo" 
                className="size-7" 
              />
            </div>
            <span className="font-bold text-lg tracking-wide">AgentsFactory HRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-foreground transition-colors hover:cursor-pointer">Platform Features</a>
            <a href="#architecture" onClick={(e) => scrollToSection(e, 'architecture')} className="hover:text-foreground transition-colors hover:cursor-pointer">Enterprise Security</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-foreground transition-colors hover:cursor-pointer">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link href="/login" className="hover:cursor-pointer">
              <Button variant="ghost" className="hover:cursor-pointer text-sm h-9 px-4">Log in</Button>
            </Link>
            <Link href="/signup" className="hover:cursor-pointer">
              <Button className="hover:cursor-pointer rounded-full h-9 px-5 text-sm shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)]">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* 2. Hero Section */}
        <section className="container mx-auto px-4 pt-32 pb-20 text-center flex flex-col items-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            
            {/* Glassy Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border border-primary/20 px-3 py-1 text-sm font-semibold transition-colors bg-primary/10 backdrop-blur-md text-primary mb-8 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]">
              <Zap className="size-4 mr-2" /> Powered by Azure OpenAI
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl mb-6 leading-tight">
              Intelligent Recruitment for the <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Modern Enterprise.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Automate resume parsing, generate deep AI-driven candidate dossiers, and let our two-phase shortlisting engine find your optimal hires effortlessly.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup" className="hover:cursor-pointer">
                <Button size="lg" className="h-14 px-8 text-base rounded-full hover:cursor-pointer shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)] transition-shadow hover:shadow-[0_0_40px_-5px_rgba(var(--primary),0.7)]">
                  Start 24-Hour Free Trial <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. Product Visual */}
        <div className="relative z-20">
          <SectionErrorBoundary sectionName="Product Visual">
            <ProductVisual />
          </SectionErrorBoundary>
        </div>

        {/* 4. Problem & Solution Section */}
        <section className="py-32 container mx-auto px-4 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row items-stretch gap-8 max-w-7xl mx-auto"
          >
            {/* Glassy Problem Card */}
            <motion.div variants={fadeInUp} className="flex-1 space-y-6 bg-destructive/5 backdrop-blur-2xl p-10 rounded-[2rem] border border-destructive/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/10 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
              <h2 className="text-3xl font-bold relative z-10">Manual screening breaks at scale.</h2>
              <p className="text-muted-foreground relative z-10 text-lg">Relying on keyword searches and manual resume reviews leads to missed talent, duplicate entries, and recruiter burnout.</p>
              <ul className="space-y-5 pt-4 relative z-10">
                {['Resumes scattered and re-uploaded constantly', 'Superficial keyword matching misses true potential', 'Inconsistent evaluation across hiring managers'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="size-6 text-destructive shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Glassy Solution Card */}
            <motion.div variants={fadeInUp} className="flex-1 space-y-6 bg-primary/10 backdrop-blur-2xl p-10 rounded-[2rem] border border-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
              <h2 className="text-3xl font-bold relative z-10">Upload once. Match endlessly.</h2>
              <p className="text-muted-foreground relative z-10 text-lg">Our centralized Resume Bank deduplicates candidates automatically, while our AI pipeline handles the heavy analytical lifting.</p>
              <ul className="space-y-5 pt-4 relative z-10">
                {['Persistent Resume Bank with automatic deduplication', 'AI extracts structured JSON data from Markdown files', 'Two-phase fuzzy logic and deep contextual shortlisting'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="size-6 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* 5. Key Features Section */}
        <section id="features" className="py-32 relative z-10">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <div className="text-center mb-20">
                <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">The Next Generation of Hiring</motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  AgentsFactory HRM replaces manual data entry with intelligent, automated analysis at every stage of the recruitment pipeline.
                </motion.p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Centralized Resume Bank", icon: Database, desc: "A tenant-scoped repository that automatically deduplicates candidates via email. Upload a resume once, and keep them in your talent pool forever." },
                  { title: "Markdown AI Parsing", icon: FileText, desc: "Raw resumes are instantly converted to clean Markdown, allowing our GPT-4.1 Mini pipeline to extract flawless structured JSON data." },
                  { title: "Deep Personal Dossiers", icon: BrainCircuit, desc: "Move beyond the resume. Our Advanced Mode cross-references GitHub and LinkedIn to generate comprehensive, interpretive candidate profiles." },
                  { title: "Two-Phase Shortlisting", icon: Users, desc: "Instantly filter thousands of candidates with fast Fuzzy JSON Matching, followed by Deep AI Evaluation to classify 'Optimal Fit' or 'Overfit'." }
                ].map((feature, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    {/* Glassy Feature Cards */}
                    <Card className="h-full bg-card/20 backdrop-blur-xl border-border/40 hover:bg-card/40 transition-all duration-300 rounded-3xl overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader className="relative z-10 pb-4">
                        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                          <feature.icon className="size-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <CardDescription className="text-base text-foreground/70 leading-relaxed">
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

        {/* 6. Enterprise Architecture Section */}
        <section id="architecture" className="py-32 container mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto bg-muted/10 backdrop-blur-3xl border border-border/30 rounded-[3rem] p-12 md:p-20 relative overflow-hidden"
          >
            {/* Inner ambient glow for the architecture section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <ShieldCheck className="size-20 text-primary mx-auto mb-8 relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight relative z-10">Enterprise-Grade Tenant Isolation</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground text-xl mb-14 max-w-3xl mx-auto relative z-10 leading-relaxed">
              Security isn't an afterthought. From day one, your data is protected by strict Schema-per-Tenant isolation and Role-Based Access Control (RBAC) powered by Keycloak.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 relative z-10">
              {[
                "Logical Database Isolation", 
                "Role-Based Access Control", 
                "SSO & Local Auth", 
                "Immutable Ledger Billing",
                "Subdomain Routing",
                "Azure Cloud Infrastructure"
              ].map((tool) => (
                <div key={tool} className="flex items-center gap-3 px-6 py-3.5 bg-background/50 backdrop-blur-md border border-border/40 rounded-full shadow-sm hover:border-primary/50 transition-colors cursor-default">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span className="font-semibold text-foreground/90">{tool}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* 7. Pricing Preview */}
        <div ref={ref} id="pricing" className="min-h-[600px] relative z-10">
          {inView && (
            <SectionErrorBoundary sectionName="Pricing">
              <PricingSection />
            </SectionErrorBoundary>
          )}
        </div>

        {/* 8. Final CTA Section */}
        <section className="container mx-auto px-4 py-32 relative z-10">
          <div className="bg-primary/90 backdrop-blur-2xl border border-primary/40 rounded-[3rem] p-16 md:p-24 text-center flex flex-col items-center relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(var(--primary),0.4)]">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-background/20 blur-[120px] rounded-full pointer-events-none" />
            
            <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-8 tracking-tight relative z-10">Ready to provision your workspace?</h2>
            <p className="text-primary-foreground/90 text-xl max-w-3xl mb-12 relative z-10 leading-relaxed">
              Experience the power of automated candidate screening and dossier generation. Our self-serve pipeline provisions your dedicated schema in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 relative z-10">
              <Link href="/signup" className="hover:cursor-pointer">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full hover:cursor-pointer shadow-xl hover:scale-105 transition-transform">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-border/40 bg-background/40 backdrop-blur-xl pt-16 pb-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center font-bold text-foreground hover:cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
              <div className="size-10 flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="AgentsFactory HRM Logo" 
                  className="size-7" 
                />
              </div>
              AgentsFactory HRM
            </div>
            <p>© {new Date().getFullYear()} AgentsFactory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}