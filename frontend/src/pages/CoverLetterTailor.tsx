import React, { useState } from 'react';
import { Loader2, Copy, Check, FileText, Sparkles, AlertCircle, Info } from 'lucide-react';

interface CoverLetterTailorProps {
  resumeId: number;
  targetRole: string;
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
}

export default function CoverLetterTailor({
  resumeId,
  targetRole,
  backendUrl,
  token,
  isMockMode = false,
}: CoverLetterTailorProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [role, setRole] = useState(targetRole || 'SDE');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result?.cover_letter) return;
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a Job Description first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          job_description: jobDescription,
          target_role: role,
          tone: tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
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
        <h3 className="font-medium text-sm text-slate-300 mb-1">AI Cover Letter Tailor</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Generate an ATS-aligned, targeted cover letter designed around your resume bullets and the job requirements.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Settings Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4 h-full m-0">
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

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Cover Letter Tone
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Professional', 'Conversational', 'Technical'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-semibold tracking-wider transition-all border cursor-pointer ${
                      tone === t
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm'
                        : 'bg-[#0f1525] border-[#1e2740] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                placeholder="Paste the target job description here..."
                className="w-full px-3.5 py-2.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${
                loading || !jobDescription.trim()
                  ? 'bg-[#1e2740] text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Generating Letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tailor Cover Letter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Cover Letter paper */}
              <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-b from-[#131a2b] to-[#0c1221] shadow-2xl border border-slate-800">
                <div className="flex justify-between items-center pb-3 border-b border-[#1e2740]">
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Generated Document
                  </span>
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 rounded transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Letter
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11.5px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap py-2 text-left max-h-[460px] overflow-y-auto pr-2">
                  {result.cover_letter}
                </div>
              </div>

              {/* Strategy Insight */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-left flex gap-3 items-start">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-white mb-0.5">AI Alignment Strategy</h5>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    {result.alignment_strategy}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 text-center gap-3 min-h-[440px] h-full">
              <FileText className="w-8 h-8 text-slate-700 animate-pulse-slow" />
              <p className="text-xs text-slate-500 max-w-xs">
                Provide a target job description and choose your desired tone, then click <b>Tailor Cover Letter</b>. The AI will weave your resume achievements into a complete customized letter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
