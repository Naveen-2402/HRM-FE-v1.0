"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  User,
  Sparkles,
  Inbox
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
    <div className="w-full max-w-md p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-2xl space-y-8 relative">
      
      {/* Decorative top accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

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
              <h2 className="text-2xl font-black text-white">Check Your Inbox!</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                We've sent a verification email to <span className="text-indigo-400">{registeredEmail}</span>. 
                Please click the link inside the email to activate your account.
              </p>
            </div>

            <Button
              onClick={() => router.push(`/${tenant}/candidate/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`)}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all"
            >
              Proceed to Sign In
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">Create Account</h2>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Join our recruitment platform and upload your professional profile.
              </p>
            </div>

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field 
                  name="firstName"
                  validators={{
                    onChange: ({ value }) => validateWith(firstNameSchema)(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Jane"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
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
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-655 size-4" />
                        <Input 
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Doe"
                          className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
 
              <form.Field 
                name="email"
                validators={{
                  onChange: ({ value }) => validateWith(emailSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-660 size-4" />
                      <Input 
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>
 
              <form.Field 
                name="password"
                validators={{
                  onChange: ({ value }) => validateWith(passwordSchema)(value),
                }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-670 size-4" />
                      <Input 
                        id={field.name}
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="pl-10 pr-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <span className="relative px-3 bg-[#0d1527] text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Google Signup Action Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              type="button"
              className="w-full h-11 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-355 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 mb-2 hover:cursor-pointer"
            >
              {googleLoading ? (
                <div className="size-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#ea4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.728 5.728 0 0 1 8.24 12.79a5.728 5.728 0 0 1 5.751-5.73 5.62 5.62 0 0 1 3.914 1.547l3.078-3.079A9.917 9.917 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.523 4.477 10 9.99 10 5.79 0 9.886-4.066 9.886-10 0-.689-.06-1.32-.178-1.715h-11.46z"
                  />
                </svg>
              )}
              Sign Up with Google
            </Button>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 font-semibold space-y-3 pt-4 border-t border-slate-800/80">
              <p>
                Already have an account?{" "}
                <Link 
                  href={`/${tenant}/candidate/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
                >
                  Sign in
                </Link>
              </p>
              <button 
                onClick={() => router.push(`/${tenant}`)}
                className="inline-flex items-center text-slate-500 hover:text-slate-400 font-bold gap-1 mt-2 hover:cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                Back to job board
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function CandidateRegisterPage() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating brand link */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Building className="size-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-300">
          {tenant.toUpperCase()} Portal
        </span>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-semibold">Preparing authentication panel...</p>
        </div>
      }>
        <CandidateRegisterFormContent />
      </Suspense>

    </div>
  );
}
