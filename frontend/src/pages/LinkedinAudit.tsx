import React, { useState } from 'react';
import { 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Info,
  ExternalLink,
  Briefcase,
  MapPin,
  Building,
  Search,
  Award,
  ArrowRight,
  User,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.01-3.3 1.65 1.65 0 0 0 .01 3.3m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);

interface LinkedinAuditProps {
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
  resumeId?: number;
  initialTargetRole?: string;
}

export default function LinkedinAudit({ 
  backendUrl, 
  token, 
  isMockMode = false,
  resumeId,
  initialTargetRole = 'Software Engineer'
}: LinkedinAuditProps) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [profileUrl, setProfileUrl] = useState('');
  const [profileText, setProfileText] = useState('');
  const [targetRole, setTargetRole] = useState(initialTargetRole);
  const [targetIndustry, setTargetIndustry] = useState('Technology');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const sampleProfiles = [
    {
      name: "Alex Chen",
      role: "Full Stack Developer",
      industry: "Technology",
      url: "https://www.linkedin.com/in/alex-developer-sf"
    },
    {
      name: "Sarah Lin",
      role: "Product Manager",
      industry: "Consumer Tech",
      url: "https://www.linkedin.com/in/sarah-lin-pm"
    },
    {
      name: "David Kim",
      role: "Data Scientist",
      industry: "AI & Fintech",
      url: "https://www.linkedin.com/in/david-kim-data"
    },
    {
      name: "Priya Sharma",
      role: "DevOps Engineer",
      industry: "Cloud & Infrastructure",
      url: "https://www.linkedin.com/in/priya-sharma-devops"
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSelectSample = (sample: typeof sampleProfiles[0]) => {
    setMode('url');
    setProfileUrl(sample.url);
    setTargetRole(sample.role);
    setTargetIndustry(sample.industry);
    triggerAudit({
      url: sample.url,
      role: sample.role,
      industry: sample.industry
    });
  };

  const triggerAudit = async (params: { url?: string; text?: string; role?: string; industry?: string }) => {
    const activeUrl = params.url !== undefined ? params.url : profileUrl;
    const activeText = params.text !== undefined ? params.text : profileText;
    const activeRole = params.role || targetRole || 'Software Engineer';
    const activeIndustry = params.industry || targetIndustry || 'Technology';

    if (mode === 'url' && !activeUrl.trim()) {
      setError('Please enter a LinkedIn profile URL or public username handle.');
      return;
    }
    if (mode === 'manual' && !activeText.trim()) {
      setError('Please paste your LinkedIn profile text first.');
      return;
    }

    setError('');
    setLoading(true);
    setAuditResult(null);

    try {
      const payload: any = {
        target_role: activeRole,
        target_industry: activeIndustry,
        resume_id: resumeId || null
      };

      if (mode === 'url') {
        payload.profile_url = activeUrl.trim();
      } else {
        payload.profile_text = activeText.trim();
      }

      const response = await fetch(`${backendUrl}/api/v1/tools/linkedin-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to audit LinkedIn profile. Please try again.');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during audit.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudit({});
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreStrokeClass = (score: number) => {
    if (score >= 80) return 'stroke-emerald-400';
    if (score >= 60) return 'stroke-amber-400';
    return 'stroke-rose-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { label: 'All-Star Profile', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (score >= 70) return { label: 'Strong Profile', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    if (score >= 55) return { label: 'Intermediate', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { label: 'Needs Optimization', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  };

  const profileInfo = auditResult?.profile_info;
  const auditReport = auditResult?.audit || auditResult;
  const keywordGap = auditResult?.keyword_gap;
  const crossPlatform = auditResult?.cross_platform_alignment;

  return (
    <div className="flex flex-col gap-6 text-left">
      {isMockMode && (
        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini API Key Sandbox Mode</strong>
            <span>Platform is running in offline resilient mode. Live profile parsing and keyword gap matrices remain fully active. Configure your Gemini API key in Settings for custom generative AI rewrites.</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-5 border-l-4 border-l-blue-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <LinkedinIcon className="w-3.5 h-3.5 fill-current" />
            </span>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">LinkedIn Profile Auditor & SEO Optimizer</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Import any public LinkedIn profile via URL or raw text. Audit algorithmic discoverability, headline impact, recruiter search keywords, and cross-platform resume consistency.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Test Profiles:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleProfiles.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 bg-white dark:bg-[#121826] hover:bg-blue-50 dark:hover:bg-blue-600/20 hover:border-blue-300 dark:hover:border-blue-500/40 border border-slate-200 dark:border-[#1e2740] rounded-lg text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>{sample.name}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">({sample.role.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form & Profile Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Mode Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-[#1e2740] rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('url'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'url'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              LinkedIn Profile URL
            </button>
            <button
              type="button"
              onClick={() => { setMode('manual'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Manual Text Paste
            </button>
          </div>

          {/* Input Form Card */}
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. SDE, Full Stack, PM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Industry
                </label>
                <input
                  type="text"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="e.g. Technology, Fintech"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            {mode === 'url' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  LinkedIn Profile URL or Handle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500 dark:text-blue-400">
                    <LinkedinIcon className="w-4 h-4 fill-current" />
                  </div>
                  <input
                    type="text"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username or username"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Supports full LinkedIn URLs, shortened links, or vanity username handles.
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Paste LinkedIn Profile Text
                </label>
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  rows={9}
                  placeholder="Copy and paste your Headline, Summary (About), and Experience bullet points from LinkedIn..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'url' ? !profileUrl.trim() : !profileText.trim())}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-lg ${
                loading || (mode === 'url' ? !profileUrl.trim() : !profileText.trim())
                  ? 'bg-slate-100 dark:bg-[#1e2740] text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-transparent cursor-not-allowed shadow-none'
                  : mode === 'url'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Profile & Keywords...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Audit LinkedIn Profile</span>
                </>
              )}
            </button>
          </form>

          {/* Profile Card Preview (When Scraped) */}
          {profileInfo && (
            <div className="glass-card p-5 border-blue-500/20 bg-blue-950/10 flex flex-col gap-3.5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30">
                    {profileInfo.avatar_initials || 'LI'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {profileInfo.full_name}
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Profile Active" />
                    </h4>
                    <span className="text-[11px] text-blue-300 font-medium line-clamp-1">
                      {profileInfo.headline}
                    </span>
                  </div>
                </div>

                {profileInfo.profile_url && (
                  <a
                    href={profileInfo.profile_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-[#121826] hover:bg-blue-600/20 border border-[#1e2740] rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="View on LinkedIn"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 text-[10px]">
                {profileInfo.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0f1525] border border-[#1e2740] rounded-md text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {profileInfo.location}
                  </span>
                )}
                {profileInfo.current_company && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0f1525] border border-[#1e2740] rounded-md text-slate-400">
                    <Building className="w-3 h-3 text-slate-500" />
                    {profileInfo.current_company}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-300 font-medium">
                  {profileInfo.source === 'linkedin_public_scrape' ? 'Live Public Import' : 'Profile Sandbox Model'}
                </span>
              </div>

              {/* Extracted Skills Preview */}
              {profileInfo.skills && profileInfo.skills.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-1.5">
                    Extracted Skills ({profileInfo.skills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {profileInfo.skills.slice(0, 12).map((sk: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[#0f1525] border border-[#1e2740] rounded text-[10px] text-slate-300">
                        {sk}
                      </span>
                    ))}
                    {profileInfo.skills.length > 12 && (
                      <span className="px-2 py-0.5 bg-[#0f1525] border border-[#1e2740] rounded text-[10px] text-slate-500">
                        +{profileInfo.skills.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Audit Dashboard & Intelligence */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {auditResult ? (
            <div className="flex flex-col gap-5 animate-fade-in">
              
              {/* Hero Score Gauge Card */}
              <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Radial Gauge */}
                <div className="md:col-span-4 flex flex-col items-center gap-2 border-b md:border-b-0 md:border-r border-[#1e2740] pb-4 md:pb-0 md:pr-5">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-[#1e2740] fill-none"
                        strokeWidth="7"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className={`${getScoreStrokeClass(auditReport.score_overall)} fill-none transition-all duration-1000`}
                        strokeWidth="7"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * auditReport.score_overall) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-2xl font-extrabold tracking-tight ${getScoreColor(auditReport.score_overall)}`}>
                        {auditReport.score_overall}
                      </span>
                    </div>
                  </div>
                  
                  {(() => {
                    const badge = getScoreBadge(auditReport.score_overall);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Subscore Bars */}
                <div className="md:col-span-8 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Profile Completeness</span>
                      <span className="text-slate-900 dark:text-white font-bold">{auditReport.completeness_score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${auditReport.completeness_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Recruiter Search Keywords</span>
                      <span className="text-slate-900 dark:text-white font-bold">{auditReport.keyword_richness}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${auditReport.keyword_richness}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Headline Impact & Pitch</span>
                      <span className="text-slate-900 dark:text-white font-bold">{auditReport.headline_impact}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${auditReport.headline_impact}%` }}
                      />
                    </div>
                  </div>

                  {auditReport.recruiter_discoverability && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-blue-600 dark:text-blue-300 font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          Recruiter Discoverability & SEO
                        </span>
                        <span className="text-blue-600 dark:text-blue-300 font-bold">{auditReport.recruiter_discoverability}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-[#1e2740] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-700"
                          style={{ width: `${auditReport.recruiter_discoverability}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recruiter Search Keyword Gap Analysis Matrix */}
              {keywordGap && (
                <div className="glass-card p-5 flex flex-col gap-3.5 border-indigo-500/20 bg-indigo-950/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white">
                        Recruiter Keyword Gap for <span className="text-indigo-300">"{keywordGap.target_role}"</span>
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                      {keywordGap.coverage_percentage}% Keyword Coverage
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Present Keywords */}
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Found on Profile ({keywordGap.present_keywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {keywordGap.present_keywords.map((kw: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-[10.5px] font-medium text-emerald-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing High-Search Keywords */}
                    <div>
                      <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Missing High-Search Keywords ({keywordGap.missing_keywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {keywordGap.missing_keywords.map((kw: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/25 rounded-md text-[10.5px] font-medium text-rose-400">
                            +{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cross-Platform Alignment (Resume vs LinkedIn) */}
              {crossPlatform && (
                <div className="glass-card p-4 border-blue-500/20 bg-blue-950/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white">Cross-Platform Resume Alignment</h4>
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                      {crossPlatform.consistency_score}% Consistency
                    </span>
                  </div>
                  
                  {crossPlatform.skills_on_resume_missing_on_linkedin.length > 0 && (
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-amber-400">Opportunity: </strong>
                      You have validated skills on your resume that are missing on your LinkedIn profile: {' '}
                      <span className="text-indigo-300 font-medium">
                        {crossPlatform.skills_on_resume_missing_on_linkedin.join(', ')}
                      </span>
                      . Adding these will align both platforms and boost recruiter interview callbacks.
                    </div>
                  )}
                </div>
              )}

              {/* Action items checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Key Profile Strengths
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {auditReport.strengths?.map((str: string, i: number) => (
                      <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-2">
                        <span className="text-emerald-400 select-none font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-4">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Areas to Improve
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {auditReport.weaknesses?.map((weak: string, i: number) => (
                      <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-2">
                        <span className="text-rose-400 select-none font-bold">✗</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="glass-card p-5 text-left">
                <h4 className="text-xs font-bold text-white mb-3.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Step-by-Step SEO Recommendations
                </h4>
                <ul className="flex flex-col gap-3">
                  {auditReport.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Headline Suggestions */}
              <div className="glass-card p-5 text-left flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Recruiter-Optimized Headline Alternatives
                  </h4>
                  <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-medium">
                    1-Click Copy
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {auditReport.headline_suggestions?.map((headline: string, i: number) => {
                    const copyId = `headline-${i}`;
                    return (
                      <div
                        key={i}
                        className="p-3 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl flex justify-between gap-3 items-center group hover:border-violet-500/40 transition-colors"
                      >
                        <span className="text-[11.5px] text-slate-300 leading-relaxed font-medium">{headline}</span>
                        <button
                          onClick={() => handleCopy(headline, copyId)}
                          className="p-2 bg-[#121826] hover:bg-[#1a2337] rounded-lg border border-[#1e2740] text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                          title="Copy Headline"
                        >
                          {copiedText === copyId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Rewrite */}
              <div className="glass-card p-5 text-left flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    AI-Optimized 'About' Section
                  </h4>
                  <button
                    onClick={() => handleCopy(auditReport.summary_suggestion || '', 'summary-box')}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded-lg border border-indigo-500/20 text-indigo-400 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText === 'summary-box' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Summary
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl leading-relaxed text-[11.5px] text-slate-300 whitespace-pre-line font-mono max-h-60 overflow-y-auto">
                  {auditReport.summary_suggestion}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center gap-3.5 min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <LinkedinIcon className="w-7 h-7 fill-current" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No Profile Audited Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Enter your LinkedIn profile URL or choose one of the sample candidate profiles above, then click <b>Audit LinkedIn Profile</b> to analyze your ranking score.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
