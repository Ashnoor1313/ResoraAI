import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  TrendingUp, 
  TrendingDown, 
  Zap, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ShieldAlert, 
  CheckSquare, 
  Award,
  Building,
  Activity,
  Target
} from 'lucide-react';
import JdMatch from './JdMatch';


interface AtsAnalysisProps {
  reportData: {
    resume_id: number;
    target_role: string;
    experience_level?: string;
    score_overall: number;
    score_breakdown: any;
    extracted_data?: {
      name: string;
      email: string;
      phone: string;
      skills: string[];
      education: string[];
      experience: string[];
      projects: string[];
      certifications: string[];
    };
    formatting_issues: {
      warnings: string[];
      suggestions: string[];
      strengths: string[];
    };
    benchmarking: {
      rank_tier: string;
      summary: string;
      global_percentile: number;
      role?: string;
      level?: string;
      breakdown?: Record<string, number>;
    };
    recruiter_feedback?: {
      lacking_areas?: string[];
      improvement_points?: string[];
    };
    analysis_results?: any;
    recommendations?: Array<{
      category: string;
      problem: string;
      reason: string;
      suggested_fix: string;
      severity: string;
      priority: string;
      expected_impact: number;
    }>;
    company_intelligence?: Record<string, {
      company_name: string;
      alignment_score: number;
      matched_preferred_skills: string[];
      missing_preferred_skills: string[];
      resume_characteristics: string;
      project_expectation: string;
      achievement_expectation: string;
    }>;
    keyword_analysis: {
      resume_keywords: string[];
      jd_keywords: string[];
      matching_keywords: string[];
      missing_keywords: string[];
      semantic_matches: { jd_skill: string; resume_skill: string }[];
      jd_similarity_score: number;
    };
  };
  backendUrl: string;
  onScanComplete: (updatedReport: any) => void;
  onUpdateReport: (updatedReport: any) => void;
  token?: string;
}

const isMetadataLine = (line: string): boolean => {
  const clean = line.replace(/^[•\-\*▪◦●■\+\–\—\s]+/, '').trim().toLowerCase();
  if (!clean) return true;
  
  // 1. Duration / Dates
  const dateRegex = /(?:19|20)\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{2,4}/i;
  if (dateRegex.test(clean)) return true;

  // 2. Locations / Remote
  const locationRegex = /\b(remote|hybrid|on-site|onsite|india|usa|uk|canada|germany|london|toronto|vancouver|san francisco|sf|new york|ny|seattle|boston|austin|chicago|bengaluru|bangalore|pune|mumbai|delhi|noida|hyderabad|chennai|gurgaon)\b/i;
  const stateCodeRegex = /,\s*[A-Z]{2}\b/; // e.g., ", CA" or ", NY"
  if (locationRegex.test(clean) || stateCodeRegex.test(line)) return true;

  // 3. Educational degrees or terms
  const educationRegex = /\b(bachelor|master|phd|bs|ms|b\.tech|m\.tech|btech|mtech|degree|major|gpa|cgpa|university|college|school|institute|academy)\b/i;
  if (educationRegex.test(clean)) return true;

  // 3b. Company keywords/indicators
  const companyRegex = /\b(pvt|ltd|llc|co|corp|corporation|inc|gmbh|solutions|limited|private|technologies|systems|services|consultancy|consulting|industries|ventures|holdings)\b/i;
  if (companyRegex.test(clean)) return true;

  // 4. Job Titles / Company designations
  const titleKeywords = /\b(engineer|developer|intern|manager|lead|analyst|consultant|architect|designer|director|founder|specialist|co-founder|vp|head|president|executive|officer|administrator|coordinator|scrum master|student|candidate|contractor|freelancer|self-employed|temporary)\b/i;

  const words = clean.match(/\b[a-zA-Z]+\b/g) || [];
  const firstWord = words[0] || "";

  const startVerbs = new Set([
    "led", "built", "created", "developed", "implemented", "designed", "managed", "wrote", "optimized",
    "architected", "configured", "maintained", "coordinated", "collaborated", "assisted", "pioneered",
    "achieved", "improved", "scaled", "integrated", "analyzed", "tested", "deployed", "automated",
    "crafted", "increased", "reduced", "secured", "delivered", "spearheaded", "engineered", "refactored",
    "established", "formulated", "mentored", "trained", "facilitated", "oversaw", "directed", "monitored",
    "reviewed", "compiled", "presented", "conducted", "produced", "enhanced", "resolved", "strengthened",
    "accelerated", "maximized", "minimized", "exceeded", "outperformed", "boosted", "cut", "saved",
    "generated", "drove", "expanded", "grew", "negotiated", "partnered", "cultivated", "supported",
    "building", "developing", "implementing", "designing", "managing", "writing", "optimizing",
    "architecting", "configuring", "maintaining", "coordinating", "collaborating", "assisting",
    "pioneering", "achieving", "improving", "scaling", "integrating", "analyzing", "testing",
    "deploying", "automating", "crafting", "increasing", "reducing", "securing", "delivering",
    "spearheading", "engineering", "refactoring", "establishing", "mentoring", "training",
    "directing", "conducting", "producing", "enhancing", "resolving", "strengthening", "accelerating",
    "generating", "driving", "expanding", "growing", "partnering", "supported", "guiding", "advising",
    "worked", "working", "provided", "providing", "served", "serving", "performed", "performing"
  ]);

  const isStartVerb = startVerbs.has(firstWord);

  if (clean.length < 50 && titleKeywords.test(clean)) {
    if (!isStartVerb) return true;
  }

  // 5. Short lines (less than 20 chars) that don't start with action verbs
  if (clean.length < 20 && !isStartVerb) return true;

  // 6. Lines under 60 chars that do not contain any action verbs (e.g. project names/titles)
  const hasVerb = Array.from(startVerbs).some(v => new RegExp('\\b' + v + '\\b', 'i').test(clean));
  if (clean.length < 60 && !hasVerb) return true;

  return false;
};

