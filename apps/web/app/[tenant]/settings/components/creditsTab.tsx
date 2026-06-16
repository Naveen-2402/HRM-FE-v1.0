// "use client";

// import React from "react";
// import { Loader2, Coins, Layers, ArrowRight, CheckCircle2, Wallet } from "lucide-react";
// import { toast } from "react-toastify";

// // Imports from your Orval config
// import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
// import { 
//   useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost,
//   useGetCreditBalanceApiV1BillingCreditsGet
// } from "@repo/orval-config/src/api/billing/billing";

// import { Button } from "@repo/ui/components/ui/button";
// import { AccentBar, SectionCard } from "@/components/_shared";

// export default function CreditsTab() {
//   // ── Data Fetching ──
//   const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
//   const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();

//   const plans = (plansData as any) || [];

//   // Safely extract the balance (available = balance - consumed - reserved)
//   const currentBalance = balanceData 
//     ? (balanceData as any).credit_balance - (balanceData as any).consumed_credits - (balanceData as any).reserved_credits
//     : 0;

//   // Filter only products marked as "credits" in their metadata
//   const credits = plans.filter((p: any) => p.metadata?.type === "credits" || p.type === "credits");

//   // Flatten the prices for a clean grid
//   const creditPrices = credits.flatMap((plan: any) =>
//     (plan.prices || []).map((price: any) => ({
//       ...price,
//       planName: plan.name,
//       productId: plan.product_id,
//       metadata: plan.metadata,
//     }))
//   );

//   // ── Checkout Mutation ──
//   const checkoutMutation = useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost();

//   const handleBuyCredits = async (priceId: string) => {
//     try {
//       const response = await checkoutMutation.mutateAsync({
//         data: { price_id: priceId },
//       });

//       // Redirect to the Stripe Checkout URL returned by your backend
//       if (response && response.checkout_url) {
//         window.location.href = response.checkout_url;
//       } else {
//         toast.error("Failed to generate checkout link.");
//       }
//     } catch (error: any) {
//       toast.error(error?.response?.data?.detail || "Failed to initiate checkout.");
//     }
//   };

//   const formatCurrency = (amountInCents: number, currency: string) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: currency.toUpperCase(),
//       minimumFractionDigits: 0,
//     }).format(amountInCents / 100);
//   };

//   return (
//     <div className="space-y-6">

//       {/* ── 1. Current Balance Section ── */}
//       <SectionCard>
//         <AccentBar />
//         <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
//           <div className="space-y-1">
//             <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
//               <Wallet className="size-3.5" /> Workspace Balance
//             </div>

//             {isLoadingBalance ? (
//               <div className="flex items-center gap-3 mt-2 h-[48px]">
//                 <Loader2 className="size-5 animate-spin text-muted-foreground" />
//                 <span className="text-sm text-muted-foreground font-medium">Loading balance...</span>
//               </div>
//             ) : (
//               <h2 className="text-5xl font-extrabold text-foreground tracking-tighter text-tighter mt-1 flex items-baseline gap-3">
//                 {currentBalance.toLocaleString()}
//                 <span className="text-xl font-medium text-muted-foreground tracking-tight">
//                   Credits
//                 </span>
//               </h2>
//             )}
//           </div>
//           <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 hidden sm:block">
//             <span className="text-xs font-bold text-primary uppercase tracking-widest">Active Tier</span>
//           </div>
//         </div>
//       </SectionCard>

//       {/* ── 2. Buy Credits Section ── */}
//       <SectionCard>
//         <div className="border-b border-border px-6 py-5 space-y-0.5">
//           <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-success">
//             <Coins className="size-3" /> Top Up
//           </div>
//           <h2 className="text-base font-semibold text-card-foreground">Buy Credits</h2>
//           <p className="text-sm text-muted-foreground">
//             Purchase one-time credit bundles to power your workspace usage.
//           </p>
//         </div>

//         <div className="p-6">
//           {isLoadingPlans ? (
//             <div className="flex flex-col items-center justify-center gap-3 py-14">
//               <Loader2 className="size-7 animate-spin text-success" />
//               <p className="text-sm text-muted-foreground">Loading available credit packages…</p>
//             </div>
//           ) : creditPrices.length === 0 ? (
//             <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
//               <p className="text-muted-foreground text-sm font-medium">No credit packages are currently available.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {creditPrices.map((price: any) => {
//                 const isProcessing = checkoutMutation.isPending && checkoutMutation.variables?.data?.price_id === price.price_id;

