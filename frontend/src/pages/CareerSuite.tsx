import React, { useState } from 'react';
import { FileCheck, Mail, UserCheck, Briefcase } from 'lucide-react';
import CoverLetterTailor from './CoverLetterTailor';
import NetworkingOutreach from './NetworkingOutreach';
import InterviewCoach from './InterviewCoach';
import LinkedinAudit from './LinkedinAudit';

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface CareerSuiteProps {
  resumeId?: number;
  targetRole?: string;
  backendUrl: string;
  token: string;
  isMockMode: boolean;
}

type SubTab = 'coverletter' | 'outreach' | 'interview' | 'linkedin';

export default function CareerSuite({
  resumeId,
  targetRole = "Software Developer",
  backendUrl,
  token,
  isMockMode,
}: CareerSuiteProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('coverletter');

  const tabs = [
    { 
      id: 'coverletter', 
      name: 'Cover Letter Tailor', 
      desc: 'Generate customized cover letters aligned to job descriptions.', 
      icon: FileCheck, 
      needsResume: true 
    },
    { 
      id: 'outreach', 
      name: 'Cold Outreach Creator', 
      desc: 'Craft personalized cold emails and recruiter outreach.', 
      icon: Mail, 
      needsResume: true 
    },
    { 
      id: 'interview', 
      name: 'Interview Prep Coach', 
      desc: 'Practice mock interview questions with STAR method strategies.', 
      icon: UserCheck, 
      needsResume: true 
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn Optimizer', 
      desc: 'Audit and enhance your LinkedIn profile to attract recruiters.', 
      icon: LinkedinIcon, 
      needsResume: false 
    },
  ];

  const activeTabDetails = tabs.find(t => t.id === activeTab);

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in pb-10">
      
      {/* Header Banner */}
      <div className="glass-card p-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight">AI Career Suite</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Use advanced AI engines to tailor your job search materials and prepare for interviews.</p>
        </div>
      </div>

      {/* Cards Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTab)}
              className={`flex flex-col gap-2.5 p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/5 text-white'
                  : 'bg-[#0b0f19] hover:bg-[#0f1525] border-[#1e2740] hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  isActive
                    ? 'bg-indigo-500 text-white border-indigo-400/20 shadow-md shadow-indigo-500/20'
                    : 'bg-[#0f1525] text-slate-400 border-slate-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">{tab.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>


      {/* Dynamic Content Panel */}
      <div className="flex-1">
        {activeTabDetails?.needsResume && !resumeId ? (
          <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
            <Briefcase className="w-10 h-10 text-slate-600" />
            <h3 className="font-semibold text-sm text-slate-300">Resume Context Required</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Please upload a resume first under the <b>My Resumes</b> tab to use this tool with your professional background details.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'coverletter' && (
              <CoverLetterTailor
                resumeId={resumeId!}
                targetRole={targetRole}
                backendUrl={backendUrl}
                token={token}
                isMockMode={isMockMode}
              />
            )}
            {activeTab === 'outreach' && (
              <NetworkingOutreach
                resumeId={resumeId!}
                targetRole={targetRole}
                backendUrl={backendUrl}
                token={token}
                isMockMode={isMockMode}
              />
            )}
            {activeTab === 'interview' && (
              <InterviewCoach
                resumeId={resumeId!}
                targetRole={targetRole}
                backendUrl={backendUrl}
                token={token}
                isMockMode={isMockMode}
              />
            )}
            {activeTab === 'linkedin' && (
              <LinkedinAudit
                backendUrl={backendUrl}
                token={token}
                isMockMode={isMockMode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
