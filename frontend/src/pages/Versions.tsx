import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  GitBranch, 
  GitCompare, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  RefreshCw, 
  Clock,
  CheckCircle
} from 'lucide-react';

interface ScanHistoryItem {
  resume_id: number;
  filename: string;
  version: number;
  created_at: string;
  score_overall: number;
  target_role: string;
}

interface VersionsProps {
  historyData: ScanHistoryItem[];
  currentResumeId: number;
  onSelectResume: (resumeId: number) => void;
  backendUrl: string;
  token?: string;
}

export default function Versions({
  historyData,
  currentResumeId,
  onSelectResume,
  backendUrl,
  token
}: VersionsProps) {
  const [compareV1, setCompareV1] = useState<number | "">("");
  const [compareV2, setCompareV2] = useState<number | "">("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorCompare, setErrorCompare] = useState("");

  const chartData = [...historyData]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((item) => ({
      name: `v${item.version}`,
      Score: item.score_overall,
      date: new Date(item.created_at).toLocaleDateString()
    }));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCompare = async () => {
    if (!compareV1 || !compareV2) return;
    setLoadingCompare(true);
    setErrorCompare("");
    setComparisonResult(null);
    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/compare/${compareV1}/${compareV2}`, {
        headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
      });
      if (!response.ok) throw new Error("Comparison failed. Make sure both scan versions are valid.");
      const data = await response.json();
      setComparisonResult(data);
    } catch (err: any) {
      setErrorCompare(err.message || "Failed to compare versions.");
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (compareV1 && compareV2) {
      handleCompare();
    }
  }, [compareV1, compareV2]);

  const breakdownMetrics = [
    { key: 'ats_compatibility', name: 'ATS Compatibility' },
    { key: 'recruiter_readability', name: 'Recruiter Readability' },
    { key: 'formatting_safety', name: 'Formatting Safety' },
    { key: 'technical_quality', name: 'Technical Quality' },
    { key: 'achievement_quality', name: 'Achievement Quality' },
    { key: 'keyword_alignment', name: 'Keyword Alignment' },
    { key: 'resume_completeness', name: 'Resume Completeness' },
    { key: 'industry_alignment', name: 'Industry Alignment' }
  ];

  const getMetricScore = (breakdown: any, key: string): number => {
    if (!breakdown) return 0;
    const val = breakdown[key];
    if (typeof val === 'object') {
      return val.score || 0;
    }
    return val || 0;
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in pb-10">
      
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Resume Version Control</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">Compare revisions side-by-side, analyze score improvements, and track audit timelines.</p>
      </div>

      {/* Score progress charts */}
      {historyData.length > 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Trend Chart */}
          <div className="lg:col-span-8 glass-card p-5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4">Improvement Timeline</span>
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis domain={[40, 100]} stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1525', borderColor: '#1e2740', borderRadius: '10px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                    itemStyle={{ color: '#6366F1' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Score" 
                    stroke="#6366F1" 
                    strokeWidth={2} 
                    dot={{ r: 3, stroke: '#6366F1', strokeWidth: 2, fill: '#0B1020' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress rate card */}
          <div className="lg:col-span-4 glass-card p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Overall Progress Rate</span>
              {(() => {
                const sorted = [...historyData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                const diff = last.score_overall - first.score_overall;
                return (
                  <div className="space-y-4">
                    <div>
                      <span className={`text-4xl font-black ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5 font-bold">points</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      From base score <span className="text-slate-300 font-semibold">{first.score_overall}</span> (v{first.version}) to latest draft <span className="text-slate-300 font-semibold">{last.score_overall}</span> (v{last.version}).
                    </p>
                  </div>
                );
              })()}
            </div>
            <p className="text-[11px] text-slate-600 pt-3 border-t border-[#1e2740] font-medium mt-4">
              Live revisions in Resume Studio instantly sync to this version chart.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card p-10 text-center flex flex-col items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-slate-600" />
          <h4 className="font-semibold text-sm text-slate-300">Need Multiple Scan Versions</h4>
          <p className="text-xs text-slate-500 max-w-xs">Make dynamic inline edits inside Resume Studio to compile new version drafts.</p>
        </div>
      )}

      {/* Side by Side compare */}
      {historyData.length > 1 && (
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">Side-by-Side Version Diff</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Base Version</label>
              <select
                value={compareV1}
                onChange={(e) => setCompareV1(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#0f1525] border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="">Select version...</option>
                {historyData.map((item) => (
                  <option key={item.resume_id} value={item.resume_id}>
                    v{item.version} - {item.filename} ({item.score_overall} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center py-2 md:col-span-1 md:pb-3">
              <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Version</label>
              <select
                value={compareV2}
                onChange={(e) => setCompareV2(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#0f1525] border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="">Select version...</option>
                {historyData.map((item) => (
                  <option key={item.resume_id} value={item.resume_id}>
                    v{item.version} - {item.filename} ({item.score_overall} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingCompare && (
            <div className="p-8 text-center flex items-center justify-center gap-2 text-xs text-indigo-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing version alterations...</span>
            </div>
          )}

          {errorCompare && (
            <div className="p-3 bg-red-500/10 border border-red-500/15 text-xs text-red-400 flex items-center gap-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorCompare}</span>
            </div>
          )}

          {comparisonResult && (
            <div className="space-y-5 mt-2 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                      Base Version (v{comparisonResult.v1.version})
                    </span>
                    <span className="text-xl font-bold text-slate-200">{comparisonResult.v1.score_overall} pts</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-1">{comparisonResult.v1.filename}</p>
                  <span className="text-[10px] text-slate-600 block">Uploaded {formatDate(comparisonResult.v1.created_at)}</span>
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                      Target Version (v{comparisonResult.v2.version})
                    </span>
                    <span className="text-xl font-bold text-slate-200">{comparisonResult.v2.score_overall} pts</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-1">{comparisonResult.v2.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-600 font-mono">Uploaded {formatDate(comparisonResult.v2.created_at)}</span>
                    {(() => {
                      const overallDiff = comparisonResult.v2.score_overall - comparisonResult.v1.score_overall;
                      return (
                        <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                          overallDiff > 0 ? 'text-emerald-400' : overallDiff < 0 ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {overallDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : overallDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          {overallDiff > 0 ? `+${overallDiff}` : overallDiff} Overall
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-[#0f1525]/85 border-b border-slate-800 px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <div className="col-span-6">Health Dimension</div>
                  <div className="col-span-2 text-center">Base Score</div>
                  <div className="col-span-2 text-center">Target Score</div>
                  <div className="col-span-2 text-right">Variance</div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {breakdownMetrics.map((metric) => {
                    const m1 = getMetricScore(comparisonResult.v1.score_breakdown, metric.key);
                    const m2 = getMetricScore(comparisonResult.v2.score_breakdown, metric.key);
                    const diff = m2 - m1;
                    
                    return (
                      <div key={metric.key} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-900/10 transition-colors">
                        <div className="col-span-6 font-semibold text-slate-300">{metric.name}</div>
                        <div className="col-span-2 text-center text-slate-400">{m1}%</div>
                        <div className="col-span-2 text-center text-slate-400">{m2}%</div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            diff > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : diff < 0 
                              ? 'bg-red-500/10 text-red-400' 
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
