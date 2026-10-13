import React, { useState } from 'react';
import { 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Briefcase, 
  Building, 
  MapPin, 
  Sparkles, 
  Link2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Check,
  GraduationCap,
  Clock,
  ClipboardList,
  ArrowRight,
  Plus,
  Bookmark,
  RotateCcw
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

interface JdMatchProps {
  resumeId: number;
  keywordAnalysis: {
    resume_keywords: string[];
    jd_keywords: string[];
    matching_keywords: string[];
    missing_keywords: string[];
    semantic_matches: { jd_skill: string; resume_skill: string }[];
    jd_similarity_score: number;
  };
  scoreOverall: number;
  backendUrl: string;
  onUpdateReport: (updatedReport: any) => void;
  token?: string;
}

export default function JdMatch({ 
  resumeId, 
  keywordAnalysis, 
  scoreOverall, 
  backendUrl,
  onUpdateReport,
  token
}: JdMatchProps) {
  const [mode, setMode] = useState<'linkedin' | 'manual'>('linkedin');
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [savedAppSuccess, setSavedAppSuccess] = useState(false);
  
  // Scraped Job Details State
  const [scrapedData, setScrapedData] = useState<{
    job_info: {
      job_id: string;
      job_title: string;
      company_name: string;
      location: string;
      employment_type: string;
      seniority_level: string;
      job_description: string;
      job_url: string;
      source: string;
    };
    keywords: {
      all_extracted_skills: string[];
      hard_skills: string[];
      tools_and_platforms: string[];
      soft_skills: string[];
      total_skills_count: number;
    };
    requirements: {
      experience: string;
      education: string;
    };
    match_analysis?: {
      match_score: number;
      matching_keywords: string[];
      missing_keywords: string[];
      semantic_matches: { jd_skill: string; resume_skill: string }[];
      recommended_focus: string[];
    };
  } | null>(null);

  // Manual JD Compare
  const handleMatchManualJd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      setErrorMsg("Paste a job description to run the match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/match-jd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({ job_description: jdText })
      });

      if (!response.ok) throw new Error("Match calculation failed.");

      const updatedReport = await response.json();
      onUpdateReport(updatedReport);
      setSuccessMsg("Resume comparison successfully updated!");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not match JD keywords.");
    } finally {
      setLoading(false);
    }
  };

  // LinkedIn URL Scrape & Semantic Ingestion
  const handleScrapeLinkedin = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = customUrl || linkedinUrl;
    if (!targetUrl.trim()) {
      setErrorMsg("Please enter a LinkedIn job URL or Job ID.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${backendUrl}/api/v1/linkedin/scrape-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({
          url: targetUrl.trim(),
          resume_id: resumeId,
          apply_to_resume: true // Automatically sync ATS score & keywords
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to scrape LinkedIn job posting.");
      }

      const data = await response.json();
      setScrapedData(data);

      if (data.updated_report) {
        onUpdateReport(data.updated_report);
        setSuccessMsg(`Successfully scraped "${data.job_info?.job_title}" at ${data.job_info?.company_name} and synced ATS score!`);
      } else {
        setSuccessMsg(`Successfully scraped "${data.job_info?.job_title}" at ${data.job_info?.company_name}!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Encountered an error fetching LinkedIn posting.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToApplications = async (overrideStatus: 'applied' | 'interviewing' = 'applied') => {
    if (!scrapedData) return;
    setSavingApp(true);
    
    const matchScore = currentAnalysis?.similarityScore ?? (scrapedData.match_analysis?.match_score || 0);
    const newApp = {
      id: Date.now().toString(),
      title: scrapedData.job_info.job_title,
      company: scrapedData.job_info.company_name,
      salary: "Competitive",
      location: scrapedData.job_info.location || "Remote",
      status: overrideStatus,
      date: new Date().toISOString().split('T')[0],
      link: scrapedData.job_info.job_url || "",
      notes: `Target ATS Match Score: ${matchScore}%`,
      match_score: matchScore,
      skills: scrapedData.keywords?.all_extracted_skills?.slice(0, 10) || []
    };

    // 1. Save to localStorage for instant local/sandbox persistence
    try {
      const existing = localStorage.getItem("resumeiq_applications");
      const list = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((a: any) => !(a.title === newApp.title && a.company === newApp.company));
      localStorage.setItem("resumeiq_applications", JSON.stringify([newApp, ...filtered]));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    // 2. Sync to backend API
    try {
      await fetch(`${backendUrl}/api/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify(newApp)
      });
    } catch (e) {
      console.error("Backend application sync notice:", e);
    }

    setSavingApp(false);
    setSavedAppSuccess(true);
  };

  const [clearingJd, setClearingJd] = useState(false);

  const handleClearJd = async () => {
    setClearingJd(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/clear-jd`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || 'mock-token'}`
        }
      });
      if (!response.ok) throw new Error("Failed to reset target job comparison.");
      const updatedReport = await response.json();
      onUpdateReport(updatedReport);
      setScrapedData(null);
      setLinkedinUrl("");
      setJdText("");
      setSuccessMsg("Target job comparison cleared. Ready for a new job description.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset comparison.");
    } finally {
      setClearingJd(false);
    }
  };

  const hasScrapedJd = Boolean(scrapedData && scrapedData.match_analysis);
  const hasManualJd = Boolean(
    keywordAnalysis && 
    keywordAnalysis.jd_keywords && 
    keywordAnalysis.jd_keywords.length > 0 &&
    (keywordAnalysis.matching_keywords?.length > 0 || keywordAnalysis.missing_keywords?.length > 0 || keywordAnalysis.jd_similarity_score > 0)
  );

  const hasActiveComparison = mode === 'linkedin' ? hasScrapedJd : hasManualJd;

  const currentAnalysis = hasScrapedJd && scrapedData?.match_analysis 
    ? {
        similarityScore: scrapedData.match_analysis.match_score,
        matchingKeywords: scrapedData.match_analysis.matching_keywords || [],
        missingKeywords: scrapedData.match_analysis.missing_keywords || [],
        semanticMatches: scrapedData.match_analysis.semantic_matches || [],
      }
    : hasManualJd && keywordAnalysis
    ? {
        similarityScore: keywordAnalysis.jd_similarity_score || 0,
        matchingKeywords: keywordAnalysis.matching_keywords || [],
        missingKeywords: keywordAnalysis.missing_keywords || [],
        semanticMatches: keywordAnalysis.semantic_matches || [],
      }
    : null;

  const totalSkills = currentAnalysis 
    ? (currentAnalysis.matchingKeywords.length + currentAnalysis.semanticMatches.length + currentAnalysis.missingKeywords.length)
    : 0;
  const matchedSkills = currentAnalysis 
    ? (currentAnalysis.matchingKeywords.length + currentAnalysis.semanticMatches.length)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
      
      {/* Left Column: Input Form (Scraper or Manual) */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        
        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-[#1e2740] rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('linkedin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'linkedin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkedinIcon className="w-3.5 h-3.5 fill-current" />
            LinkedIn Job Scraper
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setErrorMsg(''); setSuccessMsg(''); }}
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

        {/* LinkedIn Scraper Card */}
        {mode === 'linkedin' ? (
          <form onSubmit={(e) => handleScrapeLinkedin(e)} className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2740]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <LinkedinIcon className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">LinkedIn URL Scraper</h3>
                  <span className="text-[10px] text-slate-500">Extracts title, company, requirements & keywords</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Sync
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Paste any public LinkedIn job link. ResoraAI will scrape the job description, extract key skill requirements, and benchmark your resume.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> LinkedIn Job URL or ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/4123456789..."
                  className="w-full bg-white dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-all font-mono shadow-sm"
                />
              </div>
            </div>

            {/* Quick Demo Pre-fill Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  const url = "https://www.linkedin.com/jobs/view/4129849201";
                  setLinkedinUrl(url);
                  handleScrapeLinkedin(undefined, url);
                }}
                className="text-[10px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:text-slate-300 dark:border-slate-700/40 transition-all cursor-pointer"
              >
                Stripe Full Stack
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = "https://www.linkedin.com/jobs/view/4198273611";
                  setLinkedinUrl(url);
                  handleScrapeLinkedin(undefined, url);
                }}
                className="text-[10px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:text-slate-300 dark:border-slate-700/40 transition-all cursor-pointer"
              >
                Datadog Backend
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !linkedinUrl.trim()}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-xs cursor-pointer shadow-lg ${
                loading || !linkedinUrl.trim()
                  ? 'bg-slate-200 dark:bg-[#1e2740] text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scraping & Ingesting LinkedIn Job...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Scrape & Compare With Resume
                </>
              )}
            </button>
          </form>
        ) : (
          /* Manual JD Input Form */
          <form onSubmit={handleMatchManualJd} className="glass-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#1e2740]">
              <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-300">Job Description Comparator</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste any custom job description text to compare your skills against it.
            </p>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste raw job description here..."
              rows={9}
              className="w-full bg-white dark:bg-[#0f1525] border border-slate-200 dark:border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 leading-relaxed font-sans shadow-sm"
            />

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !jdText.trim()}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-xs cursor-pointer ${
                loading || !jdText.trim()
                  ? 'bg-slate-100 dark:bg-[#1e2740] text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-transparent cursor-not-allowed shadow-none'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                'Compare Skills'
              )}
            </button>
          </form>
        )}

        {/* Scraped Job Information Card (if available) */}
        {scrapedData && (
          <div className="glass-card p-5 border-blue-500/30 flex flex-col gap-4 bg-gradient-to-b from-blue-950/20 to-slate-900/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block mb-1">
                  Active LinkedIn Target Job
                </span>
                <h4 className="text-base font-bold text-white leading-tight">
                  {scrapedData.job_info.job_title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-200">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    {scrapedData.job_info.company_name}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {scrapedData.job_info.location}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
                    {scrapedData.job_info.employment_type}
                  </span>
                </div>
              </div>

              {scrapedData.job_info.job_url && (
                <a
                  href={scrapedData.job_info.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all shrink-0"
                  title="View on LinkedIn"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Requirements Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0c1222] border border-slate-800/60 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">Experience</span>
                  <span className="text-slate-300 font-medium text-[11px] truncate block">
                    {scrapedData.requirements.experience}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0c1222] border border-slate-800/60 text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">Education</span>
                  <span className="text-slate-300 font-medium text-[11px] truncate block">
                    {scrapedData.requirements.education}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Skills Categorization */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-300">
                Extracted Job Skills ({scrapedData.keywords.total_skills_count})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {scrapedData.keywords.hard_skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
                    {s}
                  </span>
                ))}
                {scrapedData.keywords.tools_and_platforms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-300">
                    {s}
                  </span>
                ))}
                {scrapedData.keywords.soft_skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Collapsible Scraped Description */}
            <div className="pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>View Raw Job Description</span>
                {showFullDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showFullDesc && (
                <div className="mt-3 p-3 rounded-xl bg-[#090d19] border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-mono">
                  {scrapedData.job_info.job_description}
                </div>
              )}
            </div>

            {/* 1-Click Track in Applications Pipeline */}
            <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
              {savedAppSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Tracked in Applications ({currentAnalysis?.similarityScore ?? (scrapedData.match_analysis?.match_score || 0)}% Match)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('resumeiq:navigate', { detail: 'applications' }))}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>View Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveToApplications('applied')}
                    disabled={savingApp}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {savingApp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Tracker...</span>
                      </>
                    ) : (
                      <>
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Track as Applied ({currentAnalysis?.similarityScore ?? (scrapedData.match_analysis?.match_score || 0)}% Match)</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveToApplications('interviewing')}
                    disabled={savingApp}
                    className="py-2.5 px-3 rounded-xl bg-[#0f1525] hover:bg-indigo-500/10 border border-[#1e2740] hover:border-indigo-500/30 text-indigo-300 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Track directly in Interviewing stage"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Interviewing</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Comparative Results & Keyword Gap Matrix or Empty State */}
      <div className="lg:col-span-6 flex flex-col gap-5">
        {!hasActiveComparison || !currentAnalysis ? (
          /* Empty State: Shown when user has not entered a link or JD text yet */
          <div className="glass-card p-8 flex flex-col items-center text-center justify-center min-h-[460px] gap-5 border border-dashed border-slate-300 dark:border-[#1e2740] bg-slate-50/70 dark:bg-gradient-to-b dark:from-[#0b1020]/60 dark:to-[#0e1424]/40 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              {mode === 'linkedin' ? (
                <LinkedinIcon className="w-8 h-8 fill-current text-blue-600 dark:text-blue-400" />
              ) : (
                <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            <div className="max-w-md flex flex-col gap-2">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {mode === 'linkedin' ? 'No LinkedIn Job Analyzed Yet' : 'No Target Job Description Added'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {mode === 'linkedin'
                  ? 'Paste any public LinkedIn job URL or Job ID into the input on the left and click "Scrape & Compare With Resume", or select a Quick Test role to see live skill matches.'
                  : 'Paste the target job description into the comparator box on the left and click "Compare Skills" to benchmark your resume against it.'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-lg mt-2 text-left">
              <div className="p-3 bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1e2740] rounded-xl flex flex-col gap-1 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Step 1</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{mode === 'linkedin' ? 'Provide URL' : 'Paste JD'}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{mode === 'linkedin' ? 'Public posting link or ID' : 'Full role description'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1e2740] rounded-xl flex flex-col gap-1 shadow-xs">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Step 2</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Extract Skills</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Live parser extracts key requirements</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1e2740] rounded-xl flex flex-col gap-1 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 3</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Match & Score</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Uncover gaps & ATS alignment</span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Comparison Results Dashboard */
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Header Badge & Reset Button */}
            <div className="flex items-center justify-between p-3 px-4 glass-card border-blue-500/20 bg-blue-50 dark:bg-blue-950/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {hasScrapedJd 
                    ? `Live Match: ${scrapedData?.job_info?.job_title} at ${scrapedData?.job_info?.company_name}`
                    : 'Target Job Description Match'
                  }
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearJd}
                disabled={clearingJd}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear current job comparison"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${clearingJd ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            </div>

            {/* Stats Row */}
            <div className="glass-card p-5 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">ATS JD Similarity</span>
                <span className={`text-3xl font-extrabold tracking-tight ${
                  currentAnalysis.similarityScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                  currentAnalysis.similarityScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {currentAnalysis.similarityScore}
                  <span className="text-sm font-normal text-slate-500 ml-0.5">%</span>
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-[#1e2740] pl-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Keywords Coverage</span>
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {matchedSkills}
                  <span className="text-sm font-normal text-slate-500 ml-0.5">/{totalSkills}</span>
                </span>
              </div>
            </div>

            {/* Actionable Recommendations (if available from scraping) */}
            {scrapedData?.match_analysis?.recommended_focus && scrapedData.match_analysis.recommended_focus.length > 0 && (
              <div className="glass-card p-4 border-indigo-500/20 bg-indigo-950/10">
                <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  ATS Optimization Recommendations
                </h4>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
                  {scrapedData.match_analysis.recommended_focus.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skill Lists */}
            <div className="glass-card p-5 flex flex-col gap-4">
              
              {/* Semantic Matches */}
              {currentAnalysis.semanticMatches?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-violet-400 mb-2 flex items-center justify-between">
                    <span>Semantic Matches ({currentAnalysis.semanticMatches.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Close equivalent skills found</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAnalysis.semanticMatches.map((match, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/25 rounded-md text-[11px] text-slate-200">
                        <span className="text-slate-400">{match.jd_skill}</span>
                        <span className="text-violet-400 font-bold">≈</span>
                        <span className="font-semibold text-violet-300">{match.resume_skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              <div>
                <h4 className="text-xs font-semibold text-rose-400 mb-2 flex items-center justify-between">
                  <span>Missing Keywords ({currentAnalysis.missingKeywords.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Add these to pass ATS filters</span>
                </h4>
                {currentAnalysis.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {currentAnalysis.missingKeywords.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-[11px] font-medium text-rose-400">
                        +{skill}
                      </span>
                    ))}
                  </div>
                ) : totalSkills > 0 ? (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-1">
                    <CheckCircle2 className="w-4 h-4" /> All targeted keywords matched in your resume!
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">No technical skills detected in the target job description.</p>
                )}
              </div>

              {/* Matching Skills */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
                  <span>Matching Keywords ({currentAnalysis.matchingKeywords.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Present in both resume & JD</span>
                </h4>
                {currentAnalysis.matchingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {currentAnalysis.matchingKeywords.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">No matching keywords found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