//                 return (
//                   <div 
//                     key={price.price_id} 
//                     className="flex flex-col p-8 rounded-3xl border border-border/50 bg-card/30 shadow-sm hover:border-primary/50 transition-all group"
//                   >
//                     <div className="flex items-center gap-4 mb-8">
//                       <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0 transition-transform group-hover:scale-110">
//                         <Layers className="size-6" />
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-2xl font-bold text-foreground truncate tracking-tight">
//                           {price.metadata?.credits ? `${price.metadata.credits} Credits` : (price.nickname || price.planName)}
//                         </p>
//                         <p className="text-[13px] text-muted-foreground font-medium uppercase tracking-widest">
//                           Bundle
//                         </p>
//                       </div>
//                     </div>

//                     <div className="mt-auto space-y-6">
//                       <div className="space-y-3">
//                         <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
//                           <CheckCircle2 className="size-4 text-primary" /> Instant activation
//                         </div>
//                         <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
//                           <CheckCircle2 className="size-4 text-primary" /> No expiration date
//                         </div>
//                       </div>

//                       <div className="border-t border-border/50 pt-6 mt-4 flex items-center justify-between">
//                         <div>
//                           <p className="text-3xl font-extrabold text-foreground tracking-tighter">
//                             {formatCurrency(price.amount, price.currency)}
//                           </p>
//                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
//                             {price.currency} Total
//                           </p>
//                         </div>
//                           <button
//                             onClick={() => handleBuyCredits(price.price_id)}
//                             disabled={isProcessing}
//                             className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-bold hover:cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
//                           >
//                             {isProcessing ? "Wait..." : "Buy Now"}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </SectionCard>
//     </div>
//   );
// }

// "use client";

// import React from "react";
// import { Loader2, Coins, CheckCircle2, Rocket, Zap, Building2, X, Wallet } from "lucide-react";
// import { toast } from "react-toastify";

// import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
// import {
//   useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost,
//   useGetCreditBalanceApiV1BillingCreditsGet
// } from "@repo/orval-config/src/api/billing/billing";

// export default function CreditsTab() {
//   const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
//   const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();

//   const plans = (plansData as any) || [];

//   const currentBalance = balanceData
//     ? (balanceData as any).credit_balance - (balanceData as any).consumed_credits - (balanceData as any).reserved_credits
//     : 0;

//   // Filter and sort all credit prices
//   const credits = plans.filter((p: any) => p.metadata?.type === "credits" || p.type === "credits");
//   const creditPrices = credits
//     .flatMap((plan: any) =>
//       (plan.prices || []).map((price: any) => ({
//         ...price,
//         planName: plan.name,
//         productId: plan.product_id,
//         metadata: plan.metadata,
//       }))
//     )
//     .sort((a: { amount: number }, b: { amount: number }) => a.amount - b.amount);

//   // ── Smart Tier Selection ──
//   const starterPlan = creditPrices.find((p: any) => parseInt(p.metadata?.credits || "0", 10) <= 499) || creditPrices[0];
//   const growthPlan = creditPrices.find((p: any) => {
//     const c = parseInt(p.metadata?.credits || "0", 10);
//     return c >= 500 && c <= 1000;
//   }) || creditPrices[1] || creditPrices[0];
//   const corporatePlan = creditPrices.find((p: any) => parseInt(p.metadata?.credits || "0", 10) > 1000) || creditPrices[2] || creditPrices[creditPrices.length - 1];

//   const displayPlans = [
//     {
//       id: "starter",
//       data: starterPlan,
//       persona: "Starter Bundle",
//       audience: "For Startups",
//       icon: Rocket,
//       keyFeature: "Essential tools for small teams.",
//       isPopular: false
//     },
//     {
//       id: "growth",
//       data: growthPlan,
//       persona: "Growth Bundle",
//       audience: "For Growing Teams",
//       icon: Zap,
//       keyFeature: "Priority support & best value.",
//       isPopular: true
//     },
//     {
//       id: "corporate",
//       data: corporatePlan,
//       persona: "Corporate Bundle",
//       audience: "For Enterprises",
//       icon: Building2,
//       keyFeature: "Dedicated management & API limits.",
//       isPopular: false
//     },
//   ];

