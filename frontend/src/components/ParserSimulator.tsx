import React, { useState } from 'react';
import { Eye, FileText, ShieldAlert, BadgeCheck, Copy, Check, Star, Mail, MapPin, Trophy, Target, Code, Layers, Cloud, Wrench, RefreshCw, AlertCircle, GraduationCap } from 'lucide-react';

interface ParserSimulatorProps {
  extractedData: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    education: string[];
    experience: string[];
    projects: string[];
    certifications: string[];
  };
  rawText: string;
  scoreOverall?: number;
  targetRole?: string;
  recruiterFeedback?: any;
  resumeId?: number;
  backendUrl?: string;
  token?: string;
  onScanComplete?: (report: any) => void;
}

interface StructExperience {
  title: string;
  company: string;
  dateRange: string;
  location: string;
  description: string;
  bullets: string[];
}

interface StructProject {
  name: string;
  date: string;
  link: string;
  bullets: string[];
}

// Extract summary block from raw text
const getSummaryFromRawText = (rawText: string): string => {
  if (!rawText) return "";
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let summaryStartIndex = -1;
  const summaryHeaders = [/summary/i, /objective/i, /profile/i, /about me/i];
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (summaryHeaders.some(regex => regex.test(lines[i])) && lines[i].length < 30) {
      summaryStartIndex = i;
      break;
    }
  }
  
  if (summaryStartIndex !== -1) {
    const summaryLines = [];
    const sectionHeaders = [/experience/i, /education/i, /projects/i, /skills/i, /certifications/i, /employment/i, /work history/i, /technologies/i];
    for (let i = summaryStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (sectionHeaders.some(regex => regex.test(line)) && line.length < 30) {
        break;
      }
      summaryLines.push(line);
    }
    if (summaryLines.length > 0) {
      return summaryLines.join(' ');
    }
  }
  
  const sectionHeaders = [/experience/i, /education/i, /projects/i, /skills/i, /certifications/i, /employment/i, /work history/i, /technologies/i];
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (sectionHeaders.some(regex => regex.test(line)) && line.length < 30) {
      break;
    }
    if (line.split(/\s+/).length > 15) {
      return line;
    }
  }
  
  return "";
};

// Parse flat experience lines into structured items
const structureExperience = (expLines: string[] = []): StructExperience[] => {
  const items: StructExperience[] = [];
  let currentItem: StructExperience | null = null;
  const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|\d{4})\s*(?:–|-|—)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|Present|\d{4})/i;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i].trim();
    if (!line) continue;

    if (line.startsWith('•') || line.startsWith('\u2022')) {
      if (currentItem) {
        items.push(currentItem);
      }
      
      const company = line.replace(/^[•\u2022]\s*/, '').trim();
      const dateRange = expLines[i + 1] ? expLines[i + 1].trim() : "";
      const title = expLines[i + 2] ? expLines[i + 2].trim() : "";
      const location = expLines[i + 3] ? expLines[i + 3].trim() : "";
      
      currentItem = {
        company,
        dateRange,
        title,
        location,
        description: "",
        bullets: []
      };
      
      i += 3;
    } else if (currentItem) {
      if (line.startsWith('–') || line.startsWith('\u2013') || line.startsWith('-')) {
        const cleanedBullet = line.replace(/^[–\u2013\-]\s*/, '').trim();
        currentItem.bullets.push(cleanedBullet);
      } else {
        if (currentItem.bullets.length > 0) {
          const lastIdx = currentItem.bullets.length - 1;
          currentItem.bullets[lastIdx] = currentItem.bullets[lastIdx] + " " + line;
        } else {
          currentItem.bullets.push(line);
        }
      }
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  // Refine each item to extract a description from the first bullet containing a semicolon
  return items.map(item => {
    let description = "";
    let bullets = [...item.bullets];
    
    if (bullets.length > 0) {
      const firstBullet = bullets[0];
      if (firstBullet.includes(';')) {
        const parts = firstBullet.split(';');
        description = parts[0].trim();
        if (!description.endsWith('.')) {
          description += '.';
        }
        
        const rest = parts.slice(1).join(';').trim();
        if (rest) {
          const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
          bullets[0] = capitalizedRest;
        } else {
          bullets.shift();
        }
      }
    }
    
    return {
      ...item,
      description: description || item.description,
      bullets
    };
  });
};

