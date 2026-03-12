"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/ui/card";
import { 
  Users, Calendar, BarChart3, ArrowRight, CheckCircle2, 
  XCircle, Briefcase, FileText, MessageSquare, LayoutDashboard, 
  Mail, Video, Slack, Linkedin 
} from "lucide-react";
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
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Offset by roughly the height of the sticky navbar (64px)
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">HRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-muted-foreground">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-foreground transition-colors cursor-pointer">Features</a>
            <a href="#integrations" onClick={(e) => scrollToSection(e, 'integrations')} className="hover:text-foreground transition-colors cursor-pointer">Integrations</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-foreground transition-colors cursor-pointer">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* 2. Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16 text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-8 cursor-default">
              🚀 The #1 Rated ATS for Growth
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6">
              Hire faster with a modern ATS <br className="hidden md:block" />
              <span className="text-primary">built for growing teams.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mb-10">
              Post jobs, track candidates, run interviews, and onboard employees — all from one intuitive platform.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Free Trial <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Book Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. Product Visual (Moved up slightly for impact) */}
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

        {/* 4. Trusted By */}
        <section className="border-y bg-muted/20 py-10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-6">Built for startups, scaleups, and modern enterprises</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
              <span className="font-bold text-xl tracking-tighter">Acme Corp</span>
              <span className="font-bold text-xl tracking-tighter">Globex</span>
              <span className="font-bold text-xl tracking-tighter">Soylent</span>
              <span className="font-bold text-xl tracking-tighter">Initech</span>
              <span className="font-bold text-xl tracking-tighter">Umbrella</span>
            </div>
          </div>
        </section>

        {/* 5 & 6. Problem & Solution Section */}
        <section className="py-24 container mx-auto px-4 overflow-hidden">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            {/* Problem */}
            <motion.div variants={fadeInUp} className="flex-1 space-y-6 bg-red-50/50 dark:bg-red-950/10 p-8 rounded-2xl border border-red-100 dark:border-red-900/30">
              <h2 className="text-3xl font-bold">Hiring shouldn't be chaotic.</h2>
              <p className="text-muted-foreground">Spreadsheets, scattered email threads, and manual tracking lead to lost talent and burnt-out teams.</p>
              <ul className="space-y-4 pt-4">
                {['Resumes scattered across folders', 'Hard to track interview stages', 'Slow, uncoordinated hiring decisions'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <XCircle className="size-5 text-red-500" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Solution */}
            <motion.div variants={fadeInUp} className="flex-1 space-y-6 bg-primary/5 p-8 rounded-2xl border border-primary/10">
              <h2 className="text-3xl font-bold">A hiring workflow that actually works.</h2>
              <p className="text-muted-foreground">Bring your entire hiring process into one collaborative, automated, and easy-to-use workspace.</p>
              <ul className="space-y-4 pt-4">
                {['Create jobs and build pipelines instantly', 'Track candidates visually', 'Collaborate seamlessly with hiring managers'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* 7. Key Features Section */}
        <section id="features" className="bg-muted/30 py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <div className="text-center mb-16">
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">Everything you need to scale your team</motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Powerful features designed specifically to streamline your recruitment lifecycle from sourcing to onboarding.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Candidate Pipeline", icon: LayoutDashboard, desc: "Visual drag-and-drop Kanban boards to track candidates across custom hiring stages." },
                  { title: "Interview Scheduling", icon: Calendar, desc: "Two-way calendar sync to find availability and book interviews without the back-and-forth." },
                  { title: "Resume Parsing", icon: FileText, desc: "Automatically extract key skills, experience, and contact info from uploaded resumes." },
                  { title: "Team Collaboration", icon: MessageSquare, desc: "Leave private notes, scorecards, and @mention teammates directly on candidate profiles." }
                ].map((feature, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full hover:shadow-md transition-shadow">
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

        {/* 8. Integrations Section */}
        <section id="integrations" className="py-24 container mx-auto px-4 text-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">Connect with tools your team already uses</motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground text-lg mb-12">
              We play nice with your existing tech stack to keep your workflows perfectly synced.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
              {/* Integration Pills */}
              {[
                { name: "Slack", icon: Slack },
                { name: "Google Calendar", icon: Calendar },
                { name: "Zoom", icon: Video },
                { name: "Gmail", icon: Mail },
                { name: "Microsoft Teams", icon: Users },
                { name: "LinkedIn", icon: Linkedin }
              ].map((tool) => (
                <div key={tool.name} className="flex items-center gap-3 px-6 py-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <tool.icon className="size-6 text-foreground" />
                  <span className="font-semibold">{tool.name}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* 9. Pricing Preview */}
        <section id="pricing" className="bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground text-lg">Start for free, upgrade when you need more power.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Perfect for small teams</CardDescription>
                  <div className="text-4xl font-bold pt-4">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Up to 3 active jobs</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Basic pipeline management</p>
                </CardContent>
                <CardFooter><Button variant="outline" className="w-full">Get Started</Button></CardFooter>
              </Card>

              <Card className="border-primary relative shadow-xl md:scale-105 z-10 bg-background">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle>Growth</CardTitle>
                  <CardDescription>For scaling companies</CardDescription>
                  <div className="text-4xl font-bold pt-4">$99<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Unlimited active jobs</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Automated scheduling</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Custom pipelines</p>
                </CardContent>
                <CardFooter><Button className="w-full">Start Free Trial</Button></CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Advanced needs & security</CardDescription>
                  <div className="text-4xl font-bold pt-4">Custom</div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> SSO & Advanced Security</p>
                  <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary"/> Dedicated Account Manager</p>
                </CardContent>
                <CardFooter><Button variant="outline" className="w-full">Contact Sales</Button></CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* 10. Final CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="bg-primary rounded-3xl p-12 text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">Ready to simplify hiring?</h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mb-10">
              Join thousands of modern teams finding and hiring the best talent faster than ever. Setup takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" className="h-12 px-8 text-base bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-0">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="border-t bg-muted/20 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Briefcase className="size-4" />
              HRM
            </div>
            <p>© {new Date().getFullYear()} HRM Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}