import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  History as HistoryIcon, 
  Clock, 
  Eye, 
  Trash2, 
  GitCompare, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ScanHistoryItem {
  resume_id: number;
  filename: string;
  version: number;
  created_at: string;
  score_overall: number;
  target_role: string;
}

interface HistoryProps {
  historyData: ScanHistoryItem[];
  currentResumeId: number;
  onSelectResume: (resumeId: number) => void;
  onDeleteResume: (resumeId: number) => void;
  onClearHistory: () => void;
  backendUrl: string;
  token?: string;
}

export default function History({ 
  historyData, 
  currentResumeId, 
  onSelectResume, 
  onDeleteResume, 
  onClearHistory,
  backendUrl,
  token
}: HistoryProps) {
  
  // Version Comparison States
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

  // Perform version comparison
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

  // Auto-compare when both version states are valid
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
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header */}
      <div className="glass-card p-5 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HistoryIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-200">Score History & Versioning</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">Track your improvement across resume versions and perform side-by-side comparisons.</p>
        </div>
        {historyData.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold hover:bg-rose-500/20 hover:border-rose-500/50 transition-all text-xs cursor-pointer shadow-md shadow-rose-500/5 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Chart and Progress Summary */}
      {historyData.length > 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 glass-card p-5">
            <h4 className="text-[11px] font-semibold text-slate-500 mb-4 uppercase tracking-wider">Score Evolution Trend</h4>
            <div className="w-full h-56">
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

          <div className="lg:col-span-4 glass-card p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-4 uppercase tracking-wider">Progress Rate</h4>
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
                      <span className="text-xs text-slate-500 ml-1.5">points overall</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      From your baseline score <span className="text-slate-300 font-semibold">{first.score_overall}</span> (v{first.version}) to your latest version <span className="text-slate-300 font-semibold">{last.score_overall}</span> (v{last.version}).
                    </p>
                  </div>
                );
              })()}
            </div>
            <p className="text-[11px] text-slate-600 pt-3 border-t border-[#1e2740] mt-4 font-medium">
              Formatting fixes and numerical metric additions will accelerate your progress.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center flex flex-col items-center gap-2">
          <Clock className="w-8 h-8 text-slate-600" />
          <h4 className="font-semibold text-sm text-slate-300">Need Multiple Scan Versions</h4>
          <p className="text-xs text-slate-500 max-w-xs">Upload another version of your resume to unlock evolution tracking graphs.</p>
        </div>
      )}

      {/* Version Comparison Dashboard */}
      {historyData.length > 1 && (
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-200">Side-by-Side Version Comparison</h3>
          </div>

          {/* Selection Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Base Version</label>
              <select
                value={compareV1}
                onChange={(e) => setCompareV1(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
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
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Version</label>
              <select
                value={compareV2}
                onChange={(e) => setCompareV2(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
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

          {/* Comparison Loading / Error / Results */}
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
            <div className="space-y-5 mt-2 animate-fade-in text-left">
              {/* Overall side-by-side stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* V1 stats */}
                <div className="p-4 bg-slate-900/30 border border-[#1e2740] rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold uppercase">
                      Base Version (v{comparisonResult.v1.version})
                    </span>
                    <span className="text-xl font-bold text-slate-200">{comparisonResult.v1.score_overall} pts</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-1">{comparisonResult.v1.filename}</p>
                  <span className="text-[10px] text-slate-600 block">Uploaded {formatDate(comparisonResult.v1.created_at)}</span>
                </div>

                {/* V2 stats */}
                <div className="p-4 bg-slate-900/30 border border-[#1e2740] rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase">
                      Target Version (v{comparisonResult.v2.version})
                    </span>
                    <span className="text-xl font-bold text-slate-200">{comparisonResult.v2.score_overall} pts</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-1">{comparisonResult.v2.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-600">Uploaded {formatDate(comparisonResult.v2.created_at)}</span>
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

              {/* Metric Breakdown Table side-by-side */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Metric Variance List</span>
                <div className="border border-[#1e2740] rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-[#0f1525]/85 border-b border-[#1e2740] px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <div className="col-span-6">Health Dimension</div>
                    <div className="col-span-2 text-center">Base Score</div>
                    <div className="col-span-2 text-center">Target Score</div>
                    <div className="col-span-2 text-right">Variance</div>
                  </div>

                  <div className="divide-y divide-[#1e2740]/60">
                    {breakdownMetrics.map((metric) => {
                      const m1 = getMetricScore(comparisonResult.v1.score_breakdown, metric.key);
                      const m2 = getMetricScore(comparisonResult.v2.score_breakdown, metric.key);
                      const diff = m2 - m1;
                      
                      return (
                        <div key={metric.key} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#0f1525]/25 transition-colors">
                          <div className="col-span-6 font-medium text-slate-300">{metric.name}</div>
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
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-wide">Scan History List</h4>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0f1525]/75 border-b border-[#1e2740] text-slate-500">
                <th className="px-4 py-3 font-semibold">Version</th>
                <th className="px-4 py-3 font-semibold">Filename</th>
                <th className="px-4 py-3 font-semibold">Target Track</th>
                <th className="px-4 py-3 font-semibold">Overall Score</th>
                <th className="px-4 py-3 font-semibold">Upload Date</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2740]/60">
              {historyData.map((item) => (
                <tr 
                  key={item.resume_id} 
                  className={`hover:bg-[#0f1525]/45 transition-colors ${item.resume_id === currentResumeId ? 'bg-indigo-500/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.resume_id === currentResumeId ? 'bg-indigo-500/15 text-indigo-400' : 'bg-[#1e2740] text-slate-400'
                    }`}>
                      v{item.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 truncate max-w-[180px] text-slate-300 font-semibold">{item.filename}</td>
                  <td className="px-4 py-3 text-slate-400 font-medium">{item.target_role}</td>
                  <td className="px-4 py-3 font-bold text-slate-300">{item.score_overall}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectResume(item.resume_id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          item.resume_id === currentResumeId
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                            : 'bg-[#0f1525] border border-[#1e2740] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {item.resume_id === currentResumeId ? 'Active' : 'Load'}
                      </button>
                      <button
                        onClick={() => onDeleteResume(item.resume_id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Delete Scan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