const WEAK_BULLET_TEMPLATES = [
  "Built a chatbot for customer support.",
  "Responsible for maintaining the website frontend.",
  "Wrote SQL queries to make the database run faster.",
  "Worked on team projects using Python and Git."
];

export default function AtsAnalysis({ reportData, backendUrl, onScanComplete, onUpdateReport, token }: AtsAnalysisProps) {
  const { 
    score_overall, 
    score_breakdown, 
    formatting_issues, 
    benchmarking, 
    recruiter_feedback, 
    extracted_data, 
    resume_id, 
    target_role,
    recommendations = [],
    company_intelligence = {},
    keyword_analysis
  } = reportData;

  const [activeTab, setActiveTab] = useState<'health' | 'recommendations' | 'companies' | 'optimizer' | 'jd'>('health');

  
  // Company view state
  const [selectedCompany, setSelectedCompany] = useState<string>("google");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Close company dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Bullet Optimizer States
  const [inputBullet, setInputBullet] = useState("");
  const [selectedRawBullet, setSelectedRawBullet] = useState("");
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [applyingFix, setApplyingFix] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<{ original: string; rewritten: string; explanation: string } | null>(null);
  const [errorRewrite, setErrorRewrite] = useState("");
  const [fixAppliedSuccess, setFixAppliedSuccess] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState<'xyz' | 'star' | 'action' | 'quantified'>('xyz');
  const [isEditing, setIsEditing] = useState(false);
  const [editedRewritten, setEditedRewritten] = useState("");

  const breakdownItems = [
    { key: 'ats_compatibility', name: 'ATS Compatibility', color: 'bg-indigo-500', weight: 15, desc: 'Evaluates standard parsed block detection by applicant screening scanners.' },
    { key: 'recruiter_readability', name: 'Recruiter Readability', color: 'bg-amber-500', weight: 15, desc: 'Measures word counts, paragraphs density, and text flow for quick manual reviews.' },
    { key: 'formatting_safety', name: 'Formatting Safety', color: 'bg-sky-500', weight: 10, desc: 'Checks layout structure (columns, pictures, fonts) for parsing safety.' },
    { key: 'technical_quality', name: 'Technical Quality', color: 'bg-violet-500', weight: 15, desc: 'Audits skill counts, grouping depth, and duplicate entries.' },
    { key: 'achievement_quality', name: 'Achievement Quality', color: 'bg-emerald-500', weight: 15, desc: 'Evaluates STAR/XYZ compliance, active verbs, and quantified outcomes.' },
    { key: 'keyword_alignment', name: 'Keyword Alignment', color: 'bg-teal-500', weight: 15, desc: 'Audits skill overlap rates with target descriptions or benchmark models.' },
    { key: 'resume_completeness', name: 'Resume Completeness', color: 'bg-pink-500', weight: 10, desc: 'Ensures crucial sections, email addresses, phone, and links are populated.' },
    { key: 'industry_alignment', name: 'Industry Alignment', color: 'bg-blue-500', weight: 5, desc: 'Scores tech family alignments for targeted roles.' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  // Extract dynamic resume bullets for the optimizer card
  const resumeBullets = useMemo(() => {
    if (!extracted_data) return [];
    const rawBullets = [
      ...(extracted_data.experience || []),
      ...(extracted_data.projects || [])
    ];

    const bulletSymbols = ['•', '-', '*', '▪', '◦', '●', '■', '+', '–', '—'];

    return rawBullets
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        if (isMetadataLine(line)) return false;
        const firstChar = line.charAt(0);
        if (bulletSymbols.includes(firstChar)) return true;
        const hasDate = /(?:19|20)\d{2}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line);
        const hasSeparator = line.includes('|') || line.includes('  ') || line.split(',').length > 3;
        return line.length > 25 && !hasDate && !hasSeparator;
      })
      .map(line => {
        let cleaned = line;
        while (cleaned.length > 0 && (bulletSymbols.includes(cleaned.charAt(0)) || /\s/.test(cleaned.charAt(0)))) {
          cleaned = cleaned.substring(1).trim();
        }
        return {
          raw: line,
          clean: cleaned,
          isWeak: !/[\d%]/.test(cleaned)
        };
      })
      .filter(item => item.clean.length > 15);
  }, [extracted_data]);

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBullet.trim()) {
      setErrorRewrite("Enter a bullet point statement.");
      return;
    }

    setLoadingRewrite(true);
    setErrorRewrite("");
    setRewriteResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/rewrite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token || 'mock-token'}` 
        },
        body: JSON.stringify({ bullet: inputBullet, style: rewriteStyle })
      });

      if (!response.ok) throw new Error("Rewrite service failed.");
      const data = await response.json();
      setRewriteResult(data);
      setEditedRewritten(data.rewritten);
      setIsEditing(false);
    } catch (err: any) {
      setErrorRewrite(err.message || "Failed to rewrite.");
    } finally {
      setLoadingRewrite(false);
    }
  };

  const handleApplyFix = async () => {
    if (!rewriteResult) return;
    setApplyingFix(true);
    setErrorRewrite("");

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resume_id}/update-bullet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token || 'mock-token'}` 
        },
        body: JSON.stringify({ 
          original_bullet: selectedRawBullet || inputBullet, 
          new_bullet: rewriteResult.rewritten, 
          target_role: target_role 
        })
      });

      if (!response.ok) throw new Error("Auto-Fix failed.");
      const updatedReport = await response.json();
      onScanComplete(updatedReport);
      setRewriteResult(null);
      setInputBullet("");
      setSelectedRawBullet("");
      setFixAppliedSuccess(true);
      setTimeout(() => setFixAppliedSuccess(false), 8000);
    } catch (err: any) {
      setErrorRewrite(err.message || "Failed to apply fix.");
    } finally {
      setApplyingFix(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Score + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Score Gauge */}
        <div className="md:col-span-4 glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#1e2740" strokeWidth="6" fill="transparent" />
              <circle 
                cx="50" cy="50" r="42" 
                stroke={getScoreStroke(score_overall)}
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={263.89}
                strokeDashoffset={263.89 - (263.89 * score_overall) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className={`text-4xl font-bold tracking-tight ${getScoreColor(score_overall)}`}>{score_overall}</span>
              <span className="text-slate-500 text-xs block">/100</span>
            </div>
          </div>

          <div className="mt-4 text-center space-y-1.5 z-10">
            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
              score_overall >= 80 ? 'bg-emerald-500/10 text-emerald-400' 
              : score_overall >= 60 ? 'bg-amber-500/10 text-amber-400'
              : 'bg-red-500/10 text-red-400'
            }`}>
              {benchmarking.rank_tier}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">
              Top {100 - benchmarking.global_percentile}% of candidates in this level
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="md:col-span-8 glass-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />
          <div className="z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm text-slate-200">Explainable Resume Intelligence</h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                v2 platform active
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {benchmarking.summary}
            </p>
          </div>

          <div className="mt-5 p-3 bg-[#0f1525]/60 border border-[#1e2740] rounded-xl flex items-center justify-between text-xs z-10">
            <span className="text-slate-500">Industry Track: <strong className="text-slate-300 font-medium">{target_role}</strong> ({reportData.experience_level || 'Entry Level'})</span>
            <a href="#breakdown-detail" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
              View Action Plan <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-[#1e2740] gap-4" id="breakdown-detail">
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-all relative ${
            activeTab === 'health' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Health Breakdown
          {activeTab === 'health' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-all relative flex items-center gap-1.5 ${
            activeTab === 'recommendations' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Action Plan ({recommendations.length})
          {recommendations.length > 0 && (
            <span className="bg-indigo-500/10 text-indigo-400 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {recommendations.filter(r => r.severity === 'critical').length} Critical
            </span>
          )}
          {activeTab === 'recommendations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-all relative ${
            activeTab === 'companies' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Company Intelligence
          {activeTab === 'companies' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveTab('optimizer')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-all relative flex items-center gap-1 ${
            activeTab === 'optimizer' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Bullet Optimizer <Sparkles className="w-3 h-3 text-indigo-400" />
          {activeTab === 'optimizer' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveTab('jd')}
          className={`pb-3 text-xs font-semibold tracking-wider uppercase transition-all relative flex items-center gap-1.5 ${
            activeTab === 'jd' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Job Description Match <Target className="w-3.5 h-3.5 text-indigo-400" />
          {activeTab === 'jd' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>


      </div>

      {/* Tab Contents */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {breakdownItems.map((item) => {
              const scoreObj = (score_breakdown as any)[item.key];
              const scoreVal = typeof scoreObj === 'object' ? scoreObj.score : scoreObj || 0;
              const whyText = typeof scoreObj === 'object' ? scoreObj.why : item.desc;
              const estImprovement = typeof scoreObj === 'object' ? scoreObj.estimated_improvement : 0;
              const issues = typeof scoreObj === 'object' ? scoreObj.issues || [] : [];
              
              return (
                <div key={item.key} className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#1e2740] transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                      <span className={`text-lg font-extrabold ${getScoreColor(scoreVal)}`}>{scoreVal}%</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {whyText}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-1 bg-[#1e2740] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${scoreVal}%` }} />
                    </div>

                    {issues.length > 0 ? (
                      <div className="text-[10px] text-amber-500/80 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                        <strong>Gaps:</strong> {issues.join(', ')}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 bg-emerald-500/5 p-1.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Fully aligned</span>
                      </div>
                    )}

                    {estImprovement > 0 && (
                      <div className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">
                        Improvement Potential: +{estImprovement} score boost
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple warnings display fallback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2740]">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h3 className="font-medium text-sm text-slate-300">Formatting Warnings ({formatting_issues.warnings.length})</h3>
              </div>
              {formatting_issues.warnings.length > 0 ? (
                <div className="space-y-3">
                  {formatting_issues.warnings.map((w, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-300 font-medium">{w}</p>
                        {formatting_issues.suggestions[idx] && (
                          <p className="text-slate-500 mt-0.5">{formatting_issues.suggestions[idx]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  No formatting issues detected.
                </p>
              )}
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2740]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-medium text-sm text-slate-300">Strengths ({formatting_issues.strengths.length})</h3>
              </div>
              {formatting_issues.strengths.length > 0 ? (
                <ul className="space-y-2.5">
                  {formatting_issues.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No explicit formatting strengths catalogued.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioritized Improvements</h4>
            <span className="text-[10px] text-slate-500">Deterministic recommendations computed locally.</span>
          </div>

          {recommendations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-xl border relative overflow-hidden flex flex-col gap-2 ${
                    rec.severity === 'critical' 
                      ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/25' 
                      : rec.severity === 'warning' 
                      ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/25' 
                      : 'bg-slate-500/5 border-[#1e2740] hover:border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        rec.severity === 'critical' 
                          ? 'bg-red-500/10 text-red-400' 
                          : rec.severity === 'warning' 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {rec.severity}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Category: {rec.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                        Priority: {rec.priority}
                      </span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded">
                        +{rec.expected_impact} Score Boost
                      </span>
                    </div>
                  </div>

                  <h5 className="font-bold text-xs text-slate-200 mt-1">
                    {rec.problem}
                  </h5>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-500 font-semibold">Reason:</strong> {rec.reason}
                  </p>

                  <div className="mt-2 p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-[11px]">
                    <strong className="text-indigo-400 block mb-1">Suggested Fix:</strong>
                    <span className="text-slate-300 leading-relaxed">{rec.suggested_fix}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center glass-card flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h5 className="font-semibold text-sm text-slate-300">Perfect Score!</h5>
              <p className="text-xs text-slate-500 max-w-sm">
                No negative recommendations were generated for this resume. Everything is structured optimally.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="flex flex-col gap-4 animate-fade-in text-left">
          
          {/* Company Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1525]/30 border border-[#1e2740] rounded-2xl p-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Company Intelligence</h4>
              <p className="text-xs text-slate-500">Select a target company to inspect hiring alignment and requirements.</p>
            </div>
            
            {/* Custom Dropdown Selector */}
            <div className="relative w-full sm:w-64" ref={companyDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200 flex justify-between items-center transition-all cursor-pointer shadow-sm hover:bg-[#0f1525]/80 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{company_intelligence[selectedCompany]?.company_name || 'Select Company'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${
                    company_intelligence[selectedCompany]?.alignment_score >= 80 ? 'text-emerald-400' 
                    : company_intelligence[selectedCompany]?.alignment_score >= 60 ? 'text-amber-400' 
                    : 'text-red-400'
                  }`}>
                    {company_intelligence[selectedCompany]?.alignment_score || 0}% Match
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute top-full right-0 z-50 mt-1.5 w-full bg-[#0d1222]/95 backdrop-blur-md border border-[#1e2740] rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                  <div className="p-1 space-y-0.5">
                    {Object.keys(company_intelligence).map((key) => {
                      const comp = company_intelligence[key];
                      const isSel = selectedCompany === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(key);
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-500/20 text-white font-medium border-l-2 border-indigo-500 pl-2'
                              : 'text-slate-300 hover:bg-[#161f36] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{comp.company_name}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${
                            comp.alignment_score >= 80 ? 'text-emerald-400' 
                            : comp.alignment_score >= 60 ? 'text-amber-400' 
                            : 'text-red-400'
                          }`}>
                            {comp.alignment_score}% Match
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details column */}
          <div className="glass-card p-6 flex flex-col gap-4">
            {company_intelligence[selectedCompany] ? (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-[#1e2740]">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-sm text-slate-200">
                      {company_intelligence[selectedCompany].company_name} Expectations
                    </h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    company_intelligence[selectedCompany].alignment_score >= 80 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : company_intelligence[selectedCompany].alignment_score >= 60 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {company_intelligence[selectedCompany].alignment_score}% Fit Score
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Company Profile & Rubric</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {company_intelligence[selectedCompany].resume_characteristics}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 text-xs">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider block mb-1">Project Standards</span>
                      <p className="text-slate-400 leading-relaxed">
                        {company_intelligence[selectedCompany].project_expectation}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 text-xs">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider block mb-1">Achievement Focus</span>
                      <p className="text-slate-400 leading-relaxed">
                        {company_intelligence[selectedCompany].achievement_expectation}
                      </p>
                    </div>
                  </div>

                  {/* Preferred Skills audit */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">Preferred Skills Audit</span>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block mb-1">Matched Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {company_intelligence[selectedCompany].matched_preferred_skills.length > 0 ? (
                            company_intelligence[selectedCompany].matched_preferred_skills.map((skill) => (
                              <span key={skill} className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-500/10">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">None matched yet.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block mb-1">Missing Preferred Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {company_intelligence[selectedCompany].missing_preferred_skills.length > 0 ? (
                            company_intelligence[selectedCompany].missing_preferred_skills.map((skill) => (
                              <span key={skill} className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-red-500/10">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">All preferred skills listed!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                Select a company profile to view alignment.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-fade-in text-left">
          
          {/* How It is Validated Card */}
          <div className="lg:col-span-7 glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="font-medium text-sm text-slate-300">How Your Score is Validated</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              The overall score is a weighted calculation reflecting standard Applicant Tracking System (ATS) parsing requirements and professional recruiter criteria:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {breakdownItems.map((item) => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-[#0f1525]/30 border border-[#1e2740]/40 rounded-xl">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-[#1e2740] px-1.5 py-0.5 rounded">
                        Weight: {item.weight}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Bullet Point Optimizer & Fixes Card */}
          <div className="lg:col-span-5 glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="font-medium text-sm text-slate-300">AI Bullet Rewriter & Fixes</h3>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Select a bullet point from your resume to optimize. Rewriting statements with strong verbs and metrics directly boosts your Achievements score and overall compatibility.
            </p>

            {fixAppliedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex flex-col gap-1.5 animate-fade-in text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Line Successfully Updated!</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The optimized achievement has been auto-inserted into your active draft. You can view, copy, or download the updated resume from the <b>ATS Structured/Raw Simulator</b> below.
                </p>
              </div>
            )}

            {/* Selector / List */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-600 font-medium">
                  {resumeBullets.length > 0 ? "Detected Resume Bullets" : "Quick templates"}
                </span>
                {resumeBullets.length > 0 && (
                  <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {resumeBullets.length} found
                  </span>
                )}
              </div>

              {resumeBullets.length > 0 ? (
                <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {resumeBullets.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputBullet(item.clean);
                        setSelectedRawBullet(item.raw);
                      }}
                      className={`w-full text-left px-2.5 py-2 bg-[#0f1525]/40 hover:bg-[#141c2e] border transition-all text-[11px] rounded-lg flex items-center justify-between gap-2 ${
                        inputBullet === item.clean
                          ? 'border-indigo-500 bg-indigo-500/5 text-indigo-300'
                          : 'border-[#1e2740] text-slate-400'
                      }`}
                    >
                      <span className="truncate flex-1">{item.clean}</span>
                      {item.isWeak && (
                        <span className="shrink-0 text-[8px] font-semibold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                          Lacks metrics
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {WEAK_BULLET_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputBullet(tpl);
                        setSelectedRawBullet("");
                      }}
                      className={`w-full text-left px-2.5 py-1.5 bg-[#0f1525]/40 hover:bg-[#141c2e] border border-[#1e2740] text-[11px] text-slate-400 truncate rounded-lg transition-colors ${
                        inputBullet === tpl ? 'border-indigo-500 text-indigo-300' : ''
                      }`}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleRewrite} className="flex flex-col gap-3 mt-1">
              <textarea
                value={inputBullet}
                onChange={(e) => setInputBullet(e.target.value)}
                placeholder="Select a bullet from above or paste a custom one..."
                rows={3}
                className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed"
              />
              {errorRewrite && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/15 text-[11px] text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errorRewrite}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={loadingRewrite || applyingFix || !inputBullet.trim()}
                className={`py-2.5 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs transition-all ${
                  loadingRewrite
                    ? 'bg-[#1e2740] text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {loadingRewrite ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimizing...</>
                ) : 'Optimize Bullet'}
              </button>
            </form>

            {/* Result Block */}
            {rewriteResult && (
              <div className="flex flex-col gap-3 pt-3 border-t border-[#1e2740] animate-fade-in text-left">
                <div className="p-3 bg-[#0f1525]/60 border border-[#1e2740] rounded-xl">
                  <span className="text-[10px] text-slate-600 block mb-1">Suggested</span>
                  {isEditing ? (
                    <textarea
                      value={editedRewritten}
                      onChange={(e) => setEditedRewritten(e.target.value)}
                      rows={3}
                      className="w-full mt-1 bg-[#070b13] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  ) : (
                    <p className="text-xs font-medium text-emerald-400 leading-relaxed">
                      "{rewriteResult.rewritten}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRewriteResult({
                            ...rewriteResult,
                            rewritten: editedRewritten
                          });
                          setIsEditing(false);
                        }}
                        className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-all cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedRewritten(rewriteResult.rewritten);
                        }}
                        className="py-2 px-4 rounded-lg bg-[#1e2740] hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleApplyFix}
                        disabled={applyingFix}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        {applyingFix ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Accepting...</>
                        ) : (
                          'Accept'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedRewritten(rewriteResult.rewritten);
                        }}
                        className="py-2 px-4 rounded-lg bg-[#1e2740] hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setRewriteResult(null)}
                        className="py-2 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'jd' && (
        <div className="animate-fade-in">
          <JdMatch 
            resumeId={resume_id}
            keywordAnalysis={keyword_analysis}
            scoreOverall={score_overall}
            backendUrl={backendUrl}
            onUpdateReport={onUpdateReport}
            token={token}
          />
        </div>
      )}

    </div>
  );
}