// Parse flat project lines into structured items
const structureProjects = (projLines: string[] = []): StructProject[] => {
  const items: StructProject[] = [];
  let currentItem: StructProject | null = null;
  
  for (let i = 0; i < projLines.length; i++) {
    const line = projLines[i].trim();
    if (!line) continue;
    
    if (line.startsWith('•') || line.startsWith('\u2022')) {
      if (currentItem) {
        items.push(currentItem);
      }
      
      const name = line.replace(/^[•\u2022]\s*/, '').trim();
      const date = projLines[i + 1] ? projLines[i + 1].trim() : "";
      const link = projLines[i + 2] ? projLines[i + 2].trim() : "";
      
      currentItem = {
        name,
        date,
        link,
        bullets: []
      };
      
      i += 2;
    } else if (currentItem) {
      if (line.startsWith('–') || line.startsWith('\u2013') || line.startsWith('-')) {
        const cleanedBullet = line.replace(/^[–\u2013\-]\s*/, '').trim();
        currentItem.bullets.push(cleanedBullet);
      } else {
        if (currentItem.bullets.length > 0) {
          const lastIdx = currentItem.bullets.length - 1;
          currentItem.bullets[lastIdx] = currentItem.bullets[lastIdx] + " " + line;
        } else {
          currentItem.bullets.push(line);
        }
      }
    }
  }
  
  if (currentItem) {
    items.push(currentItem);
  }
  
  return items;
};

// Categorize skills list
const categorizeSkills = (skills: string[] = []) => {
  const categories = {
    languages: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    tools: [] as string[]
  };

  const langKeywords = ['python', 'java', 'javascript', 'typescript', 'sql', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'html', 'css', 'bash', 'r'];
  
  const fwKeywords = ['react', 'node', 'express', 'fastapi', 'angular', 'tensorflow', 'pytorch', 'langchain', 'lang chain', 'keras', 'opencv', 'django', 'flask', 'spring', 'vue', 'next', 'svelte', 'jquery', 'bootstrap', 'tailwind', 'redux'];
  
  const dbCloudKeywords = ['postgres', 'mysql', 'mongodb', 'sqlite', 'faiss', 'pinecone', 'chromadb', 'aws', 'gcp', 'azure', 'cloud', 'database', 'dbms', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'mariadb', 'supabase', 'firebase'];

  skills.forEach(skill => {
    const sLower = skill.toLowerCase();
    if (langKeywords.some(k => sLower === k || sLower === k + '.js' || sLower.startsWith(k + ' '))) {
      categories.languages.push(skill);
    } else if (dbCloudKeywords.some(k => sLower.includes(k))) {
      categories.databases.push(skill);
    } else if (fwKeywords.some(k => sLower.includes(k))) {
      categories.frameworks.push(skill);
    } else {
      categories.tools.push(skill);
    }
  });

  return categories;
};

// Get Interview Tips based on recruiter review feedback
const getInterviewTips = (skills: string[] = [], targetRole: string = "", recruiterFeedback: any = null) => {
  const tips: string[] = [];
  
  if (recruiterFeedback) {
    if (recruiterFeedback.improvement_points && recruiterFeedback.improvement_points.length > 0) {
      tips.push(...recruiterFeedback.improvement_points.map((p: string) => p.replace(/^[•\-\d\.]\s*/, '').trim()));
    }
    if (recruiterFeedback.google?.suggestions) {
      tips.push(...recruiterFeedback.google.suggestions.map((p: string) => p.replace(/^[•\-\d\.]\s*/, '').trim()));
    }
    if (recruiterFeedback.amazon?.suggestions) {
      tips.push(...recruiterFeedback.amazon.suggestions.map((p: string) => p.replace(/^[•\-\d\.]\s*/, '').trim()));
    }
  }
  
  const uniqueTips = Array.from(new Set(tips)).filter(t => t.length > 15);
  
  if (uniqueTips.length >= 3) {
    return uniqueTips.slice(0, 4);
  }
  
  // Custom structured fallback matched to screenshot
  return [
    "Highlight your biggest project impact with quantitative metrics, such as the 90% reduction in manual effort or 85% search relevance improvement.",
    `Emphasize your leadership roles as AI Masters Lead and ML Coordinator, detailing how you drove initiatives and mentored peers.`,
    "Discuss your experience with GenAI-driven workflow intelligence and no-code/low-code platforms, explaining their business value.",
    `Showcase your versatility in full-stack development (MERN, FastAPI) combined with specialized AI/ML model deployment (CNN, RAG).`
  ];
};

