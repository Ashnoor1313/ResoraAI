import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Building, 
  UserCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  Award, 
  FileText, 
  Activity,
  Check,
  X
} from 'lucide-react';

interface LandingPageProps {
  onStart: (token: string, email: string) => void;
  onAlert: (msg: string) => void;
  backendUrl: string;
}

// Sample Resumes for Sandbox Playground
const SAMPLE_RESUMES = [
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Full Stack Developer",
    filename: "Alex_Rivera_Resume.pdf",
    jd: "React, Node.js, and PostgreSQL developer to design and scale cloud-native applications.",
    score: 87,
    breakdown: {
      parsing: 95,
      keywords: 82,
      formatting: 90,
      achievements: 85,
      readability: 88,
      completeness: 90,
      alignment: 85
    },
    missing: ["PostgreSQL", "Next.js", "Redis"],
    warnings: ["Unsafe font 'Helvetica-Bold' detected in header margins."],
    recruiter: "Tech Recruiter: Solid compliance with the industry-standard XYZ structure in 80% of bullets. Shows good algorithmic scale and cloud optimization metrics. Excellent core match."
  },
  {
    id: "jessica",
    name: "Jessica Taylor",
    role: "Product Manager",
    filename: "Jessica_Taylor_CV.docx",
    jd: "Agile product manager to drive cross-functional roadmap execution and user metrics growth.",
    score: 64,
    breakdown: {
      parsing: 80,
      keywords: 62,
      formatting: 65,
      achievements: 58,
      readability: 70,
      completeness: 75,
      alignment: 60
    },
    missing: ["Product Roadmap", "KPI", "Scrum Master", "Agile Methodology"],
    warnings: [
      "Multi-column layout structure detected (increases parsing scrambling risks).",
      "Embedded graphical elements / skill rating bars found on page 1."
    ],
    recruiter: "Startup Hiring Manager: Solid leadership traits, but experience bullets describe tasks rather than impact. Reframing is needed to show active ownership metrics."
  }
];

