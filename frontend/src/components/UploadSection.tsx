import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, RefreshCw, CheckCircle2, ChevronDown, Check } from 'lucide-react';

interface UploadSectionProps {
  onScanComplete: (reportData: any) => void;
  backendUrl: string;
  token?: string;
}

const TRACK_CATEGORIES = {
  "Tech Roles": [
    { value: "Software Engineer", label: "Software Engineer" },
    { value: "Data Analyst", label: "Data Analyst" },
    { value: "AI Engineer", label: "AI Engineer" },
    { value: "Frontend Developer", label: "Frontend Developer" },
    { value: "Backend Developer", label: "Backend Developer" },
    { value: "Full Stack Developer", label: "Full Stack Developer" },
    { value: "DevOps", label: "DevOps Engineer" },
    { value: "Mobile Developer", label: "Mobile Developer" }
  ],
  "Non-Tech Roles": [
    { value: "Product Manager", label: "Product Manager" },
    { value: "Marketing", label: "Marketing Specialist" },
    { value: "HR", label: "HR Specialist" },
    { value: "Finance", label: "Financial Analyst" }
  ]
};

export default function UploadSection({ onScanComplete, backendUrl, token }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState("");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedRoleLabel = Object.values(TRACK_CATEGORIES)
    .flat()
    .find(r => r.value === targetRole)?.label || targetRole;
  
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const steps = [
    "Uploading document...",
    "Auditing layout & formatting...",
    "Extracting skills & contact info...",
    "Running keyword analysis...",
    "Getting AI recruiter feedback...",
    "Building report..."
  ];

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setErrorMsg("");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a PDF or DOCX file.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setProgressStep(0);

    let completedReport: any = null;
    let isRequestDone = false;

    // Standard progression ticks every 1.2 seconds
    const stepInterval = setInterval(() => {
      setProgressStep(prev => {
        const next = prev + 1;
        if (next < steps.length) {
          return next;
        }
        clearInterval(stepInterval);
        if (isRequestDone && completedReport) {
          finalizeScan(completedReport);
        }
        return prev;
      });
    }, 1200);

    const finalizeScan = (reportData: any) => {
      setLoading(false);
      setFile(null);
      setJobDescription("");
      onScanComplete(reportData);
    };

    const fastForwardAndComplete = (reportData: any) => {
      isRequestDone = true;
      completedReport = reportData;
      clearInterval(stepInterval);
      
      // Fast forward remaining steps to show candidate the completion of all tasks
      const fastInterval = setInterval(() => {
        setProgressStep(prev => {
          const next = prev + 1;
          if (next < steps.length) {
            return next;
          }
          clearInterval(fastInterval);
          setTimeout(() => {
            finalizeScan(reportData);
          }, 600); // 600ms pause on completion
          return prev;
        });
      }, 200);
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_role", targetRole);
    if (jobDescription.trim()) {
      formData.append("job_description", jobDescription);
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || 'mock-token'}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed.");
      }

      const reportData = await response.json();
      fastForwardAndComplete(reportData);

    } catch (err: any) {
      clearInterval(stepInterval);
      setLoading(false);
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Upload Form */}
      <form onSubmit={handleScan} className="lg:col-span-7 glass-card p-6 flex flex-col gap-5">
        
        {/* Drop Zone */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Resume File</label>
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : file 
                  ? 'border-emerald-500/40 bg-emerald-500/5' 
                  : 'border-[#1e2740] bg-[#0f1525]/40 hover:bg-[#0f1525]/70 hover:border-slate-600'
            }`}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex flex-col items-center text-center gap-2">
                <FileText className="w-10 h-10 text-emerald-400" />
                <p className="font-medium text-sm text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                <span className="text-xs text-indigo-400 font-medium">Change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <Upload className="w-8 h-8 text-slate-500" />
                <p className="font-medium text-sm text-slate-300">Drop your resume here</p>
                <p className="text-xs text-slate-500">PDF or DOCX, max 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Selection */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-medium text-slate-400 mb-2">Target Role</label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 flex justify-between items-center transition-all cursor-pointer shadow-sm hover:bg-[#0f1525]/80 active:scale-[0.99]"
          >
            <span>{selectedRoleLabel}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-2 w-full bg-[#0d1222]/95 backdrop-blur-md border border-[#1e2740] rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-72 overflow-y-auto">
              {Object.entries(TRACK_CATEGORIES).map(([cat, roles]) => (
                <div key={cat} className="p-1.5 first:pt-1.5">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 select-none">
                    {cat}
                  </div>
                  <div className="space-y-0.5">
                    {roles.map(r => {
                      const isSelected = r.value === targetRole;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => {
                            setTargetRole(r.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-500/20 text-white font-medium border-l-2 border-indigo-500 pl-2'
                              : 'text-slate-300 hover:bg-[#161f36] hover:text-white'
                          }`}
                        >
                          <span>{r.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JD Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-medium text-slate-400">Job Description</label>
            <span className="text-[11px] text-slate-600">Optional</span>
          </div>
          <textarea 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a job description for tailored keyword matching..."
            rows={4}
            className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600 leading-relaxed"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${
            loading 
              ? 'bg-[#1e2740] text-slate-500 cursor-not-allowed'
              : !file 
                ? 'bg-[#1e2740] text-slate-600 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Resume'
          )}
        </button>
      </form>

      {/* Progress / Info Panel */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {loading ? (
          <div className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-0.5 bg-indigo-500 transition-all duration-500" style={{ width: `${((progressStep + 1) / steps.length) * 100}%` }} />
            
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="font-medium text-sm text-slate-300">Processing</span>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-xs transition-all ${
                  idx <= progressStep ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {idx < progressStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : idx === progressStep ? (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[#1e2740]" />
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-5">
            <h3 className="font-medium text-sm text-slate-300 mb-3">How It Works</h3>
            <div className="space-y-3">
              {[
                { title: "Deterministic Scoring", desc: "Baseline score uses fixed weights — no black box." },
                { title: "AI Qualitative Review", desc: "Gemini grades your content for recruiter relevance." },
                { title: "Actionable Feedback", desc: "Get specific points to improve your score." }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-300">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
