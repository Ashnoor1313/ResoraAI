import React, { useState } from 'react';
import { Loader2, Copy, Check, Sparkles, TrendingUp, AlertCircle, FileText, CheckCircle2, XCircle, Info } from 'lucide-react';

interface LinkedinAuditProps {
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
}

export default function LinkedinAudit({ backendUrl, token, isMockMode = false }: LinkedinAuditProps) {
  const [profileText, setProfileText] = useState('');
  const [targetRole, setTargetRole] = useState('SDE');
  const [targetIndustry, setTargetIndustry] = useState('Tech');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileText.trim()) {
      setError('Please paste your LinkedIn profile details first.');
      return;
    }
    setError('');
    setLoading(true);
    setAuditResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/linkedin-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify({
          profile_text: profileText,
          target_role: targetRole,
          target_industry: targetIndustry,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run LinkedIn audit. Please check your network or try again.');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during audit.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreStrokeClass = (score: number) => {
    if (score >= 80) return 'stroke-emerald-400';
    if (score >= 60) return 'stroke-amber-400';
    return 'stroke-red-400';
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {isMockMode && (
        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini API Key Unconfigured</strong>
            <span>Platform is running in simulated Sandbox mode with static mock results. Configure your Gemini API Key in the Settings page to unlock real-time custom generation.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-5">
        <h3 className="font-medium text-sm text-slate-300 mb-1">LinkedIn Profile Auditor</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Scan and audit your LinkedIn profile details to increase recruiter discoverability and ranking.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Input Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <form onSubmit={handleAudit} className="glass-card p-5 flex flex-col gap-4 h-full m-0">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE, Product Manager"
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Industry
              </label>
              <input
                type="text"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g. Tech, Finance, Healthcare"
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Paste LinkedIn Profile Text
              </label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={10}
                placeholder="Copy and paste your Headline, Summary (About), and Experience descriptions from LinkedIn..."
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !profileText.trim()}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${
                loading || !profileText.trim()
                  ? 'bg-[#1e2740] text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Auditing Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Audit Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col">
          {auditResult ? (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Score summary Card */}
              <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Radial Gauge */}
                <div className="md:col-span-4 flex flex-col items-center gap-2 border-b md:border-b-0 md:border-r border-[#1e2740] pb-5 md:pb-0 md:pr-6">
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
                        className={`${getScoreStrokeClass(auditResult.score_overall)} fill-none transition-all duration-1000`}
                        strokeWidth="7"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * auditResult.score_overall) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute text-xl font-bold ${getScoreColor(auditResult.score_overall)}`}>
                      {auditResult.score_overall}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Profile Score
                  </span>
                </div>

                {/* Subscores */}
                <div className="md:col-span-8 flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Profile Completeness</span>
                      <span className="text-white font-bold">{auditResult.completeness_score}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${auditResult.completeness_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Keyword Richness</span>
                      <span className="text-white font-bold">{auditResult.keyword_richness}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${auditResult.keyword_richness}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Headline Impact</span>
                      <span className="text-white font-bold">{auditResult.headline_impact}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2740] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{ width: `${auditResult.headline_impact}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action items checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Key Strengths
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {auditResult.strengths?.map((str: string, i: number) => (
                      <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-2">
                        <span className="text-emerald-400 select-none font-bold">✓</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-4">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    Key Weaknesses
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {auditResult.weaknesses?.map((weak: string, i: number) => (
                      <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-2">
                        <span className="text-red-400 select-none font-bold">✗</span>
                        {weak}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="glass-card p-5 text-left">
                <h4 className="text-xs font-bold text-white mb-3.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Actionable Recommendations
                </h4>
                <ul className="flex flex-col gap-3">
                  {auditResult.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Headline Suggestions */}
              <div className="glass-card p-5 text-left flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Optimized Headline Alternatives
                  </h4>
                  <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded font-medium">
                    Copy and Paste to LinkedIn
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {auditResult.headline_suggestions?.map((headline: string, i: number) => {
                    const copyId = `headline-${i}`;
                    return (
                      <div
                        key={i}
                        className="p-3 bg-[#0b1020]/80 border border-[#1e2740] rounded-xl flex justify-between gap-3 items-center group hover:border-slate-700 transition-colors"
                      >
                        <span className="text-[11px] text-slate-300 leading-relaxed">{headline}</span>
                        <button
                          onClick={() => handleCopy(headline, copyId)}
                          className="p-1.5 bg-[#121826] hover:bg-[#1a2337] rounded border border-[#1e2740] text-slate-400 hover:text-white transition-colors shrink-0"
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
                    AI-Optimized About/Summary
                  </h4>
                  <button
                    onClick={() => handleCopy(auditResult.summary_suggestion || '', 'summary-box')}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText === 'summary-box' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Summary
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-[#0b1020]/80 border border-[#1e2740] rounded-xl leading-relaxed text-[11.5px] text-slate-300 whitespace-pre-line font-mono max-h-56 overflow-y-auto">
                  {auditResult.summary_suggestion}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 text-center gap-3 min-h-[400px] h-full">
              <Sparkles className="w-8 h-8 text-slate-700 animate-pulse-slow" />
              <p className="text-xs text-slate-500 max-w-xs">
                Fill in your details and paste your LinkedIn profile text on the left, then click <b>Audit Profile</b> to run the AI optimization.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
