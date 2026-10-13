import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  DollarSign, 
  Briefcase, 
  MapPin, 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  IndianRupee, 
  ExternalLink,
  Sparkles,
  Search,
  FileCheck,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Application {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  date: string;
  link?: string;
  notes?: string;
  match_score?: number;
  skills?: string[];
}

interface ApplicationsProps {
  token?: string;
  backendUrl?: string;
}

export default function Applications({ token, backendUrl }: ApplicationsProps) {
  const [apps, setApps] = useState<Application[]>(() => {
    const saved = localStorage.getItem("resumeiq_applications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy sample mock items ('1', '2', '3', '4') so tracker starts empty for new users
          return parsed.filter(a => !['1', '2', '3', '4'].includes(a.id));
        }
      } catch (e) {
        console.error(e);
      }
    }
    // New users start completely empty:
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState("$");
  const [salaryInput, setSalaryInput] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<'applied' | 'interviewing' | 'offer' | 'rejected'>("applied");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch from backend API on mount
  useEffect(() => {
    if (backendUrl) {
      fetch(`${backendUrl}/api/v1/applications`, {
        headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
      })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(serverApps => {
        if (serverApps && Array.isArray(serverApps)) {
          const cleanApps = serverApps.filter(a => !['1', '2', '3', '4'].includes(a.id));
          setApps(cleanApps);
          localStorage.setItem("resumeiq_applications", JSON.stringify(cleanApps));
        }
      })
      .catch(err => {
        console.log("Offline or sandbox mode for applications sync:", err);
      });
    }
  }, [backendUrl, token]);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem("resumeiq_applications", JSON.stringify(apps));
  }, [apps]);

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    const formattedSalary = salaryInput.trim() ? `${currency} ${salaryInput.trim()}` : 'N/A';

    const newApp: Application = {
      id: Date.now().toString(),
      title: title.trim(),
      company: company.trim(),
      salary: formattedSalary,
      location: location.trim() || "Remote",
      status,
      date: date || new Date().toISOString().split('T')[0],
      link: link.trim(),
      notes: notes.trim(),
      match_score: 75
    };

    setApps(prev => [newApp, ...prev]);
    setShowAddModal(false);

    // Sync with backend
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/v1/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || 'mock-token'}`
          },
          body: JSON.stringify(newApp)
        });
      } catch (err) {
        console.error("Backend application create error:", err);
      }
    }
    
    // Reset Form
    setTitle("");
    setCompany("");
    setSalaryInput("");
    setCurrency("$");
    setLocation("");
    setStatus("applied");
    setDate(new Date().toISOString().split('T')[0]);
    setLink("");
    setNotes("");
  };

  const handleDeleteApp = async (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id));
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/v1/applications/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
        });
      } catch (err) {
        console.error("Backend application delete error:", err);
      }
    }
  };

  const handleMoveApp = async (id: string, newStatus: 'applied' | 'interviewing' | 'offer' | 'rejected') => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/v1/applications/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || 'mock-token'}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error("Backend application move status error:", err);
      }
    }
  };

  const formatAppliedDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const columns = [
    { id: 'applied', label: 'Applied', color: 'border-slate-800 bg-[#0f1525]/30 text-indigo-400', icon: Clock },
    { id: 'interviewing', label: 'Interviewing', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400', icon: ClipboardList },
    { id: 'offer', label: 'Offer Received', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', icon: CheckCircle },
    { id: 'rejected', label: 'Archived / Rejected', color: 'border-rose-500/20 bg-rose-500/5 text-rose-400', icon: XCircle }
  ];

  const filteredApps = apps.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
  });

  const totalAppsCount = apps.length;
  const interviewingCount = apps.filter(a => a.status === 'interviewing').length;
  const offerCount = apps.filter(a => a.status === 'offer').length;
  const highMatchCount = apps.filter(a => (a.match_score || 0) >= 75).length;

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">Applications Pipeline</h2>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Track jobs directly imported from the LinkedIn JD Scraper and monitor your interview progression.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search filter */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by role or company..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0f1525] border border-[#1e2740] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 shrink-0">
        <div className="glass-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Total Tracked</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white">{totalAppsCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Interviewing</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{interviewingCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <ClipboardList className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Offers Received</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{offerCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">High ATS Match (75%+)</span>
            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{highMatchCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 dark:text-violet-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Empty State Banner for New Users */}
      {totalAppsCount === 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Your job tracker is clean and ready</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Track jobs by clicking <strong className="text-slate-800 dark:text-slate-200">+ Add Role</strong> or 1-click track directly from the <strong className="text-slate-800 dark:text-slate-200">LinkedIn JD Matcher</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add First Role
          </button>
        </div>
      )}

      {/* Kanban Board Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden min-h-0 pb-6">
        {columns.map(col => {
          const Icon = col.icon;
          const colApps = filteredApps.filter(a => a.status === col.id);
          
          return (
            <div key={col.id} className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-slate-100/70 dark:bg-[#070b13]/40 p-3.5 min-h-0 shadow-xs">
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${
                    col.id === 'offer' ? 'text-emerald-500 dark:text-emerald-400' : 
                    col.id === 'rejected' ? 'text-rose-500 dark:text-rose-400' : 
                    col.id === 'interviewing' ? 'text-blue-500 dark:text-blue-400' : 'text-indigo-500 dark:text-indigo-400'
                  }`} />
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{col.label}</span>
                </div>
                <span className="px-2 py-0.5 bg-white dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-md text-[10px] text-slate-600 dark:text-slate-400 font-bold shadow-xs">
                  {colApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence mode="popLayout">
                  {colApps.map(app => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      key={app.id}
                      className="glass-card p-3.5 flex flex-col gap-2.5 group relative text-left shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      {/* Title & Company */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug truncate" title={app.title}>
                            {app.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                              {app.company}
                            </span>
                            {app.match_score && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                app.match_score >= 80 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
                                app.match_score >= 60 ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
                                'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                              }`}>
                                {app.match_score}% ATS Match
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {app.link && (
                            <a
                              href={app.link.startsWith('http') ? app.link : `https://${app.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-blue-400 p-1 rounded transition-colors"
                              title="View Job Link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Location & Salary */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{app.location || 'Remote'}</span>
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {app.salary || 'Competitive'}
                        </span>
                      </div>

                      {/* Extracted Skills Pills (if present) */}
                      {app.skills && app.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {app.skills.slice(0, 4).map((sk, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-slate-800 rounded text-[9.5px] text-slate-600 dark:text-slate-400 font-medium">
                              {sk}
                            </span>
                          ))}
                          {app.skills.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-slate-800 rounded text-[9.5px] text-slate-500 font-medium">
                              +{app.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Footer: Date, Career Suite Shortcuts & Move Buttons */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-1 text-[9.5px]">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-2.5 h-2.5 text-slate-400 dark:text-slate-600" />
                          {formatAppliedDate(app.date)}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Quick Shortcut to Career Suite */}
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('resumeiq:navigate', { detail: 'career' }))}
                            className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-500/20 text-[9px] font-semibold transition-colors cursor-pointer"
                            title="Generate Tailored Cover Letter or Prep Interview"
                          >
                            Career Suite
                          </button>

                          {/* Move Left */}
                          {col.id !== 'applied' && (
                            <button
                              onClick={() => {
                                const order: any = ['applied', 'interviewing', 'offer', 'rejected'];
                                const prevIdx = order.indexOf(col.id) - 1;
                                if (prevIdx >= 0) handleMoveApp(app.id, order[prevIdx]);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                              title="Move back"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}

                          {/* Move Right */}
                          {col.id !== 'rejected' && (
                            <button
                              onClick={() => {
                                const order: any = ['applied', 'interviewing', 'offer', 'rejected'];
                                const nextIdx = order.indexOf(col.id) + 1;
                                if (nextIdx < order.length) handleMoveApp(app.id, order[nextIdx]);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                              title="Move forward"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>

                {colApps.length === 0 && (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    No roles in this column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1221] p-6 relative flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-left animate-fade-in">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-lg cursor-pointer"
            >
              &times;
            </button>

            <form onSubmit={handleAddApp} className="space-y-4">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-base mb-1">Add Job Application</h3>
                <p className="text-xs text-slate-500">Record a new role in your job tracker pipeline.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe, Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Salary / Compensation</label>
                    <div className="flex">
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-slate-100 dark:bg-[#0b1020] border border-slate-200 dark:border-slate-800 border-r-0 rounded-l-xl px-2 text-xs text-slate-700 dark:text-slate-400 focus:outline-none"
                      >
                        <option value="$">$</option>
                        <option value="₹">₹</option>
                        <option value="€">€</option>
                        <option value="£">£</option>
                      </select>
                      <input
                        type="text"
                        placeholder="140K / yr"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-r-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / New York"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Archived / Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Job Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/jobs/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1525] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-600/20"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