//   // ── Feature Comparison Table Data ──
//   const FEATURES = [
//     { label: "Instant activation", starter: true, growth: true, corporate: true },
//     { label: "No expiration date", starter: true, growth: true, corporate: true },
//     { label: "Priority email support", starter: false, growth: true, corporate: true },
//     { label: "Bonus Credits Included", starter: false, growth: "5%", corporate: "15%" },
//     { label: "24/7 Phone & Email support", starter: false, growth: false, corporate: true },
//     { label: "Dedicated Account Manager", starter: false, growth: false, corporate: true },
//     { label: "Custom API rate limits", starter: false, growth: false, corporate: true },
//   ];

//   const checkoutMutation = useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost();

//   const handleBuyCredits = async (priceId: string) => {
//     if (!priceId) return;
//     try {
//       const response = await checkoutMutation.mutateAsync({
//         data: { price_id: priceId },
//       });
//       if (response && response.checkout_url) {
//         window.location.href = response.checkout_url;
//       } else {
//         toast.error("Failed to generate checkout link.");
//       }
//     } catch (error: any) {
//       toast.error(error?.response?.data?.detail || "Failed to initiate checkout.");
//     }
//   };

//   const formatCurrency = (amountInCents: number, currency: string) => {
//     const formatted = new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: currency.toUpperCase(),
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amountInCents / 100);
//     return formatted.replace(/^([^\d\s]+)(\d)/, '$1 $2');
//   };

//   const renderCell = (val: boolean | string) => {
//     if (typeof val === "string") return <span className="font-bold text-foreground">{val}</span>;
//     if (val) return <CheckCircle2 className="size-5 text-success mx-auto" />;
//     return <X className="size-5 text-destructive mx-auto" />;
//   };

//   return (
//     <div className="w-full">

//       {/* ── Top Row: Header (Left) + Balance (Right) ── */}
//       <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">

//         {/* Left: Titles */}
//         <div className="space-y-1">
//           <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success mb-2">
//             <Coins className="size-3.5" /> Top Up Workspace
//           </div>
//           <h2 className="text-2xl font-bold text-foreground tracking-tight">Buy Credit Bundles</h2>
//           <p className="text-sm text-muted-foreground max-w-xl">
//             Purchase one-time credit bundles to instantly power up your workspace operations.
//           </p>
//         </div>

//         {/* Right: Balance Widget pinned strictly to the top right */}
//         <div className="flex items-center gap-4 p-4 pr-8 rounded-2xl border border-border/60 bg-card shadow-sm shrink-0">
//           <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
//             <Wallet className="size-6" />
//           </div>
//           <div>
//             <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
//               Available Balance
//             </p>
//             {isLoadingBalance ? (
//               <Loader2 className="size-4 animate-spin text-muted-foreground mt-1" />
//             ) : (
//               <div className="flex items-baseline gap-1.5">
//                 <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
//                   {currentBalance.toLocaleString()}
//                 </span>
//                 <span className="text-xs font-semibold text-muted-foreground">Credits</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── Main Content Below ── */}
//       <div>
//         {isLoadingPlans ? (
//           <div className="flex flex-col items-center justify-center gap-3 py-10">
//             <Loader2 className="size-6 animate-spin text-success" />
//             <p className="text-sm text-muted-foreground">Loading available credit packages…</p>
//           </div>
//         ) : creditPrices.length === 0 ? (
//           <div className="text-center py-10 border border-border border-dashed rounded-xl bg-muted/20">
//             <p className="text-muted-foreground text-sm font-medium">No credit packages are currently available.</p>
//           </div>
//         ) : (
//           <div className="space-y-16">

//             {/* ── The 3 Simplified Cards ── */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
//               {displayPlans.map((plan) => {
//                 if (!plan.data) return null;
//                 const isProcessing = checkoutMutation.isPending && checkoutMutation.variables?.data?.price_id === plan.data.price_id;
//                 const creditCount = parseInt(plan.data.metadata?.credits || "0", 10);

//                 return (
//                   <div
//                     key={plan.id}
//                     className={`relative flex flex-col h-full p-6 lg:p-7 rounded-3xl transition-all duration-300 ${plan.isPopular
//                         ? "bg-primary/5 border-2 border-primary shadow-lg lg:scale-105 z-10"
//                         : "bg-card border border-border/60 shadow-sm hover:border-primary/40"
//                       }`}
//                   >
//                     {plan.isPopular && (
//                       <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
//                         <div className="bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-widest py-1 px-3 rounded-full shadow-md">
//                           Most Popular
//                         </div>
//                       </div>
//                     )}

