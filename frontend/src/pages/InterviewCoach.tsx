import React, { useState } from 'react';
import { Loader2, Sparkles, HelpCircle, Check, Copy, AlertCircle, Info, ChevronRight, BookOpen } from 'lucide-react';

interface InterviewCoachProps {
  resumeId: number;
  targetRole: string;
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
}

export default function InterviewCoach({
  resumeId,
  targetRole,
  backendUrl,
  token,
  isMockMode = false,
}: InterviewCoachProps) {
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState(targetRole || 'SDE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please provide a target company name.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setSelectedQuestionIndex(0);

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/interview-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          target_role: role,
          company_name: companyName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview prep materials.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const activeQuestion = result?.questions?.[selectedQuestionIndex];

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
        <h3 className="font-medium text-sm text-slate-300 mb-1">AI Interview Coach & STAR Prep</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Weave your resume achievements directly into tailored, company-specific STAR interview questions and scripts.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Form panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4 h-full m-0">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Company
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Amazon, OpenAI"
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. SDE, Product Manager"
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${
                loading || !companyName.trim()
                  ? 'bg-[#1e2740] text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Generating Prep...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate STAR Prep
                </>
              )}
            </button>
          </form>

          {/* Questions Sidebar (when result exists) */}
          {result?.questions && (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-2 px-1">
                Behavioral Questions
              </span>
              <div className="flex flex-col gap-1.5">
                {result.questions.map((q: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-[11px] transition-all flex justify-between items-center group cursor-pointer ${
                      selectedQuestionIndex === idx
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-[#0f1525]/30 border-[#1e2740] text-slate-400 hover:bg-[#0f1525]/60 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate max-w-[200px]">Question {idx + 1}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details panel */}
        <div className="lg:col-span-8">
          {activeQuestion ? (
            <div className="flex flex-col gap-6 animate-fade-in text-left">
              {/* Question header */}
              <div className="glass-card p-5 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 to-transparent">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4" />
                  Question Interviewers Ask
                </span>
                <h3 className="text-sm font-bold text-white leading-relaxed">
                  "{activeQuestion.question}"
                </h3>
              </div>

              {/* Linked resume bullet */}
              <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl">
                <div className="flex gap-2.5 items-start">
                  <BookOpen className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">
                      Mapped Resume Achievement
                    </h5>
                    <p className="text-[11px] text-slate-300 italic font-mono leading-relaxed">
                      "{activeQuestion.bullet_ref}"
                    </p>
                  </div>
                </div>
              </div>

              {/* STAR framework cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 flex flex-col gap-1 bg-[#131a2b]/40">
                  <span className="text-[10.5px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                    Situation
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeQuestion.star_framework?.situation}
                  </p>
                </div>

                <div className="glass-card p-4 flex flex-col gap-1 bg-[#131a2b]/40">
                  <span className="text-[10.5px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                    Task
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeQuestion.star_framework?.task}
                  </p>
                </div>

                <div className="glass-card p-4 flex flex-col gap-1 bg-[#131a2b]/40">
                  <span className="text-[10.5px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                    Action
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeQuestion.star_framework?.action}
                  </p>
                </div>

                <div className="glass-card p-4 flex flex-col gap-1 bg-[#131a2b]/40">
                  <span className="text-[10.5px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                    Result
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeQuestion.star_framework?.result}
                  </p>
                </div>
              </div>

              {/* Draft Answer Script */}
              <div className="glass-card p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#1e2740]">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Suggested Script / Answer
                  </span>
                  <button
                    onClick={() => handleCopy(activeQuestion.draft_answer || '')}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 rounded transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Script
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-[#0b1020]/80 border border-[#1e2740] rounded-xl leading-relaxed text-[11.5px] text-slate-300 font-mono italic max-h-56 overflow-y-auto pr-2">
                  "{activeQuestion.draft_answer}"
                </div>
              </div>

              {/* Pro Tips */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-left flex gap-3 items-start">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-white mb-0.5">Company Culture Pro Tips</h5>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    {activeQuestion.pro_tips}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 text-center gap-3 min-h-[460px] h-full">
              <HelpCircle className="w-8 h-8 text-slate-700 animate-pulse-slow" />
              <p className="text-xs text-slate-500 max-w-xs">
                Fill in the target company name and role details, then click <b>Generate STAR Prep</b>. The coach will build a complete behavioral preparation syllabus directly tied to your accomplishments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
