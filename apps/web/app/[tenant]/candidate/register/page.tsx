"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Sparkles,
  Inbox,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { validateWith } from "@repo/ui/lib/validators";
import {
  useCandidateRegisterApiV1CandidateAuthRegisterPost,
  candidateGoogleLoginUrlApiV1CandidateAuthGoogleLoginUrlGet
} from "@repo/orval-config/src/api/auth/candidate-auth/candidate-auth";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "react-toastify";

// Define Zod register validation schemas
const firstNameSchema = z.string().min(1, "First name is required");
const lastNameSchema = z.string().min(1, "Last name is required");
const emailSchema = z.string().min(1, "Email is required").email("Invalid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters long");

const registerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

type RegisterFields = z.infer<typeof registerSchema>;

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

function CandidateRegisterFormContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;
  const redirectUrl = searchParams.get("redirect");

  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const registerMutation = useCandidateRegisterApiV1CandidateAuthRegisterPost();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    } as RegisterFields,
    onSubmit: async ({ value }) => {
      try {
        await registerMutation.mutateAsync({
          data: {
            email: value.email,
            password: value.password,
            first_name: value.firstName,
            last_name: value.lastName,
          }
        });

        setRegisteredEmail(value.email);
        setRegistered(true);
        toast.success("Account created successfully!");
      } catch (err: any) {
        console.error("Candidate registration error:", err);
        const msg = err?.response?.data?.detail || "Registration failed. Please try again.";
        toast.error(msg);
      }
    },
  });

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const response = (await candidateGoogleLoginUrlApiV1CandidateAuthGoogleLoginUrlGet({
        redirect_uri: `${window.location.origin}/candidate/callback`
      })) as any;

      const data = response.data || response;
      const loginUrl = data.login_url;

      if (loginUrl) {
        window.location.href = loginUrl;
      } else {
        throw new Error("Google Redirect URL was not returned by API Gateway.");
      }
    } catch (err: any) {
      console.error("Google Registration initialization failed:", err);
      toast.error("Google Sign-In is currently offline.");
      setGoogleLoading(false);
    }
  };

  const loading = registerMutation.isPending;

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {registered ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 py-6"
          >
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Inbox className="size-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Check Your Inbox!</h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                We've sent a verification email to <span className="text-indigo-400 font-bold">{registeredEmail}</span>.
                Please click the link inside the email to activate your account.
              </p>
            </div>

            <Button
              onClick={() => router.push(`/${tenant}/candidate/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`)}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all mt-4"
            >
              Proceed to Sign In
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-2">
                <Sparkles className="size-3.5" /> Start Your Journey
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Create an account
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                Join our recruitment platform and unlock exclusive career opportunities.
              </p>
            </motion.div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-5"
            >
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <form.Field
                  name="firstName"
                  validators={{
                    onChange: ({ value }) => validateWith(firstNameSchema)(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-300 ml-1">First Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Jane"
                          className="pl-11 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="lastName"
                  validators={{
                    onChange: ({ value }) => validateWith(lastNameSchema)(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-300 ml-1">Last Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Doe"
                          className="pl-11 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div variants={itemVariants}>
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => validateWith(emailSchema)(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-300 ml-1">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-11 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div variants={itemVariants}>
                <form.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => validateWith(passwordSchema)(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-300 ml-1">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showPassword ? "text" : "password"}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="pl-11 pr-12 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-4 bg-slate-950 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest">
                Or continue with
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                type="button"
                variant="outline"
                className="w-full h-12 bg-transparent hover:bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3"
              >
                {googleLoading ? (
                  <div className="size-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
                ) : (
                  <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#ea4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.728 5.728 0 0 1 8.24 12.79a5.728 5.728 0 0 1 5.751-5.73 5.62 5.62 0 0 1 3.914 1.547l3.078-3.079A9.917 9.917 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.523 4.477 10 9.99 10 5.79 0 9.886-4.066 9.886-10 0-.689-.06-1.32-.178-1.715h-11.46z"
                    />
                  </svg>
                )}
                Sign Up with Google
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center pt-4">
              <p className="text-sm text-slate-400 font-medium">
                Already have an account?{" "}
                <Link
                  href={`/${tenant}/candidate/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold underline decoration-indigo-400/30 underline-offset-4 hover:decoration-indigo-400"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CandidateRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-indigo-500/30">

      {/* Left Panel - Branding & Visuals (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-800 items-center justify-center p-12">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />

        {/* Floating elements animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-lg space-y-8"
        >
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
            <Building className="size-8 text-indigo-400" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
            Elevate your potential with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{tenant.toUpperCase()}</span>
          </h1>

          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Create your comprehensive talent profile once. Apply to exclusive opportunities and let our smart algorithms do the matching.
          </p>

          <div className="pt-8 flex items-center gap-4 text-sm font-semibold text-slate-500">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`size-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center z-[${5 - i}]`}>
                  <UserCheck className="size-4 text-slate-400" />
                </div>
              ))}
            </div>
            <p>Join thousands of growing professionals</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="flex-1 flex flex-col relative">

        {/* Mobile Header / Top Navigation */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building className="size-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-300">
              {tenant.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => router.push(`/${tenant}`)}
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors gap-1.5 ml-auto cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Back to job board
          </button>
        </div>

        {/* Form Centering Wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 mt-12 lg:mt-0 overflow-y-auto">
          <Suspense fallback={
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Loading secure environment...</p>
            </div>
          }>
            <CandidateRegisterFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 