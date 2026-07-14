import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  ChevronRight, 
  UploadCloud, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  Briefcase,
  FileText,
  GitBranch,
  GitCompare
} from 'lucide-react';
import UploadSection from '../components/UploadSection';
import Versions from './Versions';


interface ScanHistoryItem {
  resume_id: number;
  filename: string;
  version: number;
  created_at: string;
  score_overall: number;
  target_role: string;
}

interface ResumesProps {
  historyData: ScanHistoryItem[];
  currentResumeId?: number;
  onSelectResume: (resumeId: number) => void;
  onDeleteResume: (resumeId: number) => void;
  onClearHistory: () => void;
  backendUrl: string;
  token?: string;
  onScanComplete: (report: any) => void;
}

export default function Resumes({
  historyData,
  currentResumeId,
  onSelectResume,
  onDeleteResume,
  onClearHistory,
  backendUrl,
  token,
  onScanComplete
}: ResumesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'repo' | 'history'>('repo');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");

  const filteredHistory = historyData.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.target_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedRoleFilter === "All" || item.target_role === selectedRoleFilter;
    return matchesSearch && matchesFilter;
  });

  // Extract unique target roles
  const roles = ["All", ...Array.from(new Set(historyData.map(item => item.target_role)))];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in pb-10">
      
      {/* Sub-tabs Selection */}
      <div className="glass-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight">My Resumes & History</h2>
            <p className="text-[10px] text-slate-500 font-medium">Manage your uploaded resumes and compare different analysis versions.</p>
          </div>
        </div>

        <div className="flex gap-1 bg-[#090e1a]/80 p-1 border border-slate-800/80 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('repo')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'repo'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Resume Repository</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Versions & Compare</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'repo' && (
        <div className="flex flex-col gap-6 w-full">
          {/* Upload Zone */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UploadCloud className="w-4.5 h-4.5 text-indigo-400" /> Upload New Resume version
            </h3>
            <UploadSection 
              onScanComplete={onScanComplete} 
              backendUrl={backendUrl} 
              token={token} 
            />
          </div>


      {/* History List */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">Scanned Resume Repository</h3>
          </div>
          {historyData.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Clear Repository
            </button>
          )}
        </div>

        {historyData.length > 0 ? (
          <div className="space-y-4">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by filename or target role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600 shrink-0" />
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-[#080d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-[#0f1525]/80 border-b border-slate-800 px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <div className="col-span-5">File Details</div>
                <div className="col-span-1 text-center">Version</div>
                <div className="col-span-3">Target Track</div>
                <div className="col-span-1 text-center">Score</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => {
                  const isActive = currentResumeId === item.resume_id;
                  
                  return (
                    <div 
                      key={item.resume_id} 
                      className={`grid grid-cols-12 px-4 py-3.5 items-center hover:bg-slate-900/10 transition-colors ${
                        isActive ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isActive 
                            ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate text-left">
                          <span className="font-bold text-slate-200 block truncate" title={item.filename}>{item.filename}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      <div className="col-span-1 text-center font-mono text-slate-400 font-semibold">
                        v{item.version}
                      </div>

                      <div className="col-span-3 flex items-center gap-1.5 text-slate-300 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="truncate">{item.target_role}</span>
                      </div>

                      <div className="col-span-1 text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] ${
                          item.score_overall >= 80 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : item.score_overall >= 60 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.score_overall}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-end gap-1.5">
                        <button
                          onClick={() => onSelectResume(item.resume_id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                              : 'bg-[#0f1525] border border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {isActive ? "Loaded" : "Load"}
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onDeleteResume(item.resume_id)}
                          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Resume version"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-1.5">
            <UploadCloud className="w-8 h-8 text-slate-600 animate-pulse" />
            <h4 className="font-semibold text-xs text-slate-300">Your resume library is empty</h4>
            <p className="text-[10px] text-slate-500">Upload a PDF or Word document above to begin calculations.</p>
          </div>
        )}
      </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="animate-fade-in w-full">
          <Versions 
            historyData={historyData}
            currentResumeId={currentResumeId || 0}
            onSelectResume={onSelectResume}
            backendUrl={backendUrl}
            token={token}
          />
        </div>
      )}

    </div>
  );
}