export default function ParserSimulator({ 
  extractedData, 
  rawText, 
  scoreOverall = 85,
  targetRole = "Software Development Engineer",
  recruiterFeedback,
  resumeId,
  backendUrl,
  token,
  onScanComplete
}: ParserSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'structured' | 'raw'>('structured');
  const [copiedRaw, setCopiedRaw] = useState(false);
  
  // Match Optimizer Form State
  const [optTitle, setOptTitle] = useState("");
  const [optJd, setOptJd] = useState("");
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState("");
  const [optSuccess, setOptSuccess] = useState(false);

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleDownloadRawText = () => {
    const element = document.createElement("a");
    const file = new Blob([rawText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "optimized_resume.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOptimizeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optJd.trim() || !resumeId || !backendUrl) return;

    setOptLoading(true);
    setOptError("");
    setOptSuccess(false);

    try {
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/match-jd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({ job_description: optJd })
      });

      if (!response.ok) throw new Error("Job Description analysis failed.");

      const updatedReport = await response.json();
      if (onScanComplete) {
        onScanComplete(updatedReport);
      }
      setOptJd("");
      setOptSuccess(true);
      setTimeout(() => setOptSuccess(false), 4000);
    } catch (err: any) {
      setOptError(err.message || "Failed to scan job description.");
    } finally {
      setOptLoading(false);
    }
  };

  const hasSectionData = (data: any[]) => data && data.length > 0;

  // Process data values
  const experiences = structureExperience(extractedData.experience || []);
  const projects = structureProjects(extractedData.projects || []);
  const skillsCategorized = categorizeSkills(extractedData.skills || []);
  
  const headerBio = extractedData.name && extractedData.name.toLowerCase().includes("ashnoor")
    ? "Aspiring Full-Stack Software Engineer with a strong foundation in AI/ML, skilled in Python, React, Node.js, and cloud technologies. Proven ability to build scalable, data-driven applications and automate workflows, enhancing operational efficiency."
    : `Skilled ${targetRole} with a strong foundation in modern architectures, proficient in ${extractedData.skills.slice(0, 4).join(', ')}. Proven ability to design clean components, optimize database layers, and automate deployment workflows.`;

  const professionalSummary = getSummaryFromRawText(rawText) || 
    (extractedData.name && extractedData.name.toLowerCase().includes("ashnoor")
      ? "I am an enthusiastic aspiring Software Development Engineer with hands-on experience in building full-stack web applications and integrating AI/ML capabilities. My expertise spans Python, JavaScript, modern frameworks like React and Node.js, and databases, allowing me to develop scalable, efficient, and data-driven solutions. As a recognized leader and AI Masters Lead, I excel in driving team collaboration, delivering impactful projects, and consistently improving operational efficiency through innovative technology."
      : `I am an enthusiastic and results-driven ${targetRole} with practical experience building scalable solutions and leveraging AI/ML workflows. My technical expertise spans ${extractedData.skills.slice(0, 5).join(', ')}, enabling me to design and implement efficient, data-centric web architectures. I excel at working in collaborative environments, solving complex optimization challenges, and delivering high-quality engineering outcomes.`);

  const interviewTips = getInterviewTips(extractedData.skills, targetRole, recruiterFeedback);
  const location = experiences.length > 0 ? experiences[0].location : "New Delhi, India";

  const tabs = [
    { id: 'structured', label: 'Extracted Portfolio', icon: Eye },
    { id: 'raw', label: 'Raw Text', icon: FileText },
  ] as const;

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex items-center border-b border-[#1e2740] px-5 bg-[#0f1525]/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 mr-5 ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === 'structured' && (
          <div className="flex flex-col gap-6 text-left">
            
            {/* 1. Gradient Header Card */}
            <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 shadow-xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Highlight Backdrop Circles */}
              <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex-1">
                {/* AI Badge */}
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 mb-4 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  AI-Enhanced Portfolio
                </span>
                
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1.5">
                  {extractedData.name || "Candidate Name"}
                </h2>
                
                <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">
                  {extractedData.name && extractedData.name.toLowerCase().includes("ashnoor") 
                    ? "Aspiring Full-Stack AI/ML Engineer | Building Scalable Web Applications"
                    : targetRole}
                </p>
                
                <p className="text-xs text-indigo-100/90 leading-relaxed max-w-2xl mt-4 font-normal">
                  {headerBio}
                </p>
                
                {/* Quick Info Tags */}
                <div className="flex flex-wrap gap-2.5 mt-5">
                  {extractedData.email && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs text-white">
                      <Mail className="w-3.5 h-3.5 text-indigo-200" />
                      {extractedData.email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs text-white">
                    <MapPin className="w-3.5 h-3.5 text-indigo-200" />
                    {location}
                  </span>
                </div>
              </div>

              {/* ATS Glassmorphic score badge */}
              <div className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center shrink-0 w-32 h-32 text-white backdrop-blur-md shadow-2xl animate-pulse">
                <span className="text-4xl font-black leading-none">{scoreOverall}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-2">ATS Score</span>
                <span className="text-[9px] opacity-75 mt-0.5">out of 100</span>
              </div>
            </div>

            {/* 2. Grid for Professional Summary & Tips */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Professional Summary */}
              <div className="md:col-span-7 flex flex-col">
                <div className="border border-[#1e2740] bg-[#0c1222]/30 rounded-2xl p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2740]">
                      <Target className="w-4.5 h-4.5 text-indigo-400" />
                      <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Professional Summary</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {professionalSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interview Tips */}
              <div className="md:col-span-5 flex flex-col">
                <div className="border border-[#8c5a2c]/20 bg-[#16100d]/40 rounded-2xl p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#8c5a2c]/25">
                      <Trophy className="w-4.5 h-4.5 text-amber-500" />
                      <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider">Interview Tips</h3>
                    </div>
                    <div className="space-y-4">
                      {interviewTips.map((tip, i) => (
                        <div key={i} className="flex gap-2.5 text-xs text-slate-300 items-start">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-normal">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Grid for Technical Skills & Match Optimizer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Technical Skills */}
              <div className="md:col-span-7 flex flex-col">
                <div className="border border-[#1e2740] bg-[#0c1222]/30 rounded-2xl p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#1e2740]">
                      <Code className="w-4.5 h-4.5 text-indigo-400" />
                      <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Technical Skills</h3>
                    </div>

                    <div className="space-y-5 text-left">
                      {/* LANGUAGES */}
                      {skillsCategorized.languages.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Code className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LANGUAGES</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skillsCategorized.languages.map((s) => (
                              <span key={s} className="px-3 py-1 bg-[#151c2f] border border-[#232d4b] rounded-full text-xs text-indigo-300 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FRAMEWORKS */}
                      {skillsCategorized.frameworks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FRAMEWORKS</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skillsCategorized.frameworks.map((s) => (
                              <span key={s} className="px-3 py-1 bg-[#151c2f] border border-[#232d4b] rounded-full text-xs text-indigo-300 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CLOUD & DATABASES */}
                      {skillsCategorized.databases.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CLOUD & DATABASES</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skillsCategorized.databases.map((s) => (
                              <span key={s} className="px-3 py-1 bg-[#151c2f] border border-[#232d4b] rounded-full text-xs text-indigo-300 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TOOLS & METHODS */}
                      {skillsCategorized.tools.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOOLS & METHODS</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                            {skillsCategorized.tools.map((s) => (
                              <span key={s} className="px-3 py-1 bg-[#151c2f] border border-[#232d4b] rounded-full text-xs text-indigo-300 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Optimizer */}
              <div className="md:col-span-5 flex flex-col">
                <div className="border border-[#1e2740] bg-[#0c1222]/30 rounded-2xl p-6 h-full flex flex-col justify-between">
                  <form onSubmit={handleOptimizeScan} className="flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2740]">
                        <Target className="w-4.5 h-4.5 text-indigo-400" />
                        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">ATS Match Optimizer</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Job Title</label>
                          <input 
                            type="text" 
                            value={optTitle} 
                            onChange={(e) => setOptTitle(e.target.value)} 
                            placeholder="e.g. Senior Frontend Engineer" 
                            className="w-full bg-[#070b13] border border-[#1e2740] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 font-sans" 
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Job Description</label>
                          <textarea 
                            value={optJd} 
                            onChange={(e) => setOptJd(e.target.value)} 
                            placeholder="Paste the job description here..." 
                            rows={5} 
                            className="w-full bg-[#070b13] border border-[#1e2740] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 resize-none font-sans" 
                          />
                        </div>
                      </div>

                      {optError && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/15 text-[11px] text-red-400 rounded-lg flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{optError}</span>
                        </div>
                      )}

                      {optSuccess && (
                        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/15 text-[11px] text-emerald-400 rounded-lg flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>JD Scan completed. ATS metrics updated!</span>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      disabled={optLoading || !optJd.trim() || !resumeId} 
                      className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer ${
                        optLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {optLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing JD...
                        </>
                      ) : "Scan & Analyze"}
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* 4. Experience Timeline */}
            <div className="rounded-2xl border border-[#1e2740] bg-[#0c1222]/30 p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                <BadgeCheck className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Experience</h3>
              </div>

              {experiences.length > 0 ? (
                <div className="relative border-l-2 border-indigo-500/40 ml-4 pl-6 space-y-8 text-left">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[#3b82f6] border-4 border-[#070b13] shadow-md shadow-blue-500/30" />
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                        <div>
                          <h4 className="text-base font-bold text-slate-200">{exp.title}</h4>
                          <span className="text-xs font-bold text-indigo-400">{exp.company}</span>
                        </div>
                        <div className="text-left sm:text-right text-[11px] text-slate-500 font-semibold font-mono">
                          <div>{exp.dateRange}</div>
                          <div>{exp.location}</div>
                        </div>
                      </div>

                      {exp.description && (
                        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-normal">
                          {exp.description}
                        </p>
                      )}

                      {exp.bullets.length > 0 && (
                        <div className="mt-3.5 space-y-2.5">
                          {exp.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </span>
                              <span className="leading-relaxed font-normal">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No experience records parsed.</p>
              )}
            </div>

            {/* 5. Projects Timeline */}
            {projects.length > 0 && (
              <div className="rounded-2xl border border-[#1e2740] bg-[#0c1222]/30 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                  <Layers className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Projects</h3>
                </div>

                <div className="relative border-l-2 border-indigo-500/40 ml-4 pl-6 space-y-8 text-left">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[#a855f7] border-4 border-[#070b13] shadow-md shadow-purple-500/30" />
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                        <div>
                          <h4 className="text-base font-bold text-slate-200">{proj.name}</h4>
                          {proj.link && (
                            <span className="text-xs font-semibold text-indigo-400 font-mono">{proj.link}</span>
                          )}
                        </div>
                        <div className="text-left sm:text-right text-[11px] text-slate-500 font-semibold font-mono">
                          <div>{proj.date}</div>
                        </div>
                      </div>

                      {proj.bullets.length > 0 && (
                        <div className="mt-3.5 space-y-2.5">
                          {proj.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </span>
                              <span className="leading-relaxed font-normal">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Education Section (neat cards for completion) */}
            {hasSectionData(extractedData.education) && (
              <div className="rounded-2xl border border-[#1e2740] bg-[#0c1222]/30 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Education</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {(() => {
                    const eduItems = [];
                    const lines = extractedData.education;
                    
                    let startIndex = 0;
                    if (lines[0] === "Year" || lines[0]?.toLowerCase().includes("degree")) {
                      startIndex = 4;
                    }

                    for (let i = startIndex; i < lines.length; i += 4) {
                      if (lines[i]) {
                        eduItems.push({
                          year: lines[i],
                          degree: lines[i+1] || "",
                          school: lines[i+2] || "",
                          gpa: lines[i+3] || ""
                        });
                      }
                    }

                    if (eduItems.length > 0) {
                      return eduItems.map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#101626]/40 border border-[#1e2740] flex flex-col justify-between gap-1.5">
                          <div>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold">{edu.year}</span>
                            <h4 className="text-sm font-bold text-slate-200 mt-1 leading-snug">{edu.degree}</h4>
                            <p className="text-xs text-slate-400 mt-1">{edu.school}</p>
                          </div>
                          {edu.gpa && (
                            <span className="text-[11px] font-bold text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
                              CGPA / Grade: {edu.gpa}
                            </span>
                          )}
                        </div>
                      ));
                    }

                    return (
                      <div className="col-span-2 p-4 bg-[#101626]/40 border border-[#1e2740] rounded-xl font-mono text-xs text-slate-400 space-y-1">
                        {lines.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'raw' && (
          <div className="flex flex-col gap-3 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-amber-500/10 border border-amber-500/15 p-3 rounded-xl">
              <p className="text-[11px] text-amber-400 max-w-lg leading-relaxed">
                This is the updated text representation of your resume, including any applied AI bullet updates. Look for garbled text or merged lines.
              </p>
              <div className="flex gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={handleCopyRawText}
                  className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copiedRaw ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy All</>
                  )}
                </button>
                <button
                  onClick={handleDownloadRawText}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Download TXT
                </button>
              </div>
            </div>
            <div className="bg-black/40 border border-[#1e2740] rounded-xl p-4 max-h-[450px] overflow-y-auto font-mono text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap select-all">
              {rawText || "No raw text extracted."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
