import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import UploadSection from './components/UploadSection';
import ParserSimulator from './components/ParserSimulator';
import AtsAnalysis from './pages/AtsAnalysis';
import FaangReadiness from './pages/FaangReadiness';
import RecruiterReview from './pages/RecruiterReview';
import Settings from './pages/Settings';

import Resumes from './pages/Resumes';
import CareerSuite from './pages/CareerSuite';

import Applications from './pages/Applications';
import { Upload, ArrowRight, Clock, ChevronRight, Trash2 } from 'lucide-react';

// Resolve API URL dynamically for production deployment flexibility
const BACKEND_URL = (import.meta.env.VITE_API_URL as string) || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:8000" 
    : window.location.origin);

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("resumeiq_token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("resumeiq_email") || "");
  const [started, setStarted] = useState(() => !!localStorage.getItem("resumeiq_token"));
  const [activeTab, setActiveTab] = useState('overview');
  
  const [history, setHistory] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
  } | null>(null);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("resumeiq_gemini_key") || "");
  const [backendMockStatus, setBackendMockStatus] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then(res => res.json())
      .then(data => setBackendMockStatus(data.mock_mode))
      .catch(err => console.error("Backend offline.", err));

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");
    const provider = params.get("provider");
    const sandbox = params.get("sandbox");
    
    if (urlToken && urlEmail) {
      localStorage.setItem("resumeiq_token", urlToken);
      localStorage.setItem("resumeiq_email", urlEmail);
      setToken(urlToken);
      setUserEmail(urlEmail);
      setStarted(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (sandbox === "true" && provider) {
      // Initiate sandbox login
      fetch(`${BACKEND_URL}/api/v1/auth/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider })
      })
      .then(res => {
        if (!res.ok) throw new Error("Sandbox initialization failed.");
        return res.json();
      })
      .then(data => {
        if (data.access_token && data.email) {
          localStorage.setItem("resumeiq_token", data.access_token);
          localStorage.setItem("resumeiq_email", data.email);
          setToken(data.access_token);
          setUserEmail(data.email);
          setStarted(true);
          showAlert("OAuth Sandbox Mode", `Successfully authenticated via simulated Sandbox ${provider.toUpperCase()} flow.`);
        }
      })
      .catch(err => {
        console.error("Sandbox authentication failed:", err);
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  const handleLogout = async () => {
    if (token && token !== "mock-token" && token !== "undefined") {
      try {
        await fetch(`${BACKEND_URL}/api/v1/users/me/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Backend logout error", err);
      }
    }
    setToken("");
    setUserEmail("");
    localStorage.removeItem("resumeiq_token");
    localStorage.removeItem("resumeiq_email");
    setStarted(false);
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/resumes`, {
        headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) setHistory(await response.json());
    } catch (err) {
      console.error("Failed to load history.", err);
    }
  };

  useEffect(() => {
    if (started && token) fetchHistory();
  }, [started, token]);

  const handleStart = (authToken: string, authEmail: string) => {
    setToken(authToken);
    setUserEmail(authEmail);
    localStorage.setItem("resumeiq_token", authToken);
    localStorage.setItem("resumeiq_email", authEmail);
    setStarted(true);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("resumeiq_gemini_key", key);
  };

  const handleScanComplete = (reportData: any) => {
    setCurrentReport(reportData);
    fetchHistory();
    setActiveTab('ats');
  };

  const handleSelectResume = async (resumeId: number) => {
    try {
      const resume = history.find(r => r.resume_id === resumeId);
      if (!resume) return;
      const reportId = resume.report_id;
      const response = await fetch(`${BACKEND_URL}/api/v1/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        setCurrentReport(await response.json());
        setActiveTab('ats');
      }
    } catch (err) {
      console.error("Failed to load resume.", err);
    }
  };

  const handleUpdateReport = (updatedReport: any) => {
    setCurrentReport((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        score_overall: updatedReport.score_overall,
        score_breakdown: updatedReport.score_breakdown,
        keyword_analysis: updatedReport.keyword_analysis,
        benchmarking: updatedReport.benchmarking
      };
    });
    fetchHistory();
  };

  const showAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert'
    });
  };

  const handleClearHistory = () => {
    setCustomModal({
      isOpen: true,
      title: "Clear Scan History",
      message: "Are you sure you want to clear all scan history? This action cannot be undone.",
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/resumes`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
          });
          if (response.status === 401) {
            handleLogout();
            return;
          }
          if (response.ok) {
            setHistory([]);
            setCurrentReport(null);
          }
        } catch (err) {
          console.error("Failed to clear history.", err);
        }
      }
    });
  };

  const handleDeleteResume = (resumeId: number) => {
    setCustomModal({
      isOpen: true,
      title: "Delete Scan",
      message: "Are you sure you want to delete this scan?",
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token || 'mock-token'}` }
          });
          if (response.status === 401) {
            handleLogout();
            return;
          }
          if (response.ok) {
            setHistory(prev => prev.filter(r => r.resume_id !== resumeId));
            if (currentReport?.resume_id === resumeId) {
              setCurrentReport(null);
            }
          }
        } catch (err) {
          console.error("Failed to delete scan.", err);
        }
      }
    });
  };

  const renderCustomModal = () => {
    if (!customModal || !customModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            if (customModal.type === 'alert') {
              setCustomModal(null);
            }
          }}
        />
        <div className="bg-[#0B1020]/95 border border-slate-700/60 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl shadow-indigo-500/10 text-left transform scale-100 transition-all duration-300 animate-in fade-in-50 zoom-in-95">
          <h3 className="text-base font-bold text-white mb-2 tracking-tight">
            {customModal.title}
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {customModal.message}
          </p>
          <div className="flex justify-end gap-3">
            {customModal.type === 'confirm' ? (
              <>
                <button
                  onClick={() => setCustomModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (customModal.onConfirm) customModal.onConfirm();
                    setCustomModal(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Confirm
                </button>
              </>
            ) : (
              <button
                onClick={() => setCustomModal(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!started) {
    return (
      <>
        <LandingPage onStart={handleStart} onAlert={(msg) => showAlert("Info", msg)} backendUrl={BACKEND_URL} />
        {renderCustomModal()}
      </>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': {
        const scoreVal = currentReport?.score_overall ?? 0;
        const scoreColor = scoreVal >= 80 ? 'text-emerald-400' : scoreVal >= 60 ? 'text-amber-400' : 'text-rose-400';
        
        const totalKeywords = currentReport?.keyword_analysis?.jd_keywords?.length || 0;
        const keywordLabel = totalKeywords > 0 ? "Keywords Match" : "Skills Identified";
        const keywordValue = totalKeywords > 0 
          ? `${currentReport?.keyword_analysis?.matching_keywords?.length || 0}/${totalKeywords}` 
          : `${currentReport?.keyword_analysis?.resume_keywords?.length || 0}`;
          
        const percentileVal = currentReport?.benchmarking?.global_percentile ?? 80;
        const percentileColor = percentileVal >= 75 ? 'text-emerald-400' : 'text-indigo-400';

        return (
          <div className="flex flex-col gap-6 text-left">
            {/* Welcome */}
            <div className="glass-card p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/50">
              <div className="absolute top-[-40%] right-[0%] w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px]" />
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center relative">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Welcome to Resora AI</h2>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    Upload your resume to get a detailed ATS compatibility analysis, recruiter feedback, and improvement suggestions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all text-xs flex items-center gap-2 shrink-0 shadow-md shadow-indigo-500/20"
                >
                  <Upload className="w-4 h-4" />
                  New Scan
                </button>
              </div>
            </div>

            {/* Content */}
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                
                {/* Active Report */}
                <div className="md:col-span-7 flex flex-col">
                  {currentReport ? (
                    <div className="glass-card p-6 flex flex-col justify-between h-full min-h-[290px] relative overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/50">
                      <div className="absolute top-[-30%] right-[-10%] w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">Active Report</span>
                          <span className="px-2 py-0.5 bg-[#1e2740] border border-[#2e3b5e] rounded text-[10px] text-slate-300 font-mono">v{currentReport.version}</span>
                        </div>
                        <h3 className="font-bold text-base text-white truncate max-w-sm mb-1 leading-snug">{currentReport.filename}</h3>
                        <span className="text-[11px] text-slate-400 bg-slate-800/40 px-2.5 py-0.5 rounded-full border border-slate-700/30 w-fit block">{currentReport.target_role}</span>
                        
                        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-800/60 pt-5">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1 uppercase tracking-wider">ATS Score</span>
                            <span className={`text-2xl font-extrabold tracking-tight ${scoreColor}`}>{scoreVal}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1 uppercase tracking-wider">{keywordLabel}</span>
                            <span className="text-2xl font-extrabold tracking-tight text-indigo-400">{keywordValue}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1 uppercase tracking-wider">Percentile</span>
                            <span className={`text-2xl font-extrabold tracking-tight ${percentileColor}`}>{percentileVal}%</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('ats')}
                        className="mt-6 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-all flex items-center gap-2 w-fit shadow-md shadow-indigo-500/20"
                      >
                        View Full Analytics <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="glass-card p-6 flex items-center justify-center h-full min-h-[290px] text-slate-500 text-sm border-dashed">
                      Select a resume from history to view its report.
                    </div>
                  )}
                </div>

                {/* Recent Scans */}
                <div className="md:col-span-5 flex flex-col">
                  <div className="glass-card p-6 flex flex-col justify-between h-full min-h-[290px] relative overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/50">
                    <div className="absolute top-[-30%] right-[-10%] w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            Recent Scans
                          </h4>
                          {history.length > 0 && (
                            <button
                              onClick={handleClearHistory}
                              className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
                          {history.map((h) => {
                            const itemScoreColor = h.score_overall >= 80 ? 'text-emerald-400' : h.score_overall >= 60 ? 'text-amber-400' : 'text-rose-400';
                            const isSelected = currentReport?.resume_id === h.resume_id;
                            return (
                              <div
                                key={h.resume_id}
                                className={`w-full rounded-xl border transition-all flex justify-between items-center group/item relative ${
                                  isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-inner'
                                    : 'bg-[#0f1525]/30 border-[#1e2740] hover:bg-[#0f1525]/60 hover:border-slate-600'
                                }`}
                              >
                                <div
                                  onClick={() => handleSelectResume(h.resume_id)}
                                  className="flex-1 text-left py-3 px-3.5 cursor-pointer min-w-0"
                                >
                                  <span 
                                    className="font-semibold text-xs block truncate leading-normal" 
                                    style={{ color: '#ffffff' }}
                                  >
                                    {h.filename || 'Untitled Scan'}
                                  </span>
                                  <span 
                                    className="text-[10px] block truncate leading-normal mt-1" 
                                    style={{ color: '#94a3b8' }}
                                  >
                                    v{h.version} · {h.target_role || 'General Track'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 pr-3 shrink-0">
                                  <span 
                                    className="font-bold text-xs" 
                                    style={{ 
                                      color: h.score_overall >= 80 ? '#10b981' : h.score_overall >= 60 ? '#f59e0b' : '#ef4444' 
                                    }}
                                  >
                                    {h.score_overall !== null && h.score_overall !== undefined ? `${Math.round(h.score_overall)}%` : '--%'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteResume(h.resume_id);
                                    }}
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                                    title="Delete scan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:hidden" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-300">No scans yet</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Upload your resume in PDF or DOCX format to start your analysis.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all text-xs"
                >
                  Upload Resume
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'resumes':
        return (
          <Resumes 
            historyData={history}
            currentResumeId={currentReport?.resume_id}
            onSelectResume={handleSelectResume}
            onDeleteResume={handleDeleteResume}
            onClearHistory={handleClearHistory}
            backendUrl={BACKEND_URL}
            token={token}
            onScanComplete={handleScanComplete}
          />
        );
      case 'applications':
        return (
          <Applications 
            token={token}
          />
        );

      case 'upload':
        return (
          <UploadSection 
            onScanComplete={handleScanComplete} 
            backendUrl={BACKEND_URL} 
            token={token}
          />
        );
      case 'ats':
        if (!currentReport) return <div className="text-center text-slate-500 py-20 text-sm">Upload or load a resume first.</div>;
        return (
          <div className="flex flex-col gap-6">
            <AtsAnalysis 
              reportData={currentReport} 
              backendUrl={BACKEND_URL} 
              onScanComplete={handleScanComplete}
              onUpdateReport={handleUpdateReport}
              token={token}
            />
            <ParserSimulator 
              extractedData={currentReport.extracted_data} 
              rawText={currentReport.raw_text || ""} 
              scoreOverall={currentReport.score_overall}
              targetRole={currentReport.target_role}
              recruiterFeedback={currentReport.recruiter_feedback}
              resumeId={currentReport.resume_id}
              backendUrl={BACKEND_URL}
              token={token}
              onScanComplete={handleScanComplete}
            />
          </div>
        );
      case 'career':
        return (
          <CareerSuite 
            resumeId={currentReport?.resume_id}
            targetRole={currentReport?.target_role}
            backendUrl={BACKEND_URL}
            token={token}
            isMockMode={backendMockStatus && !apiKey}
          />
        );
      case 'faang':
        if (!currentReport) return <div className="text-center text-slate-500 py-20 text-sm">Upload or load a resume first.</div>;
        return <FaangReadiness faangData={currentReport.faang_readiness} />;
      case 'recruiter':
        if (!currentReport) return <div className="text-center text-slate-500 py-20 text-sm">Upload or load a resume first.</div>;
        return (
          <RecruiterReview 
            recruiterData={currentReport.recruiter_feedback} 
            backendUrl={BACKEND_URL} 
            resumeId={currentReport.resume_id}
            targetRole={currentReport.target_role}
            token={token}
            isMockMode={backendMockStatus && !apiKey}
          />
        );
      case 'settings':
        return (
          <Settings 
            backendUrl={BACKEND_URL} 
            isMockMode={backendMockStatus && !apiKey} 
            onSaveApiKey={handleSaveApiKey} 
            savedApiKey={apiKey} 
            token={token}
            onLogout={handleLogout}
            onAlert={(msg) => showAlert("Upgrade Plan", msg)}
          />
        );

      default:
        return <div>View under construction.</div>;
    }
  };

  return (
    <>
      <DashboardLayout 
        currentTab={activeTab} 
        onTabChange={setActiveTab}
        userEmail={userEmail}
        onLogout={handleLogout}
      >
        {renderTabContent()}
      </DashboardLayout>
      {renderCustomModal()}
    </>
  );
}
