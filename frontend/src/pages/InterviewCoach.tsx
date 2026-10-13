import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Check, 
  Copy, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  BookOpen, 
  Mic, 
  MicOff, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  RotateCcw,
  Target,
  FileCheck,
  Building,
  Zap,
  Volume2
} from 'lucide-react';

interface InterviewCoachProps {
  resumeId: number;
  targetRole: string;
  backendUrl: string;
  token: string;
  isMockMode?: boolean;
}

interface StarFramework {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface InterviewQuestion {
  question: string;
  bullet_ref: string;
  star_framework: StarFramework;
  draft_answer: string;
  pro_tips: string;
}

interface EvaluationResult {
  overall_score: number;
  verdict: string;
  star_ratings: {
    situation: { score: number; feedback: string };
    task: { score: number; feedback: string };
    action: { score: number; feedback: string };
    result: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  refined_answer: string;
  pacing_feedback: string;
  filler_words: Array<{ word: string; count: number }>;
  word_count: number;
}

export default function InterviewCoach({
  resumeId,
  targetRole,
  backendUrl,
  token,
  isMockMode = false,
}: InterviewCoachProps) {
  const [companyName, setCompanyName] = useState('Google');
  const [role, setRole] = useState(targetRole || 'Software Engineer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ questions: InterviewQuestion[] } | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Pipeline Applications prefill
  const [trackedApps, setTrackedApps] = useState<any[]>([]);
  
  // Active Tab Mode for current question: 'breakdown' (Study) vs 'practice' (Live Evaluation)
  const [activeMode, setActiveMode] = useState<'breakdown' | 'practice'>('breakdown');
  
  // Practice Arena States
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  
  // Evaluation States
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [evalHistory, setEvalHistory] = useState<Record<number, EvaluationResult>>({});
  const [copiedRefined, setCopiedRefined] = useState(false);

  // Load tracked applications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumeiq_applications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(a => !['1', '2', '3', '4'].includes(a.id));
          setTrackedApps(clean);
          if (clean.length > 0 && clean[0].company) {
            setCompanyName(clean[0].company);
            if (clean[0].title) setRole(clean[0].title);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setPracticeAnswer(prev => {
              const separator = prev && !prev.endsWith(' ') ? ' ' : '';
              return prev + separator + currentTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
          clearInterval(timerRef.current);
        };

        recognition.onend = () => {
          setIsRecording(false);
          clearInterval(timerRef.current);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition not initialized', err);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Timer handler
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (!recognitionRef.current) {
        alert("Voice recognition is not supported in this browser. You can type your answer directly in the box.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } catch (err) {
        console.warn("Could not start microphone:", err);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, isRefined = false) => {
    navigator.clipboard.writeText(text);
    if (isRefined) {
      setCopiedRefined(true);
      setTimeout(() => setCopiedRefined(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyName.trim()) {
      setError('Please provide a target company name.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setSelectedQuestionIndex(0);
    setEvalResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/interview-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`,
        },
        body: JSON.stringify({
          resume_id: resumeId || 1,
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

  const handleEvaluateAnswer = async () => {
    if (!practiceAnswer.trim()) {
      setError('Please type or record an answer before evaluating.');
      return;
    }
    setError('');
    setEvaluating(true);

    const activeQ = result?.questions?.[selectedQuestionIndex];

    try {
      const response = await fetch(`${backendUrl}/api/v1/tools/interview-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({
          question: activeQ?.question || 'Tell me about a time you solved a technical bottleneck.',
          user_answer: practiceAnswer,
          target_role: role,
          company_name: companyName,
          resume_bullet: activeQ?.bullet_ref || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer. Please try again.');
      }

      const evalData: EvaluationResult = await response.json();
      setEvalResult(evalData);
      setEvalHistory(prev => ({
        ...prev,
        [selectedQuestionIndex]: evalData
      }));
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI evaluator.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectTrackedApp = (app: any) => {
    setCompanyName(app.company || '');
    if (app.title) setRole(app.title);
  };

  const activeQuestion = result?.questions?.[selectedQuestionIndex];
  const wordCount = practiceAnswer.trim() ? practiceAnswer.trim().split(/\s+/).length : 0;
  const currentQEval = evalHistory[selectedQuestionIndex] || evalResult;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 65) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (score >= 65) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Interactive Arena
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Real-Time STAR Rubric
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              AI Mock Interview Coach & Live STAR Evaluator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Practice answering company-tailored behavioral questions generated from your real accomplishments. Record or type your response to receive instant rubric scoring, pacing feedback, filler word analysis, and an exemplar polished answer.
            </p>
          </div>

          {/* Pipeline quick sync pills */}
          {trackedApps.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-100 dark:bg-[#090e1a]/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Building className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                Sync From Pipeline:
              </span>
              <div className="flex flex-wrap gap-1.5 max-w-xs">
                {trackedApps.slice(0, 3).map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleSelectTrackedApp(app)}
                    className="px-2 py-1 rounded bg-white dark:bg-[#0f1525] hover:bg-slate-50 dark:hover:bg-indigo-600/30 border border-slate-200 dark:border-slate-700/60 text-[10.5px] text-slate-700 dark:text-slate-200 truncate transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title={`${app.title} at ${app.company}`}
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{app.company}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[9.5px]">({app.title})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Config & Questions List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Target Setup Card */}
          <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Target Company
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Stripe, Meta, Amazon"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Quick company presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
              {['Google', 'Stripe', 'Amazon', 'Meta', 'Netflix', 'OpenAI'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCompanyName(c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    companyName.toLowerCase() === c.toLowerCase()
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs mt-1 shadow-md cursor-pointer ${
                loading || !companyName.trim()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-98'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing STAR Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{result ? 'Re-Generate Questions' : 'Generate STAR Prep'}</span>
                </>
              )}
            </button>
          </form>

          {/* Questions Navigation Sidebar */}
          {result?.questions && (
            <div className="glass-card p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Behavioral Syllabus ({result.questions.length})
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {Object.keys(evalHistory).length}/{result.questions.length} Evaluated
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {result.questions.map((q: any, idx: number) => {
                  const hasEval = evalHistory[idx];
                  const isSelected = selectedQuestionIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedQuestionIndex(idx);
                        setPracticeAnswer('');
                        setEvalResult(evalHistory[idx] || null);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 group cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-sm'
                          : 'bg-[#080d1a]/60 border-slate-800 text-slate-400 hover:bg-[#0f1525] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                          Question {idx + 1}
                        </span>
                        {hasEval ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${getScoreBg(hasEval.overall_score)}`}>
                            {hasEval.overall_score}/100
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                            Practice →
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] line-clamp-2 text-slate-400 leading-snug">
                        {q.question}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activeQuestion ? (
            <div className="flex flex-col gap-5 animate-fade-in text-left">
              {/* Question Header Card */}
              <div className="glass-card p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-transparent relative">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Behavioral Prompt · {companyName} Culture
                    </span>
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      "{activeQuestion.question}"
                    </h3>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex bg-[#090e1a] p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => setActiveMode('breakdown')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeMode === 'breakdown'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Study Script
                    </button>
                    <button
                      onClick={() => setActiveMode('practice')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeMode === 'practice'
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      Practice Arena
                    </button>
                  </div>
                </div>

                {/* Linked resume achievement */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2.5">
                  <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-0.5">
                      Ground Truth (From Your Resume)
                    </span>
                    <p className="text-[11px] text-slate-300 italic font-mono leading-relaxed">
                      "{activeQuestion.bullet_ref}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode 1: Study STAR Breakdown */}
              {activeMode === 'breakdown' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {/* STAR 4-Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="glass-card p-4 rounded-xl border-l-2 border-l-indigo-500">
                      <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block mb-1">
                        Situation (Context)
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {activeQuestion.star_framework?.situation}
                      </p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border-l-2 border-l-blue-500">
                      <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider block mb-1">
                        Task (Goal)
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {activeQuestion.star_framework?.task}
                      </p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border-l-2 border-l-violet-500">
                      <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider block mb-1">
                        Action (Execution)
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {activeQuestion.star_framework?.action}
                      </p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border-l-2 border-l-emerald-500">
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block mb-1">
                        Result (Outcome & Metric)
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {activeQuestion.star_framework?.result}
                      </p>
                    </div>
                  </div>

                  {/* Verbal Draft Script */}
                  <div className="glass-card p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Tailored Verbal Delivery Script
                      </span>
                      <button
                        onClick={() => handleCopy(activeQuestion.draft_answer || '')}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-[11px] font-semibold border border-indigo-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
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

                    <div className="p-4 bg-[#080d1a]/80 border border-slate-800/80 rounded-xl leading-relaxed text-xs text-slate-200 font-sans italic">
                      "{activeQuestion.draft_answer}"
                    </div>
                  </div>

                  {/* Pro Tips */}
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white mb-0.5">
                        {companyName} Interview Rubric Tips
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {activeQuestion.pro_tips}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Interactive Practice Arena */}
              {activeMode === 'practice' && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  {/* Practice Answer Box */}
                  <div className="glass-card p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Your Practice Response</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({wordCount} words · ~{Math.max(1, Math.round(wordCount / 130))} min speaking time)
                        </span>
                      </span>

                      {/* Microphone Voice Input Button */}
                      <div className="flex items-center gap-2">
                        {isRecording && (
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {formatTimer(recordingSeconds)}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={toggleRecording}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isRecording
                              ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-500/50'
                              : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-3.5 h-3.5 text-white" />
                              <span>Stop Recording</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Record Speech</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={practiceAnswer}
                      onChange={(e) => setPracticeAnswer(e.target.value)}
                      placeholder="Start speaking or type your verbal answer here. (e.g. 'At my previous role, we had a major query performance regression...')"
                      rows={5}
                      className="w-full p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans placeholder-slate-600"
                    />

                    {/* Action Bar */}
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => setPracticeAnswer(
                          `At my previous company, our service began experiencing severe database latency during peak traffic hours. As the backend developer on call, I took full ownership of the investigation. I profiled our slow query logs, identified unindexed table scans, and implemented a Redis caching layer for frequent read operations. Within two days, we reduced database load by 45% and brought average response times down from 800ms to 45ms without any downtime.`
                        )}
                        className="text-[11px] text-slate-400 hover:text-indigo-400 font-medium transition-colors"
                      >
                        Try Sample Answer →
                      </button>

                      <div className="flex items-center gap-2">
                        {practiceAnswer && (
                          <button
                            type="button"
                            onClick={() => setPracticeAnswer('')}
                            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleEvaluateAnswer}
                          disabled={evaluating || !practiceAnswer.trim()}
                          className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                            evaluating || !practiceAnswer.trim()
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:brightness-110 shadow-indigo-500/25 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {evaluating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Grading with STAR Rubric...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Evaluate Answer with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Evaluation Result */}
                  {currentQEval && (
                    <div className="glass-card p-6 flex flex-col gap-5 border border-indigo-500/40 bg-[#090e1a]/95 rounded-2xl shadow-xl animate-fade-in">
                      {/* Top Overall Verdict Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                            Evaluator Assessment · {companyName} Hiring Standard
                          </span>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-2xl font-extrabold ${getScoreColor(currentQEval.overall_score)}`}>
                              {currentQEval.overall_score}/100
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBg(currentQEval.overall_score)}`}>
                              {currentQEval.verdict}
                            </span>
                          </div>
                        </div>

                        {/* Filler words indicator */}
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0f1525] border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-semibold">Filler Phrases:</span>
                          {currentQEval.filler_words && currentQEval.filler_words.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {currentQEval.filler_words.map((fw, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[10px] font-mono font-bold">
                                  {fw.count}x "{fw.word}"
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                              0 Clean Pacing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* STAR Dimensions Breakdown */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-3">
                          STAR Method Dimension Breakdown
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {Object.entries(currentQEval.star_ratings).map(([dimension, data]) => {
                            const label = dimension.charAt(0).toUpperCase() + dimension.slice(1);
                            return (
                              <div key={dimension} className="p-3.5 rounded-xl bg-[#0f1525]/60 border border-slate-800/80 flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">{label}</span>
                                  <span className={`text-xs font-extrabold ${getScoreColor(data.score)}`}>
                                    {data.score}%
                                  </span>
                                </div>
                                {/* Bar meter */}
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      data.score >= 80 ? 'bg-emerald-400' : data.score >= 65 ? 'bg-amber-400' : 'bg-rose-400'
                                    }`}
                                    style={{ width: `${data.score}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                                  {data.feedback}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Strengths & Improvements Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Candidate Strengths
                          </span>
                          <ul className="space-y-1.5">
                            {currentQEval.strengths.map((str, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-snug">
                                <span className="text-emerald-400 shrink-0">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Improvements */}
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Key Areas to Polish
                          </span>
                          <ul className="space-y-1.5">
                            {currentQEval.improvements.map((imp, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-snug">
                                <span className="text-amber-400 shrink-0">•</span>
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Exemplar Polished Answer */}
                      {currentQEval.refined_answer && (
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/25 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              AI Hiring Manager's Exemplar Polish
                            </span>
                            <button
                              onClick={() => handleCopy(currentQEval.refined_answer, true)}
                              className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedRefined ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedRefined ? 'Copied' : 'Copy Exemplar'}
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
                            "{currentQEval.refined_answer}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-500 text-center gap-3 min-h-[460px] h-full">
              <HelpCircle className="w-8 h-8 text-slate-700 animate-pulse-slow" />
              <p className="text-xs text-slate-400 max-w-sm">
                Enter your target company and role, then click <b>Generate STAR Prep</b>. The coach will synthesize tailored questions from your actual resume accomplishments and let you practice in the live simulation arena.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
