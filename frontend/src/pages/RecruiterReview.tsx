import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, ChevronRight, Zap, RefreshCw, AlertCircle, Sparkles, Building2, Search, Info } from 'lucide-react';

interface RecruiterReviewProps {
  recruiterData: {
    google: { strengths: string[]; weaknesses: string[]; likelihood: string; feedback: string; suggestions: string[] };
    amazon: { strengths: string[]; weaknesses: string[]; likelihood: string; feedback: string; suggestions: string[] };
    startup: { strengths: string[]; weaknesses: string[]; likelihood: string; feedback: string; suggestions: string[] };
  };
  backendUrl: string;
  resumeId: number;
  targetRole: string;
  token?: string;
  isMockMode?: boolean;
}

type CompanyCategory = 'faang' | 'big4' | 'product' | 'service';

const CATEGORY_DEFAULTS: Record<CompanyCategory, { company: string; label: string; desc: string }> = {
  faang: { company: "Google", label: "FAANG", desc: "Top-tier tech (Google, Amazon, Meta, Netflix, Apple)" },
  big4: { company: "Deloitte", label: "Big 4 Consulting", desc: "Enterprise services (Deloitte, EY, PwC, KPMG)" },
  product: { company: "Startup", label: "Product-Based", desc: "Fast-growth tech companies (Stripe, Uber, Canva)" },
  service: { company: "TCS", label: "Service-Based", desc: "Global IT consultancy (TCS, Infosys, Wipro, Accenture)" }
};

export default function RecruiterReview({ 
  recruiterData, backendUrl, resumeId, targetRole, token, isMockMode = false 
}: RecruiterReviewProps) {
  const [activeCategory, setActiveCategory] = useState<CompanyCategory>('faang');
  const [customCompany, setCustomCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cache results so we don't refetch tabs already loaded
  const [cache, setCache] = useState<Record<CompanyCategory, { companyName: string; data: any } | null>>(() => ({
    faang: {
      companyName: "Google",
      data: recruiterData.google
    },
    product: {
      companyName: "Startup",
      data: recruiterData.startup
    },
    big4: null,
    service: null
  }));

  const fetchCompanyFit = async (category: CompanyCategory, companyName: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/recruiter-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({
          company_name: companyName,
          category: category,
          target_role: targetRole
        })
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate company fit.");
      }

      const result = await response.json();
      setCache(prev => ({
        ...prev,
        [category]: {
          companyName: companyName,
          data: result
        }
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during evaluation.");
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch defaults for Big 4 and Service-Based if clicked and empty
  useEffect(() => {
    if (!cache[activeCategory]) {
      const defaultCompany = CATEGORY_DEFAULTS[activeCategory].company;
      fetchCompanyFit(activeCategory, defaultCompany);
    }
  }, [activeCategory]);

  const handleCustomEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customCompany.trim();
    if (!query) {
      setErrorMsg("Please enter a company name.");
      return;
    }
    fetchCompanyFit(activeCategory, query);
    setCustomCompany("");
  };

  const currentFit = cache[activeCategory];

  const getLikelihoodStyle = (lik: string) => {
    if (lik === 'High') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15';
    if (lik === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/15';
    return 'text-red-400 bg-red-500/10 border-red-500/15';
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-4xl mx-auto">
      {isMockMode && (
        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini API Key Unconfigured</strong>
            <span>Platform is running in simulated Sandbox mode with static mock results. Configure your Gemini API Key in the Settings page to unlock real-time custom generation.</span>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Company-Specific Recruiter Fit</h2>
          <p className="text-xs text-slate-500 max-w-md">
            Query the Gemini Recruiter AI to evaluate how well your resume matches the screening guidelines of any specific target company.
          </p>
        </div>

        {/* Custom Company Search form */}
        <form onSubmit={handleCustomEvaluate} className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
              placeholder={`Search in ${CATEGORY_DEFAULTS[activeCategory].label}...`}
              className="bg-[#0f1525] border border-[#1e2740] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 w-52 sm:w-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !customCompany.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            Audit Fit
          </button>
        </form>
      </div>

      {/* Category selector Tab Bar */}
      <div className="glass-card p-1.5 flex flex-wrap gap-1">
        {(['faang', 'big4', 'product', 'service'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setErrorMsg("");
            }}
            className={`flex-1 min-w-[120px] py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeCategory === cat
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1525]/30'
            }`}
          >
            {CATEGORY_DEFAULTS[cat].label}
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">Analyzing hiring criteria alignment...</p>
            <p className="text-xs text-slate-500 mt-1">Comparing resume semantics against candidate benchmarks</p>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 min-h-[200px] border border-red-500/10">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400 font-semibold">{errorMsg}</p>
          <button 
            onClick={() => fetchCompanyFit(activeCategory, CATEGORY_DEFAULTS[activeCategory].company)}
            className="px-4 py-2 bg-[#1e2740] hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
          >
            Retry Default Audit
          </button>
        </div>
      ) : currentFit ? (
        /* Evaluation Dashboard display */
        <div className="flex flex-col gap-5 animate-fade-in">
          
          {/* Header metadata card */}
          <div className="glass-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-base text-slate-200">{currentFit.companyName} recruiter</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {CATEGORY_DEFAULTS[activeCategory].desc}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Hiring Match</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getLikelihoodStyle(currentFit.data.likelihood)}`}>
                {currentFit.data.likelihood} Likelihood
              </span>
            </div>
          </div>

          {/* Feedback paragraph quotes */}
          <div className="glass-card p-5 bg-[#0f1525]/60 border border-[#1e2740]/80 relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-10px] text-[120px] font-serif text-indigo-500/5 select-none pointer-events-none">”</div>
            <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recruiter Screening Feedback
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              "{currentFit.data.feedback}"
            </p>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold text-emerald-400 mb-4 flex items-center gap-1.5 pb-2 border-b border-[#1e2740]/50">
                <CheckCircle2 className="w-4 h-4" />
                Key Strengths Detected
              </h4>
              <ul className="space-y-3">
                {currentFit.data.strengths.map((str: string, idx: number) => (
                  <li key={idx} className="flex gap-2.5 text-xs text-slate-400 items-start">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold text-red-400 mb-4 flex items-center gap-1.5 pb-2 border-b border-[#1e2740]/50">
                <AlertCircle className="w-4 h-4" />
                Hiring Risk Factors
              </h4>
              <ul className="space-y-3">
                {currentFit.data.weaknesses.map((weak: string, idx: number) => (
                  <li key={idx} className="flex gap-2.5 text-xs text-slate-400 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                    <span className="leading-relaxed">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Suggestions */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-300 pb-2 border-b border-[#1e2740]/50">
              Detailed Improvement Insights
            </h4>
            <div className="space-y-2.5">
              {currentFit.data.suggestions.map((sug: string, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs text-slate-400 items-start p-2.5 bg-[#0f1525]/30 border border-[#1e2740]/30 rounded-xl">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{sug}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-card p-10 text-center text-slate-500 text-sm">
          Select a category or evaluate fit to get started.
        </div>
      )}

    </div>
  );
}
