import React, { useState } from 'react';
import { Loader2, Copy, Check, Mail, Send, MessageSquare, AlertCircle, Info, Sparkles } from 'lucide-react';

interface NetworkingOutreachProps {
  resumeId: number;
  targetRole: string;
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
}

export default function NetworkingOutreach({
  resumeId,
  targetRole,
  backendUrl,
  token,
  isMockMode = false,
}: NetworkingOutreachProps) {
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState(targetRole || 'SDE');
  const [recipientType, setRecipientType] = useState('Recruiter');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'linkedin'>('email');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/networking-outreach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          company_name: companyName,
          target_role: role,
          recipient_type: recipientType,
          tone: tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outreach templates.');
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
        <h3 className="font-medium text-sm text-slate-300 mb-1">Cold Outreach Generator</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Generate optimized cold outreach templates tailored to target companies and recruiter roles.
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
        <div className="lg:col-span-5 flex flex-col">
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4 h-full m-0">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Company
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Stripe, Canva"
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

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Recipient Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Recruiter', 'Hiring Manager', 'Peer/Alumni'].map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => setRecipientType(rec)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-semibold tracking-wider transition-all border cursor-pointer ${
                      recipientType === rec
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm'
                        : 'bg-[#0f1525] border-[#1e2740] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Outreach Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Professional', 'Friendly'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2 px-2 rounded-xl text-[10px] font-semibold tracking-wider transition-all border cursor-pointer ${
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
                  Generating Templates...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Outreach
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Tabs header */}
              <div className="flex gap-2 border-b border-[#1e2740] pb-0.5">
                <button
                  onClick={() => setActiveSubTab('email')}
                  className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                    activeSubTab === 'email' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Cold Email
                  </span>
                  {activeSubTab === 'email' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>

                <button
                  onClick={() => setActiveSubTab('linkedin')}
                  className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                    activeSubTab === 'linkedin' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    LinkedIn Note
                  </span>
                  {activeSubTab === 'linkedin' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeSubTab === 'email' ? (
                <div className="flex flex-col gap-4">
                  {/* Subject Line */}
                  <div className="glass-card p-4 flex justify-between gap-3 items-center">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase mb-1">
                        Subject Line
                      </span>
                      <span className="text-xs text-white font-medium">{result.email_subject}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(result.email_subject || '', 'subj')}
                      className="p-2 bg-[#121826] hover:bg-[#1a2337] rounded border border-[#1e2740] text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy Subject"
                    >
                      {copiedKey === 'subj' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Email Body */}
                  <div className="glass-card p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e2740]">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Email Message
                      </span>
                      <button
                        onClick={() => handleCopy(result.email_body || '', 'body')}
                        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 rounded transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {copiedKey === 'body' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Body
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-[#0b1020]/80 border border-[#1e2740] rounded-xl text-[11.5px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                      {result.email_body}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1e2740]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Connection Invitation Message
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          (result.linkedin_message?.length || 0) <= 300
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {result.linkedin_message?.length || 0} / 300 chars
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(result.linkedin_message || '', 'lin-note')}
                      className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 rounded transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedKey === 'lin-note' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Note
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-[#0b1020]/80 border border-[#1e2740] rounded-xl text-[11.5px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {result.linkedin_message}
                  </div>
                </div>
              )}

              {/* Psychology Insight */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-left flex gap-3 items-start">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-white mb-0.5">AI Outreach Strategy Insight</h5>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    {result.psychology_tip}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 text-center gap-3 min-h-[440px] h-full">
              <Mail className="w-8 h-8 text-slate-700 animate-pulse-slow" />
              <p className="text-xs text-slate-500 max-w-xs">
                Fill in the target company and role preferences, select the recipient type on the left, and click <b>Generate Outreach</b> to get instant copy-pasteable communication drafts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