//                     <div className="mb-6">
//                       <div className="flex items-center gap-2.5 mb-4">
//                         <div className={`p-2.5 rounded-xl ${plan.isPopular ? 'bg-primary text-primary-foreground shadow-inner' : 'bg-primary/10 text-primary'}`}>
//                           <plan.icon className="size-5" />
//                         </div>
//                         <div>
//                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
//                             {plan.persona}
//                           </p>
//                         </div>
//                       </div>

//                       <p className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
//                         {plan.data.metadata?.credits ? `${creditCount.toLocaleString()} Credits` : (plan.data.nickname || plan.data.planName)}
//                       </p>
//                     </div>

//                     <div className="mt-auto flex flex-col justify-between flex-1">
//                       <div className="mb-6 py-4 border-y border-border/50">
//                         <p className="text-sm font-medium text-foreground/80">
//                           {plan.keyFeature}
//                         </p>
//                       </div>

//                       <div className="flex flex-col gap-3 mt-auto">
//                         <div>
//                           <p className="text-3xl font-extrabold text-foreground tracking-tight">
//                             {formatCurrency(plan.data.amount, plan.data.currency)}
//                           </p>
//                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
//                             One-Time Payment
//                           </p>
//                         </div>
//                         <button
//                           onClick={() => handleBuyCredits(plan.data.price_id)}
//                           disabled={isProcessing}
//                           className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 mt-2 ${plan.isPopular
//                               ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30"
//                               : "bg-muted text-foreground hover:bg-muted/80 hover:shadow-sm"
//                             }`}
//                         >
//                           {isProcessing ? "Processing..." : "Buy Credits"}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* ── Feature Comparison Table ── */}
//             <div className="pt-8">
//               <div className="mb-6 text-center">
//                 <h3 className="text-2xl font-bold text-foreground tracking-tight">Compare Plan Features</h3>
//                 <p className="text-sm text-muted-foreground mt-1">See exactly what is included in each bundle.</p>
//               </div>

