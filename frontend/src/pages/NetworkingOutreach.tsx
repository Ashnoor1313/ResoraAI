import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Copy, 
  Check, 
  Mail, 
  Send, 
  MessageSquare, 
  AlertCircle, 
  Info, 
  Sparkles,
  Zap,
  Repeat,
  User,
  Building,
  Briefcase,
  ChevronDown
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

interface NetworkingOutreachProps {
  resumeId?: number;
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
  const [role, setRole] = useState(targetRole || 'Software Engineer');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState('Recruiter');
  const [tone, setTone] = useState('Professional');
  const [jobContext, setJobContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'linkedin_note' | 'linkedin_inmail' | 'email' | 'followup'>('linkedin_note');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load tracked applications from localStorage for 1-click pre-fill
  const [trackedApps, setTrackedApps] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumeiq_applications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleanApps = parsed.filter(a => !['1', '2', '3', '4'].includes(a.id));
          if (cleanApps.length > 0) {
            setTrackedApps(cleanApps);
            // If company is empty, prefill with first application
            if (!companyName && cleanApps[0]) {
              setCompanyName(cleanApps[0].company || '');
              if (cleanApps[0].title) setRole(cleanApps[0].title);
              if (cleanApps[0].skills?.length) {
                setJobContext(`Target skills: ${cleanApps[0].skills.join(', ')}`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSelectTrackedApp = (app: any) => {
    setCompanyName(app.company || '');
    setRole(app.title || targetRole || 'Software Engineer');
    if (app.skills?.length) {
      setJobContext(`Target skills: ${app.skills.join(', ')}`);
    } else if (app.notes) {
      setJobContext(app.notes);
    }
  };

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
          resume_id: resumeId || null,
          company_name: companyName.trim(),
          target_role: role.trim(),
          recipient_type: recipientType,
          tone: tone,
          recipient_name: recipientName.trim() || null,
          job_context: jobContext.trim() || null
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to generate outreach templates.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  const personas = [
    { id: 'Recruiter', label: 'Talent Recruiter', icon: '💼', desc: 'Focuses on qualifications & fit' },
    { id: 'Hiring Manager', label: 'Hiring Manager', icon: '🚀', desc: 'Focuses on technical depth' },
    { id: 'Peer/Alumni', label: 'Engineer / Alum', icon: '🤝', desc: 'Focuses on team rapport' },
    { id: 'Founder', label: 'Startup Founder', icon: '💡', desc: 'Focuses on velocity & ownership' },
  ];

  const tones = ['Professional', 'Direct & Technical', 'Friendly & Casual'];

  return (
    <div className="flex flex-col gap-6 text-left">
      {isMockMode && (
        <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini API Key Sandbox Mode</strong>
            <span>Platform is running in resilient offline sandbox mode with instant templates. Configure your Gemini API Key in Settings to unlock custom LLM dynamic personalization.</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-5 border-l-4 border-l-violet-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Send className="w-3.5 h-3.5" />
            </span>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Recruiter Cold Outreach & InMail Generator</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Generate high-converting cold outreach for recruiters, hiring managers, and alumni. Includes strict 300-char LinkedIn connection notes, full InMails, cold emails, and polite 5-day follow-ups.
          </p>
        </div>

        {/* Quick Fill from Applications */}
        {trackedApps.length > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Prefill from Pipeline:</span>
            <div className="flex flex-wrap gap-1.5 max-w-xs">
              {trackedApps.slice(0, 3).map((app, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTrackedApp(app)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                    companyName === app.company 
                      ? 'bg-violet-50 dark:bg-violet-600/20 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-white' 
                      : 'bg-white dark:bg-[#121826] border-slate-200 dark:border-[#1e2740] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building className="w-2.5 h-2.5 text-violet-500 dark:text-violet-400" />
                  <span>{app.company}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Form Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4">
            
            {/* Target Company & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Company
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe, Google"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Role
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. SDE, Full Stack"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Recipient Name (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Recipient Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Connor, Alex Rivera (or leave blank)"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Persona Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Recipient Persona
              </label>
              <div className="grid grid-cols-2 gap-2">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRecipientType(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      recipientType === p.id
                        ? 'bg-violet-50 dark:bg-violet-600/15 border-violet-300 dark:border-violet-500 text-violet-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-[#0f1525] border-slate-200 dark:border-[#1e2740] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold block truncate">{p.label}</span>
                      <span className="text-[9px] text-slate-500 block truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Outreach Tone
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2 px-2 rounded-xl text-[10px] font-semibold tracking-wider transition-all border text-center cursor-pointer ${
                      tone === t
                        ? 'bg-violet-50 dark:bg-violet-600/15 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'bg-white dark:bg-[#0f1525] border-slate-200 dark:border-[#1e2740] text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Context / Job Highlights (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Specific Job Focus / Skill Hook <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                value={jobContext}
                onChange={(e) => setJobContext(e.target.value)}
                rows={2}
                placeholder="e.g. Mention experience with React, TypeScript, and high-concurrency microservices..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-lg ${
                loading || !companyName.trim()
                  ? 'bg-slate-100 dark:bg-[#1e2740] text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-transparent cursor-not-allowed shadow-none'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Tailored Pitch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Outreach Suite</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Results Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              
              {/* Channel Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-[#1e2740] rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('linkedin_note')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSubTab === 'linkedin_note'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkedinIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Connection Note</span>
                  <span className="text-[9px] opacity-80">(≤300 chars)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('linkedin_inmail')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSubTab === 'linkedin_inmail'
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Direct InMail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('email')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSubTab === 'email'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Cold Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('followup')}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSubTab === 'followup'
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Day 5 Bump</span>
                </button>
              </div>

              {/* Tab 1: LinkedIn Connection Note */}
              {activeSubTab === 'linkedin_note' && (
                <div className="glass-card p-5 flex flex-col gap-3 border-blue-500/20">
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#1e2740]">
                    <div className="flex items-center gap-2">
                      <LinkedinIcon className="w-4 h-4 fill-current text-blue-400" />
                      <span className="text-xs font-bold text-white">LinkedIn Connection Request Note</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        (result.linkedin_message?.length || 0) <= 300 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {result.linkedin_message?.length || 0} / 300 chars
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.linkedin_message || '', 'lin-note')}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-400 text-[10px] font-bold border border-blue-500/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
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

                  <div className="p-4 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl text-[12px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-500/30">
                    {result.linkedin_message}
                  </div>

                  <span className="text-[10px] text-slate-500">
                    💡 <b>Pro Tip:</b> Send alongside a standard LinkedIn profile invite to achieve a ~42% higher acceptance rate than empty invites.
                  </span>
                </div>
              )}

              {/* Tab 2: LinkedIn InMail Pitch */}
              {activeSubTab === 'linkedin_inmail' && (
                <div className="glass-card p-5 flex flex-col gap-3 border-violet-500/20">
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#1e2740]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-bold text-white">LinkedIn InMail / Recruiter Direct Message</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20">
                        {result.linkedin_inmail?.length || 0} chars
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.linkedin_inmail || '', 'lin-inmail')}
                      className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-600 hover:text-white text-violet-400 text-[10px] font-bold border border-violet-500/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedKey === 'lin-inmail' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy InMail
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl text-[12px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto selection:bg-violet-500/30">
                    {result.linkedin_inmail}
                  </div>
                </div>
              )}

              {/* Tab 3: Cold Email */}
              {activeSubTab === 'email' && (
                <div className="flex flex-col gap-3">
                  {/* Subject Line Card */}
                  <div className="glass-card p-4 flex justify-between gap-3 items-center border-indigo-500/20">
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        High-Open Subject Line
                      </span>
                      <span className="text-xs text-white font-semibold truncate block">{result.email_subject}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.email_subject || '', 'subj')}
                      className="p-2 bg-[#121826] hover:bg-[#1a2337] rounded-lg border border-[#1e2740] text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                      title="Copy Subject"
                    >
                      {copiedKey === 'subj' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Email Body Card */}
                  <div className="glass-card p-5 flex flex-col gap-3 border-indigo-500/20">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e2740]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Personalized Email Body
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.email_body || '', 'body')}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-400 text-[10px] font-bold border border-indigo-500/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
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

                    <div className="p-4 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl text-[12px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto selection:bg-indigo-500/30">
                      {result.email_body}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Day 5 Follow-Up */}
              {activeSubTab === 'followup' && (
                <div className="glass-card p-5 flex flex-col gap-3 border-amber-500/20">
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#1e2740]">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Day 5 Polite Follow-up Note</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.follow_up_message || '', 'followup-copy')}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-600 hover:text-white text-amber-400 text-[10px] font-bold border border-amber-500/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedKey === 'followup-copy' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Follow-up
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-[#0b1020]/90 border border-[#1e2740] rounded-xl text-[12px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-amber-500/30">
                    {result.follow_up_message}
                  </div>
                </div>
              )}

              {/* Psychology Strategy Box */}
              {result.psychology_tip && (
                <div className="p-4 bg-gradient-to-r from-violet-950/30 to-indigo-950/20 border border-violet-500/20 rounded-2xl text-left flex gap-3 items-start">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-white mb-0.5">Tactical Recruiter Psychology Insight</h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {result.psychology_tip}
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center gap-3.5 min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Send className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Ready to Generate Outreach</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Choose a tracked role from your pipeline or enter target company details, select a recipient persona, and click <b>Generate Outreach Suite</b>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
