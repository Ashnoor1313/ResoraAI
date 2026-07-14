import React, { useState } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  FileText, 
  Share2, 
  Info,
  Shield,
  Eye
} from 'lucide-react';

interface PortfolioGeneratorProps {
  resumeId: number;
  reportData: any;
  backendUrl: string;
  token?: string;
}

export default function PortfolioGenerator({
  resumeId,
  reportData,
  backendUrl,
  token
}: PortfolioGeneratorProps) {
  const [hostedEnabled, setHostedEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareableUrl = `https://resora.ai/p/ashnoor-chhabra-${resumeId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(`<iframe src="${shareableUrl}" width="100%" height="600px" style="border:none;"></iframe>`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = (format: string) => {
    alert(`Generating and compiling ${format} download...`);
  };

  const candidateName = reportData?.extracted_data?.name || "Candidate Profile";

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in pb-10">
      
      {/* Header */}
      <div className="glass-card p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight">Portfolio Hosting & Generators</h2>
            <p className="text-[10px] text-slate-500 font-medium">Instantly host your interactive resume as a premium online developer portfolio website.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Hosting status */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" /> Hosting Configuration
            </h3>

            <div className="flex justify-between items-center p-3 bg-slate-900/30 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Enable Public Link</span>
                <span className="text-[9.5px] text-slate-500 font-medium">Allow recruiters to view your hosted portfolio</span>
              </div>
              <input
                type="checkbox"
                checked={hostedEnabled}
                onChange={(e) => setHostedEnabled(e.target.checked)}
                className="w-8 h-4 bg-slate-800 rounded-full focus:ring-0 focus:outline-none accent-indigo-500 cursor-pointer"
              />
            </div>

            {hostedEnabled && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Shareable Portfolio Link</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-3 pr-20 py-2.5 text-xs text-indigo-400 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-1">iFrame Embed Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`<iframe src="${shareableUrl}" ...>`}
                      className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-3 pr-20 py-2.5 text-xs text-slate-400 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyEmbed}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : "Copy Code"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="glass-card p-5 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Download className="w-4 h-4 text-indigo-400" /> Export Documents
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
              <button
                onClick={() => handleDownload('DOCX')}
                className="p-3 bg-[#0b101c]/60 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-slate-900/30 transition-all text-center"
              >
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Export DOCX</span>
              </button>

              <button
                onClick={() => handleDownload('JSON')}
                className="p-3 bg-[#0b101c]/60 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-slate-900/30 transition-all text-center"
              >
                <Globe className="w-5 h-5 text-purple-400" />
                <span>JSON Resume</span>
              </button>

              <button
                onClick={() => handleDownload('Plain Text')}
                className="p-3 bg-[#0b101c]/60 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-slate-900/30 transition-all text-center"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span>Plain Text TXT</span>
              </button>

              <button
                onClick={() => handleDownload('Portfolio PDF')}
                className="p-3 bg-[#0b101c]/60 border border-slate-800 rounded-xl hover:border-slate-700 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-slate-900/30 transition-all text-center"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Portfolio PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-card p-5 flex flex-col gap-4 h-full min-h-[360px] relative overflow-hidden">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-indigo-400" /> Mock Browser Frame Preview
              </span>
              {hostedEnabled && (
                <a
                  href={shareableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  View Hosted Portfolio <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {hostedEnabled ? (
              /* Simulated Browser Frame */
              <div className="flex-1 rounded-xl border border-slate-800 bg-[#060913] overflow-hidden flex flex-col min-h-0 select-none opacity-80 hover:opacity-100 transition-opacity">
                {/* Browser top-bar */}
                <div className="h-7 bg-[#0b101d] border-b border-slate-800/80 flex items-center px-4 gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                  <div className="w-48 bg-[#070b13] border border-slate-800/60 rounded text-[9px] text-slate-500 py-0.5 px-3 truncate ml-3 font-mono">
                    {shareableUrl}
                  </div>
                </div>

                {/* Portfolio miniature mockup content */}
                <div className="flex-1 overflow-y-auto p-4 text-[10.5px] text-left text-slate-400 font-sans space-y-4 bg-gradient-to-b from-[#0f1525]/30 to-transparent">
                  {/* Hero card */}
                  <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-indigo-500/10 rounded-xl space-y-1">
                    <span className="text-white font-extrabold text-sm block leading-none">{candidateName}</span>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Aspiring Full-Stack Software Engineer</span>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed font-light mt-1.5">Experienced SDE with a passion for designing scalable cloud systems, deploying RAG pipelines, and building web products.</p>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Skill competencies</span>
                    <div className="flex flex-wrap gap-1">
                      {["Python", "JavaScript", "React", "Node.js", "SQL", "Docker", "PyTorch"].map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 rounded text-[9px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message prompt warning if hosted disabled */}
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex gap-2 items-start text-[10.5px] text-slate-500">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">This miniature mock preview reflects changes in your Resume Twin instantly as you perform inline edits.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-1.5 border border-dashed border-slate-800 rounded-xl">
                <Globe className="w-8 h-8 text-slate-600" />
                <span className="text-xs font-semibold text-slate-300">Public Hosting Disabled</span>
                <p className="text-[10px] text-slate-500 max-w-xs">Enable 'Public Link' in the hosting configuration to activate portfolio preview.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
