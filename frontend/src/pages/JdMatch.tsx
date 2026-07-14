import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

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
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMatchJd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      setErrorMsg("Paste a job description to run the match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

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
      setJdText("");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not match JD keywords.");
    } finally {
      setLoading(false);
    }
  };

  const similarityScore = keywordAnalysis.jd_similarity_score || 0;
  const totalSkills = keywordAnalysis.matching_keywords.length + keywordAnalysis.semantic_matches.length + keywordAnalysis.missing_keywords.length;
  const matchedSkills = keywordAnalysis.matching_keywords.length + keywordAnalysis.semantic_matches.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-left">
      
      {/* JD Input */}
      <form onSubmit={handleMatchJd} className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
          <Target className="w-4 h-4 text-indigo-400" />
          <h3 className="font-medium text-sm text-slate-300">Job Description Comparator</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Paste a target job posting to compare your skills against it.
        </p>

        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the job description here..."
          rows={10}
          className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600 leading-relaxed"
        />

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !jdText.trim()}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${
            loading || !jdText.trim()
              ? 'bg-[#1e2740] text-slate-600 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
          ) : (
            'Compare Skills'
          )}
        </button>
      </form>

      {/* Results */}
      <div className="flex flex-col gap-5">
        
        {/* Stats Row */}
        <div className="glass-card p-5 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Similarity</span>
            <span className="text-3xl font-bold text-white">{similarityScore}<span className="text-sm text-slate-500">%</span></span>
          </div>
          <div className="border-l border-[#1e2740] pl-4">
            <span className="text-[11px] text-slate-500 block mb-1">Skills Coverage</span>
            <span className="text-3xl font-bold text-indigo-400">{matchedSkills}<span className="text-sm text-slate-500">/{totalSkills}</span></span>
          </div>
        </div>

        {/* Skill Lists */}
        <div className="glass-card p-5 flex flex-col gap-4">
          
          {/* Semantic Matches */}
          {keywordAnalysis.semantic_matches?.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-violet-400 mb-2">Semantic Matches ({keywordAnalysis.semantic_matches.length})</h4>
              <div className="flex flex-wrap gap-1.5">
                {keywordAnalysis.semantic_matches.map((match, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md text-[11px] text-slate-300">
                    <span className="text-slate-500">{match.jd_skill}</span>
                    <span className="text-violet-400">→</span>
                    <span className="font-medium">{match.resume_skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          <div>
            <h4 className="text-xs font-medium text-red-400 mb-2">Missing ({keywordAnalysis.missing_keywords.length})</h4>
            {keywordAnalysis.missing_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {keywordAnalysis.missing_keywords.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/15 rounded-md text-[11px] text-red-400">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> All skills covered!
              </p>
            )}
          </div>

          {/* Matching */}
          <div>
            <h4 className="text-xs font-medium text-emerald-400 mb-2">Matching ({keywordAnalysis.matching_keywords.length})</h4>
            {keywordAnalysis.matching_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {keywordAnalysis.matching_keywords.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-md text-[11px] text-emerald-400">{skill}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No matching keywords found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
