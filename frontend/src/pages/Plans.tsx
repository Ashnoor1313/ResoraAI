import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Award, 
  CreditCard, 
  Sparkles, 
  Building, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  RefreshCw
} from 'lucide-react';

interface PlansProps {
  token?: string;
  backendUrl?: string;
  onAlert?: (msg: string) => void;
}

export default function Plans({ token, backendUrl = 'http://127.0.0.1:8000', onAlert }: PlansProps) {
  const [activePlan, setActivePlan] = useState<string>(() => {
    return localStorage.getItem("resumeiq_plan") || "Free";
  });
  const [planUpdatedAt, setPlanUpdatedAt] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('Alex Morgan');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [processingMsg, setProcessingMsg] = useState('Connecting to secure sandbox gateway...');
  const [upgradeError, setUpgradeError] = useState('');

  // Downgrade Modal State
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgrading, setDowngrading] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!token || token === 'mock-token' || token === 'undefined') return;
      try {
        setLoadingInitial(true);
        const res = await fetch(`${backendUrl}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const serverPlan = data.plan || "Free";
          setActivePlan(serverPlan);
          setPlanUpdatedAt(data.plan_updated_at || null);
          localStorage.setItem("resumeiq_plan", serverPlan);
          window.dispatchEvent(new CustomEvent("resumeiq:plan_changed", { detail: serverPlan }));
        }
      } catch (err) {
        console.error("Error fetching user plan:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchCurrentPlan();

    // Listen for custom plan change events
    const handlePlanChange = (e: any) => {
      if (e.detail) {
        setActivePlan(e.detail);
      }
    };
    window.addEventListener('resumeiq:plan_changed', handlePlanChange);
    return () => window.removeEventListener('resumeiq:plan_changed', handlePlanChange);
  }, [token, backendUrl]);

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      desc: "Perfect for initial resume compatibility audits and baseline ATS checks.",
      features: [
        "1 Resume scan parsing check",
        "Deterministic ATS compatibility score",
        "Standard keyword density review",
        "Layout formatting audit summary",
        "Core profile export preview"
      ],
      icon: Award,
      badge: null,
    },
    {
      name: "Pro",
      price: billingCycle === 'monthly' ? "₹299" : "₹2,999",
      period: billingCycle === 'monthly' ? "monthly" : "yearly",
      desc: "Unlock limitless scans, elite FAANG recruiter rubrics, and STAR behavioral interview prep.",
      features: [
        "Unlimited resume scan versions",
        "Full AI Recruiter feedback (Google, Amazon, Meta, Startup)",
        "Advanced Job Description semantic matching",
        "Unlimited AI bullet points optimizations (Google XYZ formula)",
        "STAR Interview Coach behavioral scripts & scenarios",
        "Complete LinkedIn Profile audit & headline generator",
        "Tailored Cover Letter & Outreach message generator",
        "Priority ATS parser rendering"
      ],
      icon: Sparkles,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "annual",
      desc: "Tailored recruiter compliance rubrics for corporate talent teams, bootcamps, and universities.",
      features: [
        "Custom company-specific recruiter rubrics",
        "Volume parsing scanning API support",
        "Team dashboards & role benchmarks admin",
        "Dedicated corporate template guidelines",
        "24/7 Priority support & custom onboarding"
      ],
      icon: Building,
      badge: "Team",
    }
  ];

  const handleOpenUpgrade = () => {
    setUpgradeError('');
    setCheckoutStep('details');
    setShowUpgradeModal(true);
  };

  const handleFillDemoCard = () => {
    setCardNumber('4242 •••• •••• 4242');
    setCardHolder('Alex Morgan');
    setExpiry('08/29');
    setCvc('731');
  };

  const handleProcessUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError('');
    setCheckoutStep('processing');
    setProcessingMsg('Connecting to sandbox gateway...');

    const timer1 = setTimeout(() => {
      setProcessingMsg('Authorizing ₹' + (billingCycle === 'monthly' ? '299' : '2,999') + ' sandbox subscription...');
    }, 800);

    const timer2 = setTimeout(() => {
      setProcessingMsg('Activating Resora AI Pro access...');
    }, 1600);

    try {
      if (token && token !== 'mock-token' && token !== 'undefined') {
        const res = await fetch(`${backendUrl}/api/v1/users/me/plan`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan: "Pro" })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to update subscription');
        }
      }

      // Success
      setTimeout(() => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setActivePlan("Pro");
        localStorage.setItem("resumeiq_plan", "Pro");
        window.dispatchEvent(new CustomEvent("resumeiq:plan_changed", { detail: "Pro" }));
        setCheckoutStep('success');
      }, 2400);

    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setCheckoutStep('details');
      setUpgradeError(err.message || 'Payment simulation failed. Please try again.');
    }
  };

  const handleDowngradeToFree = async () => {
    setDowngrading(true);
    try {
      if (token && token !== 'mock-token' && token !== 'undefined') {
        const res = await fetch(`${backendUrl}/api/v1/users/me/plan`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan: "Free" })
        });
        if (!res.ok) {
          throw new Error("Failed to downgrade plan");
        }
      }

      setActivePlan("Free");
      localStorage.setItem("resumeiq_plan", "Free");
      window.dispatchEvent(new CustomEvent("resumeiq:plan_changed", { detail: "Free" }));
      setShowDowngradeModal(false);
      if (onAlert) {
        onAlert("Your account has been switched back to the Free plan.");
      }
    } catch (err: any) {
      alert("Error downgrading plan: " + err.message);
    } finally {
      setDowngrading(false);
    }
  };

  const handleEnterpriseInquiry = () => {
    if (onAlert) {
      onAlert("Enterprise request registered! Our corporate partnerships team will contact you within 24 hours.");
    } else {
      alert("Enterprise request registered! Our corporate partnerships team will contact you within 24 hours.");
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header Info & Plan Status Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between gap-5 items-start md:items-center relative overflow-hidden bg-white/70 dark:bg-[#0b101f]/70 border border-slate-200 dark:border-[#1e2740] shadow-sm rounded-2xl">
        <div className="absolute top-[-30%] right-[-5%] w-48 h-48 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Subscription & Billing</span>
            {loadingInitial && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Plans & Upgrades</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mt-1">
            Choose the tier that matches your career momentum. Upgrade anytime to unlock comprehensive FAANG recruiter rubrics and AI bullet point generation.
          </p>
        </div>
        
        {/* Current Active Plan Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0d1323] border border-slate-200 dark:border-[#1e2740] px-4 py-3 rounded-2xl shrink-0 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${activePlan === "Pro" ? "bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse" : "bg-emerald-500 ring-4 ring-emerald-500/20"}`} />
          <div className="text-left">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider">Active Plan</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{activePlan} Tier</span>
              {activePlan === "Pro" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Cycle Switch */}
      <div className="flex justify-center items-center gap-3 my-1">
        <span className={`text-xs font-semibold cursor-pointer ${billingCycle === 'monthly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} onClick={() => setBillingCycle('monthly')}>
          Monthly Billing
        </span>
        <button 
          onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
          className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative"
        >
          <div className={`w-5 h-5 rounded-full bg-indigo-600 shadow-md transform transition-transform duration-200 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setBillingCycle('yearly')}>
          <span className={`text-xs font-semibold ${billingCycle === 'yearly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
            Annual Billing
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Save 17%
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const Icon = p.icon;
          const isCurrent = activePlan === p.name;
          const isPro = p.name === "Pro";

          return (
            <div 
              key={p.name} 
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative border ${
                isPro 
                  ? 'bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/25 dark:via-[#0c1122]/90 dark:to-[#070b16]/95 border-indigo-400 dark:border-indigo-500/40 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/20' 
                  : 'bg-white/80 dark:bg-[#0b101f]/70 border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md shadow-indigo-500/25">
                  {p.badge}
                </span>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${isPro ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1.5 my-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{p.price}</span>
                  {p.price !== "Custom" && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/{p.period}</span>
                  )}
                  {isPro && billingCycle === 'yearly' && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">₹249/mo billed yearly</span>
                  )}
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                    What's Included:
                  </span>
                  <ul className="space-y-3">
                    {p.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Current Plan
                  </div>
                ) : p.name === "Free" ? (
                  <button
                    onClick={() => setShowDowngradeModal(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Downgrade to Free
                  </button>
                ) : isPro ? (
                  <button
                    onClick={handleOpenUpgrade}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 transform active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Upgrade to Pro - {p.price}/{p.period === 'yearly' ? 'yr' : 'mo'}
                  </button>
                ) : (
                  <button
                    onClick={handleEnterpriseInquiry}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    Contact Sales
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Upgrade Payment Dialog */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 relative flex flex-col shadow-2xl animate-scale-up text-left">
            
            {/* Close Button */}
            {checkoutStep !== 'processing' && (
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                &times;
              </button>
            )}

            {/* Step 1: Payment Details & Order Summary */}
            {checkoutStep === 'details' && (
              <form onSubmit={handleProcessUpgrade} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Sandbox Checkout
                    </span>
                    <span className="text-[11px] text-slate-500">Zero Gateway / Instant Simulation</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Upgrade to Resora AI Pro</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review your subscription package and submit test authorization.
                  </p>
                </div>

                {/* Plan Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Resora Pro ({billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Subscription)
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Unlimited AI Scans + Recruiter Rubrics
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                      {billingCycle === 'monthly' ? '₹299.00' : '₹2,999.00'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </div>

                {/* Error Banner */}
                {upgradeError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{upgradeError}</span>
                  </div>
                )}

                {/* Card UI Graphic */}
                <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-md border border-indigo-500/20">
                  <div className="absolute right-[-10%] top-[-20%] w-32 h-32 bg-indigo-500/20 rounded-full blur-[30px]" />
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-mono">Resora AI Pro Card</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-mono text-sm tracking-wider text-slate-200 mb-2">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end text-[10px] text-slate-400">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500">Card Holder</span>
                      <span className="font-medium text-slate-300">{cardHolder || 'Alex Morgan'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500">Expires</span>
                      <span className="font-medium text-slate-300">{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Prefill Helper */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleFillDemoCard}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-fill Demo Test Card
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        Expiry Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="MM / YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          maxLength={7}
                          className="w-full bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        CVC / CVV
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          placeholder="888"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          maxLength={4}
                          className="w-full bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sandbox Note */}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
                  🔒 Test authorization only. No credit card will be charged. Plan will immediately activate on your account.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Authorize & Activate Pro Subscription
                </button>
              </form>
            )}

            {/* Step 2: Processing State */}
            {checkoutStep === 'processing' && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Authorizing Subscription</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 animate-pulse">
                    {processingMsg}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Please hold on while we provision your Pro features and update your account tier.
                </p>
              </div>
            )}

            {/* Step 3: Success State */}
            {checkoutStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 animate-bounce" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                    Payment Successful
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                    Welcome to Resora AI Pro!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                    Your Pro subscription is now active. You have full access to unlimited ATS scans, AI recruiter feedback, and interview coaching.
                  </p>
                </div>

                <div className="w-full bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center">
                  <span>New Account Tier:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Pro Plan</span>
                </div>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative flex flex-col shadow-2xl animate-scale-up text-left">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">
              Downgrade to Free Plan?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              If you downgrade to the Free plan, you will lose access to unlimited AI scans, Google/Amazon recruiter rubrics, and the STAR interview coach.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs mb-5">
              Your existing saved resumes and historical reports will remain safely stored.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDowngradeModal(false)}
                disabled={downgrading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Pro Plan
              </button>
              <button
                type="button"
                onClick={handleDowngradeToFree}
                disabled={downgrading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {downgrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