//               <div className="overflow-x-auto rounded-2xl border border-border bg-card">
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr>
//                       <th className="p-5 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border/60 w-1/3">
//                         Features
//                       </th>
//                       <th className="p-5 text-center font-extrabold text-foreground border-b border-border/60 w-2/9">
//                         Starter
//                       </th>
//                       <th className="p-5 text-center font-extrabold text-primary border-b border-border/60 border-x border-x-primary/20 bg-primary/5 w-2/9 relative">
//                         <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-primary"></div>
//                         Growth
//                       </th>
//                       <th className="p-5 text-center font-extrabold text-foreground border-b border-border/60 w-2/9">
//                         Corporate
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {FEATURES.map((feature, idx) => {
//                       const isLast = idx === FEATURES.length - 1;
//                       return (
//                         <tr key={feature.label} className="group hover:bg-muted/20 transition-colors">
//                           <td className={`p-5 font-medium text-foreground/80 ${!isLast ? 'border-b border-border/40' : ''}`}>
//                             {feature.label}
//                           </td>
//                           <td className={`p-5 text-center ${!isLast ? 'border-b border-border/40' : ''}`}>
//                             {renderCell(feature.starter)}
//                           </td>
//                           <td className={`p-5 text-center border-x border-x-primary/20 bg-primary/5 ${!isLast ? 'border-b border-border/40' : ''}`}>
//                             {renderCell(feature.growth)}
//                           </td>
//                           <td className={`p-5 text-center ${!isLast ? 'border-b border-border/40' : ''}`}>
//                             {renderCell(feature.corporate)}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
"use client";

import React from "react";
import { Loader2, Coins, ArrowUpRight, Sparkles, CreditCard, Activity, Wallet } from "lucide-react";
import { toast } from "react-toastify";

// Imports from your Orval config
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
import {
  useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost,
  useGetCreditBalanceApiV1BillingCreditsGet
} from "@repo/orval-config/src/api/billing/billing";

import { Button } from "@repo/ui/components/ui/button";

export default function CreditsTab() {
  // ── Data Fetching ──
  const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
  const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();

  const plans = (plansData as any) || [];

  // Safely extract the balance
  const currentBalance = balanceData
    ? (balanceData as any).credit_balance - (balanceData as any).consumed_credits - (balanceData as any).reserved_credits
    : 0;

  // Filter only products marked as "credits" in their metadata
  const credits = plans.filter((p: any) => p.metadata?.type === "credits" || p.type === "credits");

  // Flatten the prices and extract API-driven metadata/features
  const creditPrices = credits.flatMap((plan: any) => {
    let apiFeatures: string[] = [];
    if (Array.isArray(plan.features)) {
      apiFeatures = plan.features;
    } else if (plan.metadata?.features) {
      try {
        apiFeatures = typeof plan.metadata.features === "string"
          ? JSON.parse(plan.metadata.features)
          : plan.metadata.features;
      } catch (e) {
        console.error("Failed to parse plan features", e);
      }
    }

    return (plan.prices || []).map((price: any) => ({
      ...price,
      planName: plan.name,
      planDescription: plan.description,
      productId: plan.product_id,
      metadata: plan.metadata,
      features: apiFeatures,
      isHighlighted: plan.metadata?.is_popular === "true" || plan.metadata?.is_popular === true
    }));
  });

  // Sort by price amount safely
  creditPrices.sort((a: any, b: any) => a.amount - b.amount);

  // ── Checkout Mutation ──
  const checkoutMutation = useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost();

  const handleBuyCredits = async (priceId: string) => {
    try {
      const response = await checkoutMutation.mutateAsync({
        data: { price_id: priceId },
      });

      if (response && response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        toast.error("Failed to generate checkout link.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to initiate checkout.");
    }
  };

  const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amountInCents / 100);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-10">

      {/* ── Top Row: Header (Left) + Balance (Right) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 mt-2">
        {/* Left: Titles */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success mb-2">
            <Coins className="size-3.5" /> Top Up Workspace
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Buy Credit Bundles</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Purchase one-time credit bundles to instantly power up your workspace operations.
          </p>
        </div>

        {/* Right: Balance Widget pinned strictly to the top right */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 p-5 pr-8 rounded-2xl border border-border/60 bg-card shadow-sm shrink-0">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                Available Balance
              </p>
              {isLoadingBalance ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground mt-1" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
                    {currentBalance.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Credits</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Plan Status */}
          {(balanceData as any)?.active_plan_name && (
            <div className="text-xs text-muted-foreground pr-2">
              Current base tier: <span className="text-foreground font-semibold">{(balanceData as any).active_plan_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Top-Up List View ── */}
      <section className="space-y-6 mt-4">

        {isLoadingPlans ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : creditPrices.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
            <p className="text-muted-foreground text-sm">No packages available at this time.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creditPrices.map((price: any) => {
              const isProcessing = checkoutMutation.isPending && checkoutMutation.variables?.data?.price_id === price.price_id;
              const isHighlighted = price.isHighlighted;

              return (
                <div
                  key={price.price_id}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 rounded-2xl border transition-all duration-200 ${isHighlighted
                      ? "bg-primary/[0.03] border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
                      : "bg-card/30 border-border/40 hover:bg-card/60 hover:border-border/80"
                    }`}
                >
                  {/* Left Column: Icon & Title */}
                  <div className="flex items-center gap-5 md:w-1/3">
                    <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${isHighlighted ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-foreground"
                      }`}>
                      {isHighlighted ? <Sparkles className="size-5" /> : <CreditCard className="size-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-foreground tracking-tight">
                          {price.metadata?.credits ? `${Number(price.metadata.credits).toLocaleString()} Credits` : (price.nickname || price.planName)}
                        </h4>
                        {isHighlighted && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>
                      {price.planDescription && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {price.planDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: API Features as Inline Pills */}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {price.features && price.features.length > 0 ? (
                      price.features.map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/30 text-xs font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Standard tier benefits</span>
                    )}
                  </div>

                  {/* Right Column: Price & Action */}
                  <div className="flex items-center gap-6 md:justify-end md:w-[250px]">
                    <div className="text-right">
                      <div className="text-2xl font-black text-foreground tracking-tighter">
                        {formatCurrency(price.amount, price.currency)}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBuyCredits(price.price_id)}
                      disabled={isProcessing}
                      variant={isHighlighted ? "default" : "secondary"}
                      className={`shrink-0 rounded-full font-semibold transition-all ${isHighlighted ? "shadow-md hover:shadow-lg" : ""
                        }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>Buy <ArrowUpRight className="ml-1.5 size-4 opacity-70" /></>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}