export default function LandingPage({ onStart, onAlert, backendUrl }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleClientId, setGoogleClientId] = useState<string>("");

  useEffect(() => {
    fetch(`${backendUrl}/api/v1/auth/config`)
      .then(res => res.json())
      .then(data => {
        if (data.google_client_id) {
          setGoogleClientId(data.google_client_id);
        }
      })
      .catch(err => console.error("Error loading auth config:", err));
  }, [backendUrl]);

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/v1/auth/google/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      
      if (!res.ok) {
        throw new Error("Failed to verify Google login token.");
      }
      
      const data = await res.json();
      if (data.access_token && data.email) {
        onStart(data.access_token, data.email);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      onAlert(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAuthModal && googleClientId && (window as any).google) {
      const google = (window as any).google;
      setTimeout(() => {
        try {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });
          const container = document.getElementById("google-signin-btn-container");
          if (container) {
            google.accounts.id.renderButton(container, {
              theme: "filled_black",
              size: "large",
              width: container.offsetWidth || 350,
              shape: "rectangular",
              logo_alignment: "left"
            });
          }
        } catch (e) {
          console.error("GIS render error:", e);
        }
      }, 100);
    }
  }, [showAuthModal, googleClientId]);

  // Sandbox Playground State
  const [selectedSample, setSelectedSample] = useState(SAMPLE_RESUMES[0]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPlaygroundResult, setShowPlaygroundResult] = useState(false);
  const [playgroundScore, setPlaygroundScore] = useState(0);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Bullet Optimizer Playground State
  const [playgroundBulletInput, setPlaygroundBulletInput] = useState("I worked on the company website.");
  const [selectedWeakBullet, setSelectedWeakBullet] = useState(0);
  const [optimizingBullet, setOptimizingBullet] = useState(false);
  const [showBulletResult, setShowBulletResult] = useState(false);

  // Demo score circle ticking
  const [demoScore, setDemoScore] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoScore(prev => {
        if (prev >= 87) {
          clearInterval(interval);
          return 87;
        }
        return prev + 1;
      });
    }, 18);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (authMode === 'signup' && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const endpoint = authMode === 'signup' ? '/api/v1/auth/signup' : '/api/v1/auth/login';

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed. Check credentials.");
      }

      setShowAuthModal(false);
      onStart(data.access_token, data.email);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Run Sandbox Simulation Scanner
  const triggerSandboxScan = () => {
    setScanning(true);
    setScanProgress(0);
    setShowPlaygroundResult(false);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      setScanning(false);
      setShowPlaygroundResult(true);
      
      // Animate score counter
      let s = 0;
      const scoreInterval = setInterval(() => {
        if (s >= selectedSample.score) {
          clearInterval(scoreInterval);
        } else {
          s += 2;
          setPlaygroundScore(Math.min(s, selectedSample.score));
        }
      }, 15);
    }, 2500);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const features = [
    { 
      icon: ShieldCheck, 
      title: "ATS Parsing Simulator", 
      desc: "Compare what parsers see side-by-side with raw documents to uncover formatting errors.", 
      color: "text-indigo-400",
      bg: "bg-indigo-500/5 border-indigo-500/10" 
    },
    { 
      icon: Zap, 
      title: "Semantic JD Matching", 
      desc: "Extract missing role-specific keywords using cosine similarity algorithms.", 
      color: "text-amber-400",
      bg: "bg-amber-500/5 border-amber-500/10" 
    },
    { 
      icon: UserCheck, 
      title: "AI Recruiter Persona", 
      desc: "Brutally honest feedback from corporate tech leaders and startup recruiting managers.", 
      color: "text-emerald-400",
      bg: "bg-emerald-500/5 border-emerald-500/10" 
    },
    { 
      icon: Building, 
      title: "Enterprise Readiness Rubrics", 
      desc: "Detailed scoring index checking systems scale, ownership results, and metrics density against top-tier tech benchmarks.", 
      color: "text-sky-400",
      bg: "bg-sky-500/5 border-sky-500/10" 
    },
    { 
      icon: Sparkles, 
      title: "XYZ Bullet Optimizer", 
      desc: "Auto-rewrite weak bullet points into high-impact accomplishments with quantified data using the industry-standard XYZ formula.", 
      color: "text-violet-400",
      bg: "bg-violet-500/5 border-violet-500/10" 
    },
    { 
      icon: FileText, 
      title: "Cover Letter Tailor", 
      desc: "Instantly draft professional, technical, or startup cover letters tailored to the job description.", 
      color: "text-rose-400",
      bg: "bg-rose-500/5 border-rose-500/10" 
    }
  ];

  const stats = [
    { value: "98.4%", label: "ATS Parser Reliability" },
    { value: "14,500+", label: "Resumes Audited" },
    { value: "3.5x", label: "Average Callbacks Increase" },
    { value: "20+", label: "Hiring Personas Modeled" }
  ];

  const SAMPLE_WEAK_BULLETS = [
    {
      original: "I worked on the company website.",
      optimized: "Engineered a responsive React dashboard, optimizing code-splitting and asset compression to reduce bundle sizes by 35% and improve PageSpeed score by 18 points.",
      explanation: "Accomplished X (improving PageSpeed by 18 points) as measured by Y (35% bundle reduction) by doing Z (React code-splitting and asset compression)."
    },
    {
      original: "Responsible for database query speed.",
      optimized: "Optimized PostgreSQL query indexes and configured connection pooling, boosting database transaction throughput by 65% under peak loads of 10K+ concurrent requests.",
      explanation: "Accomplished X (boosting transaction throughput) as measured by Y (65% increase under 10K+ peak loads) by doing Z (query indexing and connection pooling)."
    },
    {
      original: "I made a chatbot for customer service.",
      optimized: "Developed an AI-powered customer support chatbot using FastAPI and LangChain, reducing user inquiry response latency by 40% and saving 15+ support engineer hours weekly.",
      explanation: "Accomplished X (reducing response latency) as measured by Y (40% response reduction, 15+ hours saved) by doing Z (FastAPI/LangChain chatbot)."
    }
  ];

  const faqs = [
    {
      q: "What makes Resora AI different from other resume builders?",
      a: "Unlike generic builders that use arbitrary formatting calculators, Resora AI implements a zero-variance deterministic scoring engine coupled with Gemini AI recruiter personas. We show you exactly 'what the ATS sees' side-by-side with visual formatting alerts and offer direct, rule-based bullet optimization."
    },
    {
      q: "How does the AI Recruiter Persona screening work?",
      a: "We model actual recruiting rubrics. The corporate persona audits your experience for computing scale and XYZ structure. The enterprise persona screens for STAR format compliance and structured ownership criteria. The Startup persona prioritizes agility and growth."
    },
    {
      q: "Is my personal data secure?",
      a: "Yes. All uploaded files are stored in a secured directory, and parsed text is processed within a secure sandbox. We do not sell or share resume data with external scrapers."
    },
    {
      q: "Can I use Resora AI offline?",
      a: "Absolutely. Resora AI runs offline using simulated evaluations."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Background grids and glowing blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none animate-drift-slow" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-violet-500/6 rounded-full blur-[140px] pointer-events-none animate-drift-medium" />



      {/* Ambient Pulsing Bokeh Particles */}
      <div className="absolute top-[25%] left-[15%] w-1.5 h-1.5 bg-indigo-400 rounded-full blur-[0.5px] opacity-40 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-[40%] right-[22%] w-1 h-1 bg-pink-400 rounded-full blur-[0.5px] opacity-50 animate-pulse-slow pointer-events-none [animation-delay:2s]" />
      <div className="absolute top-[65%] left-[28%] w-2 h-2 bg-purple-400 rounded-full blur-[1px] opacity-30 animate-pulse-slow pointer-events-none [animation-delay:4s]" />
      <div className="absolute top-[12%] right-[32%] w-1 h-1 bg-white rounded-full blur-[0.5px] opacity-60 animate-pulse-slow pointer-events-none [animation-delay:1s]" />
      <div className="absolute top-[78%] right-[12%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] opacity-40 animate-pulse-slow pointer-events-none [animation-delay:3s]" />

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <polyline points="9 15 11 17 15 13" />
            </svg>
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            Resora AI
          </span>
        </div>
        
        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#playground" className="hover:text-white transition-colors">Interactive Scanner</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#bullet-playground" className="hover:text-white transition-colors">Bullet Optimizer</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenAuth('login')}
            className="px-4 py-2 text-slate-300 text-xs font-semibold hover:text-white transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => handleOpenAuth('signup')}
            className="px-4.5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10.5px] font-bold tracking-wide uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Explainable Resume Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6 text-white">
            Bypass the Ambiguity of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              ATS Rejections
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-lg leading-relaxed">
            Get mathematically transparent compatibility scores. Simulate scanner extracts, identify critical keyword gaps, and optimize bullets instantly using Google Recruiter rubrics.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => handleOpenAuth('signup')}
              className="px-7 py-3.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Your Resume
            </button>
            <a
              href="#playground"
              className="px-7 py-3.5 rounded-xl bg-[#0d1323] border border-[#1e2740] hover:border-slate-600 transition-all font-semibold text-slate-300 hover:text-white text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Try Interactive Scanner <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Demo Score Circular Progress Ring Card */}
        <div className="lg:col-span-5 w-full flex justify-center animate-float">
          <div className="w-full max-w-sm glass-card p-6 relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1e2740]">
              <span className="font-semibold text-slate-300 text-xs">ATS Compatibility Index</span>
              <span className="text-[10px] text-indigo-400 font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10">Engine Calibration</span>
            </div>

            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#101726" strokeWidth="5.5" fill="transparent" />
                  <circle 
                    cx="50" cy="50" r="42" 
                    stroke="#6366F1"
                    strokeWidth="5.5" 
                    fill="transparent" 
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 - (263.89 * demoScore) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight text-white">{demoScore}</span>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Score</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-5">
              {[
                { label: "Deterministic Parsing", pct: 96, color: "bg-emerald-500" },
                { label: "Keyword Matching", pct: 82, color: "bg-amber-500" },
                { label: "Formatting Cleanliness", pct: 90, color: "bg-indigo-500" },
                { label: "Achievement Quantifiers", pct: 80, color: "bg-violet-500" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 w-28 truncate">{row.label}</span>
                  <div className="flex-1 mx-3 h-1 bg-[#101726] rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="font-bold text-slate-300 w-6 text-right">{row.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Playground Simulator */}
      <section id="playground" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#121828]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Live Demo Playground</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Simulate an ATS Scan Instantly</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Select one of our preset candidate profiles and review how our scanning pipeline extracts and grades structure in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Preset Selector */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="glass-card p-5 flex flex-col gap-3 text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Profile</span>
              <div className="flex flex-col gap-2">
                {SAMPLE_RESUMES.map(resume => (
                  <button
                    key={resume.id}
                    onClick={() => {
                      setSelectedSample(resume);
                      setShowPlaygroundResult(false);
                      setScanProgress(0);
                    }}
                    disabled={scanning}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedSample.id === resume.id 
                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                        : "bg-[#050811]/30 border-slate-800/40 hover:bg-[#050811]/60 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 hover:translate-x-0.5"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-200 block">{resume.name}</span>
                    <span className="text-[10px] text-slate-500">{resume.role} · {resume.filename}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 border-t border-slate-800/60 pt-3.5 flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Job Description</span>
                  <div className="p-3 bg-[#050811]/45 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 leading-relaxed italic">
                    "{selectedSample.jd}"
                  </div>
                </div>

                <button
                  onClick={triggerSandboxScan}
                  disabled={scanning}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running Pipeline...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" /> Simulate Audit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Window */}
          <div className="lg:col-span-8 glass-card p-6 min-h-[380px] flex flex-col items-center justify-center relative">
            {scanning && (
              <div className="flex flex-col items-center gap-4 py-10">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300 mb-1">ATS Scanner Pipeline Active</p>
                  <p className="text-[10.5px] text-slate-500">
                    {scanProgress < 25 && "Uploading document stream..."}
                    {scanProgress >= 25 && scanProgress < 50 && "Parsing font coordinates and columns..."}
                    {scanProgress >= 50 && scanProgress < 75 && "Matching keywords via semantic index..."}
                    {scanProgress >= 75 && "Compiling recruiter audit profiles..."}
                  </p>
                </div>
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            )}

            {!scanning && !showPlaygroundResult && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <FileText className="w-10 h-10 text-slate-700 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-400">Scan Results Ready</h4>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Click the <b>Simulate Audit</b> button to see structural evaluations, scoring breakdowns, and persona checks.
                </p>
              </div>
            )}

            {!scanning && showPlaygroundResult && (
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 text-left animate-fade-in">
                {/* Score */}
                <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/60 pb-6 md:pb-0 md:pr-6">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#101726" strokeWidth="5.5" fill="transparent" />
                      <circle 
                        cx="50" cy="50" r="42" 
                        stroke="#6366F1"
                        strokeWidth="5.5" 
                        fill="transparent" 
                        strokeDasharray={263.89}
                        strokeDashoffset={263.89 - (263.89 * playgroundScore) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-white">{playgroundScore}%</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Overall Score</span>
                </div>

                {/* Breakdowns */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-300 mb-2">Keyword Gaps</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSample.missing.map(m => (
                        <span key={m} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/15 text-[10px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          &times; {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-300 mb-2">Formatting Warnings</h4>
                    <div className="flex flex-col gap-1">
                      {selectedSample.warnings.map((w, idx) => (
                        <p key={idx} className="text-[10.5px] text-amber-400 flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 mt-1">
                    <h4 className="font-bold text-xs text-slate-300 mb-1">Hiring Manager Feedback</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      "{selectedSample.recruiter}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenAuth('signup')}
                    className="mt-2 w-fit px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Unlock Full Optimization Tools <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-[#0b0f1d]/40 border-y border-[#121828]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center md:text-left flex flex-col">
              <span className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">{s.value}</span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Core Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Complete Suite to Bypass the Recruiter Filter</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Resora AI contains rule-based and AI-powered auditing systems to prepare your job application for technical, leadership, and startup filters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div 
                key={f.title} 
                className="glass-card p-6 border border-slate-800 bg-[#0f1525]/30 text-left transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Scoring Weights Model */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-[#121828]">
        <div className="glass-card p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center text-left relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-5%] w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="lg:w-1/2 flex flex-col">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">Explainable Analytics</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">Deterministic Scoring Math</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-md">
              We separate layout audits from text matching. Your final compatibility index uses local, mathematical rules with strict parameters — removing any black-box AI score variations.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded bg-[#050811]/45 border border-slate-800/60 text-[10.5px] font-mono text-slate-300">15% Parsing</span>
              <span className="px-2.5 py-1 rounded bg-[#050811]/45 border border-slate-800/60 text-[10.5px] font-mono text-slate-300">20% Keywords</span>
              <span className="px-2.5 py-1 rounded bg-[#050811]/45 border border-slate-800/60 text-[10.5px] font-mono text-slate-300">15% Formatting</span>
            </div>
          </div>
          <div className="lg:w-1/2 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "ATS Parsing Index", w: "15%", desc: "Validates contact headers & sections" },
              { label: "Keyword Matching", w: "20%", desc: "Checks Job Description skills match" },
              { label: "Formatting Scans", w: "15%", desc: "Checks tables, margins & column risks" },
              { label: "Achievements STAR", w: "20%", desc: "Counts bullet action metrics" },
              { label: "Readability Density", w: "10%", desc: "Ideal word count (400-800)" },
              { label: "Industry Alignment", w: "10%", desc: "Role specific keyword benchmark" },
            ].map(col => (
              <div key={col.label} className="p-3 bg-[#050811]/45 border border-slate-800/60 rounded-xl flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block mb-0.5">{col.label}</span>
                  <span className="text-[9.5px] text-slate-500 block leading-tight">{col.desc}</span>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-400 font-mono">{col.w}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bullet Point Optimizer Playground */}
      <section id="bullet-playground" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#121828]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">AI Bullet Point Optimizer</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Transform Weak Responsibility Bullets</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hiring managers scan resumes for impact metrics, not just task descriptions. Try our Google XYZ formula optimizer below to see how to rewrite your bullets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          {/* Playground Selector */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-card p-5 flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Choose a Weak Bullet Point</span>
                <div className="flex flex-col gap-2">
                  {SAMPLE_WEAK_BULLETS.map((bullet, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedWeakBullet(idx);
                        setPlaygroundBulletInput(bullet.original);
                        setShowBulletResult(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedWeakBullet === idx
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "bg-[#050811]/30 border-slate-800/40 hover:bg-[#050811]/60 hover:border-slate-700/60 text-slate-400 hover:text-slate-200 hover:translate-x-0.5"
                      }`}
                    >
                      <span className="text-xs">{bullet.original}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Or Write Your Own Custom Bullet</label>
                <textarea
                  value={playgroundBulletInput}
                  onChange={(e) => {
                    setPlaygroundBulletInput(e.target.value);
                    setSelectedWeakBullet(-1); // Deselect presets
                    setShowBulletResult(false);
                  }}
                  rows={3}
                  className="w-full bg-[#050811]/45 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 leading-relaxed placeholder-slate-600 font-sans"
                  placeholder="e.g. Worked on the backend of the platform..."
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setOptimizingBullet(true);
                  setShowBulletResult(false);
                  setTimeout(() => {
                    setOptimizingBullet(false);
                    setShowBulletResult(true);
                  }, 1200);
                }}
                disabled={optimizingBullet || !playgroundBulletInput.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {optimizingBullet ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalibrating Formats...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Optimize Bullet Point
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Playground Results */}
          <div className="lg:col-span-7 glass-card p-6 min-h-[320px] flex flex-col justify-center relative">
            {optimizingBullet && (
              <div className="flex flex-col items-center gap-3 py-10">
                <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300">Applying XYZ Formula...</p>
                  <p className="text-[10px] text-slate-500 mt-1">Quantifying outcomes and active verbs</p>
                </div>
              </div>
            )}

            {!optimizingBullet && !showBulletResult && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <Sparkles className="w-9 h-9 text-slate-700 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-400">Optimization Output Ready</h4>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Select a preset responsibility bullet or input your own, then click <b>Optimize Bullet Point</b> to see the revised high-impact statement.
                </p>
              </div>
            )}

            {!optimizingBullet && showBulletResult && (
              <div className="w-full flex flex-col gap-5 text-left animate-fade-in">
                {/* Original */}
                <div className="p-3 bg-[#050811]/45 border border-slate-800/40 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Before (Responsibility-focused)</span>
                  <p className="text-xs text-slate-400 italic">"{playgroundBulletInput}"</p>
                </div>

                {/* Optimized */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">After (Google XYZ Optimized)</span>
                  <p className="text-xs sm:text-[13px] font-bold text-slate-200 leading-relaxed">
                    "{selectedWeakBullet !== -1 
                      ? SAMPLE_WEAK_BULLETS[selectedWeakBullet].optimized 
                      : `Spearheaded the optimization of the system module, achieving a 28% increase in performance outcomes and saving 12+ developer hours weekly.`}"
                  </p>
                </div>

                {/* Explanation */}
                <div className="border-t border-slate-800/60 pt-4">
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">XYZ Formula Analysis</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedWeakBullet !== -1 
                      ? SAMPLE_WEAK_BULLETS[selectedWeakBullet].explanation 
                      : "Applied Google XYZ structure: Accomplished X (performance increase) as measured by Y (28% performance, 12+ hours saved) by doing Z (spearheading code optimizations)."}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="w-fit mt-1 px-4 py-2.5 bg-indigo-500 text-white font-bold text-[10.5px] hover:bg-indigo-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Get Started Free <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Plans Tiers */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#121828]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">SaaS Pricing</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Transparent Pricing Plans</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Get started for free or upgrade to Pro to unlock advanced AI-powered optimizers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto text-left">
          {/* Free Plan */}
          <div className="glass-card p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/50 transition-all duration-300 relative">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Free Plan</span>
                <Award className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">₹0</span>
                <span className="text-[10px] text-slate-500">/ forever</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-6 border-b border-slate-800/60 pb-3">
                Perfect for a single candidate checking format compliance.
              </p>
              <ul className="space-y-3 mb-8">
                {["1 Resume scan parsing check", "Deterministic ATS Score Breakdown", "Basic Formatting analysis checklist"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full py-2.5 rounded-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="glass-card border-indigo-500/30 bg-gradient-to-b from-indigo-950/15 via-[#0a0f1d]/60 to-[#070a13]/70 p-6 flex flex-col justify-between relative hover:scale-[1.01] hover:border-indigo-500/50 transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.06)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Recommended
            </span>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Pro Optimizer</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">₹299</span>
                <span className="text-[10px] text-slate-500">/ month</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-6 border-b border-slate-800/60 pb-3">
                Full AI optimization package for active job seekers targeting top-tier tech roles.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited resume scan versions",
                  "Full AI Recruiter feedback & rubrics",
                  "Advanced JD semantic match analysis",
                  "Unlimited XYZ formula bullet rewrites",
                  "STAR Interview behavioral prep sheets",
                  "LinkedIn Profile Audit tool"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Start Pro Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-card p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/50 transition-all duration-300 relative">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Enterprise</span>
                <Building className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">Custom</span>
                <span className="text-[10px] text-slate-500">/ annual</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-6 border-b border-slate-800/60 pb-3">
                For recruiting teams, universities, and technical bootcamps.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Custom recruiter evaluation criteria",
                  "Volume parsing scanning API",
                  "Dedicated user admin dashboards",
                  "24/7 Priority SLA support & training"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full py-2.5 rounded-xl border border-slate-700/50 hover:border-slate-500 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-[#121828] text-left">
        <div className="text-center mb-12">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-2">FAQ</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Common Questions</h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-800/80 bg-[#0c1222]/30 rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 flex justify-between items-center text-slate-200 hover:text-white font-semibold text-xs sm:text-sm cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3.5 bg-[#0a0e1c]/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Authentication Dialog Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 relative flex flex-col border border-indigo-500/20 shadow-2xl animate-scale-up text-left">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4.5 right-4.5 p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">
                {authMode === 'login' ? 'Sign In to Resora AI' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-500">
                {authMode === 'login' 
                  ? 'Access your resume scans and history' 
                  : 'Start scoring and parsing your resume with AI'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex bg-[#0f1525]/60 border border-[#1e2740] rounded-xl p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(""); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(""); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#050811]/45 border border-slate-800/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all leading-relaxed placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050811]/45 border border-slate-800/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all leading-relaxed placeholder-slate-600"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#050811]/45 border border-slate-800/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all leading-relaxed placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/15 text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {loading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authenticating...</>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Social logins */}
            <div className="mt-5 text-center">
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/60"></div>
                </div>
                <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-[#070a13] rounded-lg">
                  Or continue with
                </span>
              </div>

              <div className="relative w-full min-h-[44px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                {/* Custom-styled visible Google button */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center gap-2.5 border border-slate-800/60 bg-[#050811]/30 hover:bg-[#050811]/60 hover:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all duration-200 pointer-events-none">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google
                </div>

                {googleClientId ? (
                  /* Invisible native Google button overlaid on top */
                  <div 
                    id="google-signin-btn-container" 
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:opacity-0 [&_iframe]:cursor-pointer"
                  ></div>
                ) : (
                  /* Trigger unconfigured warning popup */
                  <button 
                    type="button"
                    onClick={() => onAlert("Google Sign-In Client ID not configured. Please set GOOGLE_CLIENT_ID in your backend .env file to enable Google login.")}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    aria-label="Google Sign-In (Demo)"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-[#121828] text-center text-xs text-slate-600 relative z-10">
        <p>© 2026 Resora AI. Professional explainable resume analytics platform.</p>
      </footer>
    </div>
  );
}
