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
  HelpCircle,
  Clock,
  Calendar,
  IndianRupee,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Application {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  date: string;
  link?: string;
}

interface ApplicationsProps {
  token?: string;
}

export default function Applications({ token }: ApplicationsProps) {
  const [apps, setApps] = useState<Application[]>(() => {
    const saved = localStorage.getItem("resumeiq_applications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Sandbox Mock Data
    return [
      { id: '1', title: 'Software Engineer Intern', company: 'Google', salary: '$45 / hr', location: 'Mountain View, CA', status: 'interviewing', date: '2026-06-25' },
      { id: '2', title: 'Frontend Developer', company: 'Meta', salary: '$120K / yr', location: 'Remote, US', status: 'applied', date: '2026-06-28' },
      { id: '3', title: 'Full Stack Engineer', company: 'Vercel', salary: '$140K / yr', location: 'Remote', status: 'offer', date: '2026-06-15' },
      { id: '4', title: 'SDE-1', company: 'Amazon', salary: '$115K / yr', location: 'Seattle, WA', status: 'rejected', date: '2026-06-10' }
    ];
  });

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

  useEffect(() => {
    localStorage.setItem("resumeiq_applications", JSON.stringify(apps));
  }, [apps]);

  const handleAddApp = (e: React.FormEvent) => {
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
      link: link.trim()
    };

    setApps(prev => [newApp, ...prev]);
    setShowAddModal(false);
    
    // Reset Form
    setTitle("");
    setCompany("");
    setSalaryInput("");
    setCurrency("$");
    setLocation("");
    setStatus("applied");
    setDate(new Date().toISOString().split('T')[0]);
    setLink("");
  };

  const handleDeleteApp = (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id));
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

  const handleMoveApp = (id: string, newStatus: 'applied' | 'interviewing' | 'offer' | 'rejected') => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const columns = [
    { id: 'applied', label: 'Applied', color: 'border-slate-800 bg-[#0f1525]/30 text-indigo-400', icon: Clock },
    { id: 'interviewing', label: 'Interviewing', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400', icon: ClipboardList },
    { id: 'offer', label: 'Offer Received', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', icon: CheckCircle },
    { id: 'rejected', label: 'Archived / Rejected', color: 'border-rose-500/20 bg-rose-500/5 text-rose-400', icon: XCircle }
  ];

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="glass-card p-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ClipboardList className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight">Applications pipeline</h2>
            <p className="text-[10px] text-slate-500 font-medium">Keep track of your active job applications, interviews, and offers in one visual Kanban board.</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-5 overflow-hidden min-h-0 pb-6">
        {columns.map(col => {
          const Icon = col.icon;
          const colApps = apps.filter(a => a.status === col.id);
          
          return (
            <div key={col.id} className="flex flex-col rounded-2xl border border-slate-800/40 bg-[#070b13]/25 p-4 min-h-0">
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-800/60 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${col.label.includes('Offer') ? 'text-emerald-400' : col.label.includes('Reject') ? 'text-rose-400' : col.label.includes('Inter') ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="text-[11.5px] font-extrabold text-slate-300 uppercase tracking-wider">{col.label}</span>
                </div>
                <span className="px-2 py-0.5 bg-[#0f1525] border border-slate-800 rounded text-[10px] text-slate-500 font-bold">{colApps.length}</span>
              </div>

              {/* Cards list */}
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
                      className="glass-card p-3 flex flex-col gap-2 group relative text-left shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {app.link ? (
                            <a 
                              href={app.link.startsWith('http') ? app.link : `https://${app.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11.5px] font-bold text-slate-200 hover:text-indigo-400 transition-colors leading-tight flex items-center gap-1 group/link cursor-pointer truncate"
                              title={app.title}
                            >
                              <span className="truncate">{app.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/link:opacity-100 transition-opacity shrink-0" />
                            </a>
                          ) : (
                            <h4 className="text-[11.5px] font-bold text-slate-200 leading-tight truncate" title={app.title}>{app.title}</h4>
                          )}
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 w-fit block mt-1">{app.company}</span>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1 rounded transition-colors cursor-pointer shrink-0"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-slate-400 font-medium">
                          <span className="flex items-center gap-1 shrink-0">
                            {app.salary && app.salary.includes('₹') ? (
                              <IndianRupee className="w-3 h-3 text-slate-600 shrink-0" />
                            ) : (
                              <DollarSign className="w-3 h-3 text-slate-600 shrink-0" />
                            )}
                            {app.salary ? app.salary.replace(/^[\$₹]\s*/, '') : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1 text-[9.5px] max-w-[50%] min-w-0">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="truncate">{app.location}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5 min-h-[16px]">
                          {app.date ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                              <span>{formatAppliedDate(app.date)}</span>
                            </span>
                          ) : (
                            <span></span>
                          )}
                          
                          {/* Inline small navigation arrows to save space */}
                          <div className="flex gap-1 shrink-0">
                            {col.id !== 'applied' && (
                              <button
                                onClick={() => {
                                  const order: any = ['applied', 'interviewing', 'offer', 'rejected'];
                                  const prevIdx = order.indexOf(col.id) - 1;
                                  if (prevIdx >= 0) handleMoveApp(app.id, order[prevIdx]);
                                }}
                                className="p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 rounded cursor-pointer transition-colors"
                                title="Move back"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.id !== 'rejected' && (
                              <button
                                onClick={() => {
                                  const order: any = ['applied', 'interviewing', 'offer', 'rejected'];
                                  const nextIdx = order.indexOf(col.id) + 1;
                                  if (nextIdx < order.length) handleMoveApp(app.id, order[nextIdx]);
                                }}
                                className="p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 rounded cursor-pointer transition-colors"
                                title="Move forward"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 relative flex flex-col border border-slate-800 shadow-2xl text-left">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg cursor-pointer"
            >
              &times;
            </button>

            <form onSubmit={handleAddApp} className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-base mb-1">Add Job Application</h3>
                <p className="text-xs text-slate-500">Record a new role in your job tracker pipeline.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Salary Range</label>
                    <div className="flex gap-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-[#080d1a] border border-[#1e2740] rounded-xl px-2.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans w-20 shrink-0"
                      >
                        <option value="$">USD ($)</option>
                        <option value="₹">INR (₹)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="e.g. 12L / yr or 120K / yr"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Remote or Bengaluru"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Stage Status</label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    >
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Applied Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Job URL Link</label>
                  <input
                    type="text"
                    placeholder="e.g. linkedin.com/jobs/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-[#080d1a] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Create Job Application Card
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
