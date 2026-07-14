import React, { useState } from 'react';
import { Check, Award, CreditCard, Sparkles, Building, Loader2, Calendar } from 'lucide-react';

interface PlansProps {
  token: string;
  onAlert: (msg: string) => void;
}

export default function Plans({ token: _token, onAlert }: PlansProps) {
  const [activePlan, setActivePlan] = useState(() => localStorage.getItem("resumeiq_plan") || "Free");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingTo, setUpgradingTo] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      desc: "Perfect for a quick resume compatibility audit.",
      features: [
        "1 Resume scan parsing check",
        "Deterministic ATS compatibility score",
        "Basic keyword matching checks",
        "Layout format audit summary"
      ],
      icon: Award,
      color: "glass-card border-slate-800/60 hover:border-slate-700/50",
      buttonText: "Current Plan",
      disabled: activePlan === "Free",
    },
    {
      name: "Pro",
      price: "₹299",
      period: "monthly",
      desc: "Everything you need to optimize your resume and land FAANG interviews.",
      features: [
        "Unlimited resume scan versions",
        "Full AI Recruiter feedback (Google, Amazon, Startup)",
        "Advanced Job Description semantic matching",
        "Unlimited AI bullet points optimizations (XYZ formula)",
        "STAR Interview Coach behavioral scripts",
        "Full LinkedIn Profile Audit",
        "Tailored Cover Letter generator"
      ],
      icon: Sparkles,
      color: "glass-card border-indigo-500/30 bg-gradient-to-b from-indigo-950/15 via-[#0a0f1d]/60 to-[#070a13]/70 hover:border-indigo-500/50 relative shadow-[0_0_30px_rgba(99,102,241,0.06)]",
      buttonText: "Upgrade to Pro",
      badge: "Most Popular",
      disabled: activePlan === "Pro",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "annual",
      desc: "Tailored recruiter compliance profiles for corporate teams and bootcamps.",
      features: [
        "Custom company-specific recruiter rubrics",
        "Volume parsing scanning API support",
        "Team dashboards & role benchmarks admin",
        "Dedicated corporate template guidelines",
        "24/7 Priority support & custom onboarding"
      ],
      icon: Building,
      color: "glass-card border-slate-800/60 hover:border-slate-700/50",
      buttonText: "Contact Sales",
      disabled: activePlan === "Enterprise",
    }
  ];

  const handleOpenUpgrade = (planName: string) => {
    if (planName === "Enterprise") {
      onAlert("Enterprise request sent! Our sales team will contact you shortly.");
      return;
    }
    setUpgradingTo(planName);
    setShowUpgradeModal(true);
  };

  const handleProcessUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setUpgradeSuccess(true);
      setTimeout(() => {
        setActivePlan(upgradingTo);
        localStorage.setItem("resumeiq_plan", upgradingTo);
        setShowUpgradeModal(false);
        setUpgradeSuccess(false);
        setCardNumber("");
        setExpiry("");
        setCvc("");
      }, 1500);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header Info */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-5%] w-36 h-36 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div>
          <h3 className="font-bold text-sm text-slate-300 mb-1">Billing & Subscription Plans</h3>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Configure your pricing plan to unlock deep AI recruiter screening, STAR interview coaches, and resume templates.
          </p>
        </div>
        
        {/* Current Plan Badge */}
        <div className="flex items-center gap-3 bg-[#0d1323] border border-[#1e2740] px-4 py-2.5 rounded-2xl shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${activePlan === "Pro" ? "bg-indigo-400 animate-pulse" : "bg-slate-500"}`} />
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Current Account Plan</span>
            <span className="text-xs font-bold text-slate-200">{activePlan} Plan</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-2">
        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <div 
              key={p.name} 
              className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${p.color}`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-indigo-500/20">
                  {p.badge}
                </span>
              )}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-300 font-bold text-base">{p.name}</span>
                  <Icon className={`w-5 h-5 ${p.name === "Pro" ? "text-indigo-400" : "text-slate-400"}`} />
                </div>
                
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{p.price}</span>
                  {p.price !== "Custom" && <span className="text-xs text-slate-500">/{p.period}</span>}
                </div>

                <p className="text-[11.5px] text-slate-400 leading-relaxed mb-6 border-b border-slate-800/60 pb-4">
                  {p.desc}
                </p>

                <ul className="space-y-3 mb-8">
                  {p.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenUpgrade(p.name)}
                disabled={p.disabled || activePlan === p.name}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePlan === p.name
                    ? "bg-slate-800/40 text-slate-500 border border-slate-700/30 cursor-default"
                    : p.name === "Pro"
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/10"
                      : "bg-[#111827] text-slate-300 hover:text-white border border-[#1e2740] hover:border-slate-600"
                }`}
              >
                {activePlan === p.name ? "Current Plan" : p.buttonText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Simulated Upgrade Payment Dialog */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 relative flex flex-col border border-indigo-500/20 shadow-2xl animate-scale-up text-left">
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
            >
              &times;
            </button>

            {upgradeSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-base">Plan Upgraded!</h3>
                <p className="text-xs text-slate-500">Thank you for subscribing to Resora AI Pro.</p>
              </div>
            ) : (
              <form onSubmit={handleProcessUpgrade} className="space-y-4">
                <div>
                  <h3 className="text-white font-bold text-base mb-1">Upgrade to Resora AI {upgradingTo}</h3>
                  <p className="text-xs text-slate-500">Enter dummy card details to complete your subscription simulated scan checkout.</p>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-400">Subscription Total:</span>
                  <span className="font-bold text-white">₹299.00 / month</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        maxLength={7}
                        className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      maxLength={3}
                      className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing Transaction...
                    </>
                  ) : (
                    "Authorize Sandbox Payment"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
