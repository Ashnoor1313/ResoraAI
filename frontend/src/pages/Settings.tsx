import React, { useState, useEffect } from 'react';
import { 
  User, 
  Sliders, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  Monitor, 
  Smartphone, 
  Trash2, 
  Clock, 
  KeyRound,
  Fingerprint,
  CreditCard,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import Plans from './Plans';
import { useTheme } from '../context/ThemeContext';

interface SettingsProps {
  backendUrl: string;
  isMockMode: boolean;
  onSaveApiKey: (key: string) => void;
  savedApiKey: string;
  token?: string;
  onLogout?: () => void;
  onAlert?: (msg: string) => void;
}

export default function Settings({ 
  backendUrl, 
  isMockMode, 
  onSaveApiKey, 
  savedApiKey,
  token,
  onLogout,
  onAlert
}: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'plans' | 'danger'>('profile');

  useEffect(() => {
    const handleOpenSubtab = (e: any) => {
      if (e.detail && ['profile', 'security', 'plans', 'danger'].includes(e.detail)) {
        setActiveSubTab(e.detail);
      }
    };
    window.addEventListener('resumeiq:open_settings_subtab', handleOpenSubtab);
    return () => window.removeEventListener('resumeiq:open_settings_subtab', handleOpenSubtab);
  }, []);

  
  // Profile settings state
  const [careerLevel, setCareerLevel] = useState("entry");
  const [targetIndustry, setTargetIndustry] = useState("tech");
  const [priorities, setPriorities] = useState({
    ats: true,
    keywords: true,
    star: true,
    readability: false
  });

  // Security/Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Save/Progress states
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  
  // Messages states
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!token || token === "mock-token" || token === "undefined") {
      return; // Skip server fetch in mock mode
    }

    // Fetch user profile settings
    fetch(`${backendUrl}/api/v1/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        setCareerLevel(data.career_level);
        setTargetIndustry(data.target_industry);
        if (data.priorities) {
          setPriorities(data.priorities);
        }
        if (data.plan) {
          localStorage.setItem("resumeiq_plan", data.plan);
          window.dispatchEvent(new CustomEvent("resumeiq:plan_changed", { detail: data.plan }));
        }
      })
      .catch(err => {
        console.error("Failed to load user settings", err);
      });

    // Fetch user active login sessions
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    if (!token || token === "mock-token" || token === "undefined") return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handlePriorityToggle = (key: keyof typeof priorities) => {
    setPriorities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);

    if (!token || token === "mock-token" || token === "undefined") {
      // Local/mock save behavior
      setTimeout(() => {
        setProfileSaving(false);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2000);
      }, 400);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          career_level: careerLevel,
          target_industry: targetIndustry,
          priorities
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update profile.");
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile settings.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      setPasswordSaving(false);
      return;
    }

    if (!token || token === "mock-token" || token === "undefined") {
      setPasswordError("Password modification is not supported in mock mode.");
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to change password. Double check current password.");
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchSessions(); // refresh active sessions since other ones were invalidated
    } catch (err: any) {
      setPasswordError(err.message || "An error occurred updating password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!token || token === "mock-token" || token === "undefined") return;

    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      }
    } catch (err) {
      console.error("Revoke error", err);
    }
  };

  const handleLogoutOthers = async () => {
    if (!token || token === "mock-token" || token === "undefined") return;

    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me/sessions/logout-others`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.is_current));
      }
    } catch (err) {
      console.error("Logout others error", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.toLowerCase() !== "delete") return;

    if (!token || token === "mock-token" || token === "undefined") {
      if (onLogout) onLogout();
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/users/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (onLogout) onLogout();
      }
    } catch (err) {
      console.error("Delete account error", err);
    }
  };

  const parseUA = (uaString: string) => {
    if (!uaString) return { browser: "Browser Client", os: "Unknown OS" };
    let browser = "Web Client";
    let os = "Desktop";

    if (uaString.includes("Firefox")) browser = "Mozilla Firefox";
    else if (uaString.includes("Chrome")) browser = "Google Chrome";
    else if (uaString.includes("Safari")) browser = "Apple Safari";
    else if (uaString.includes("Edge")) browser = "Microsoft Edge";
    else if (uaString.includes("Postman")) browser = "Postman API Client";

    if (uaString.includes("Windows")) os = "Windows";
    else if (uaString.includes("Macintosh") || uaString.includes("Mac OS")) os = "macOS";
    else if (uaString.includes("Linux")) os = "Linux";
    else if (uaString.includes("Android")) os = "Android";
    else if (uaString.includes("iPhone") || uaString.includes("iPad")) os = "iOS";

    return { browser, os };
  };

  const priorityItems = [
    { key: 'ats' as const, title: "ATS Layout", desc: "Check for columns, fonts & formatting risks." },
    { key: 'keywords' as const, title: "Keyword Matching", desc: "Verify synonym variations and abbreviations." },
    { key: 'star' as const, title: "XYZ/STAR Format", desc: "Strict verification of quantified metrics." },
    { key: 'readability' as const, title: "Readability", desc: "Text density and word count limits." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left animate-fade-in">
      
      {/* Sub navigation sidebar */}
      <div className="lg:col-span-3 glass-card p-5 flex flex-col justify-between h-full">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
              activeSubTab === 'profile' 
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold' 
                : 'text-slate-400 hover:bg-[#0f1525]/50 border border-transparent hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Profile & Preferences
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
              activeSubTab === 'security' 
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold' 
                : 'text-slate-400 hover:bg-[#0f1525]/50 border border-transparent hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            Security & Sessions
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('plans')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
              activeSubTab === 'plans' 
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold' 
                : 'text-slate-400 hover:bg-[#0f1525]/50 border border-transparent hover:text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            Billing & Plans
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('danger')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
              activeSubTab === 'danger' 
                ? 'bg-red-500/10 border border-red-500/20 text-red-400 font-bold' 
                : 'text-slate-400 hover:bg-[#0f1525]/50 border border-transparent hover:text-red-400'
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            Danger Zone
          </button>
        </div>

        {/* Status details docked at the bottom of the card */}
        <div className="border-t border-[#1e2740]/60 pt-5 mt-6 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <span>Status details</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1e2740]/40">
            <span className="text-slate-500">Local Cache</span>
            <span className="text-emerald-400 font-medium">Synced</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1e2740]/40">
            <span className="text-slate-500">Security Check</span>
            <span className="text-indigo-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Secure
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Tabs Area */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            {/* Career Profile */}
            <div className="glass-card p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                <User className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-200">Career Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Career Level</label>
                  <select
                    value={careerLevel}
                    onChange={(e) => setCareerLevel(e.target.value)}
                    className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="student">Student / Intern</option>
                    <option value="entry">Entry-level (0-2 yrs)</option>
                    <option value="mid">Mid-career (2-5 yrs)</option>
                    <option value="senior">Senior (5+ yrs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Industry</label>
                  <select
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="tech">Software Engineering</option>
                    <option value="data">Data Science</option>
                    <option value="product">Product Management</option>
                    <option value="business">Marketing & Business</option>
                    <option value="hr">Human Resources</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance & Theme */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2740]">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-sm text-slate-200">Appearance & Theme</h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Active: <strong className="text-indigo-400 capitalize">{theme} Mode</strong>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Choose between Day (Light) and Night (Dark) visual themes. Your preference is synchronized across all screens and remembered on this device.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                {/* Day Theme Option */}
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 relative select-none ${
                    theme === 'light'
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-[#0f1525]/40 border-[#1e2740] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Day Mode</span>
                        <span className="text-[10px] text-slate-500 block">Crisp, clean & luminous</span>
                      </div>
                    </div>
                    {theme === 'light' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <div className="h-10 rounded-lg bg-slate-100 border border-slate-200 p-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500" />
                    <div className="h-2 w-16 bg-slate-300 rounded" />
                    <div className="h-2 w-8 bg-slate-200 rounded ml-auto" />
                  </div>
                </div>

                {/* Night Theme Option */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 relative select-none ${
                    theme === 'dark'
                      ? 'bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'bg-[#0f1525]/40 border-[#1e2740] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Night Mode</span>
                        <span className="text-[10px] text-slate-500 block">Midnight dark with neon glow</span>
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                  <div className="h-10 rounded-lg bg-[#080d1a] border border-[#1e2740] p-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-indigo-500" />
                    <div className="h-2 w-16 bg-slate-700 rounded" />
                    <div className="h-2 w-8 bg-slate-800 rounded ml-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Focus */}
            <div className="glass-card p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-200">Analysis Focus</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {priorityItems.map((item) => (
                  <label key={item.key} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0f1525]/40 border border-[#1e2740] cursor-pointer select-none hover:bg-[#0f1525]/70 hover:border-indigo-500/35 transition-all">
                    <input
                      type="checkbox"
                      checked={priorities[item.key]}
                      onChange={() => handlePriorityToggle(item.key)}
                      className="rounded border-[#1e2740] text-indigo-500 focus:ring-0 bg-[#0B1020]"
                    />
                    <div>
                      <span className="text-xs text-slate-300 font-medium block">{item.title}</span>
                      <span className="text-[10px] text-slate-600 mt-0.5 block leading-normal">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {profileSuccess && (
                  <div className="px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-center gap-2 w-fit animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile settings successfully saved.
                  </div>
                )}
                {profileError && (
                  <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl flex items-center gap-2 w-fit animate-fade-in">
                    <AlertTriangle className="w-4 h-4" />
                    {profileError}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/15 cursor-pointer"
              >
                {profileSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'security' && (
          <div className="flex flex-col gap-6">
            
            {/* Password Change Form */}
            {!isMockMode ? (
              <form onSubmit={handleUpdatePassword} className="glass-card p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1e2740]">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-sm text-slate-200">Change Password</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f1525] border border-[#1e2740] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="flex-1">
                    {passwordSuccess && (
                      <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-center gap-2 w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        Password changed. All other devices have been logged out.
                      </div>
                    )}
                    {passwordError && (
                      <div className="px-3.5 py-2 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl flex items-center gap-2 w-fit">
                        <AlertTriangle className="w-4 h-4" />
                        {passwordError}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {passwordSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="glass-card p-6 text-left flex items-start gap-3 border border-amber-500/10 bg-amber-500/5">
                <Fingerprint className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-slate-200">Local Authentication</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    You are in mock mode. Password modifications and session tracking are available only for registered accounts.
                  </p>
                </div>
              </div>
            )}

            {/* Session Management Table */}
            {!isMockMode && (
              <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#1e2740]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-sm text-slate-200">Active Login Sessions</h3>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleLogoutOthers}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    >
                      Sign Out of Other Devices
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {loadingSessions ? (
                    <div className="flex justify-center py-6">
                      <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">No active sessions found.</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((s) => {
                        const parsed = parseUA(s.user_agent);
                        return (
                          <div 
                            key={s.session_id} 
                            className={`flex items-center justify-between p-3.5 rounded-xl border ${
                              s.is_current 
                                ? 'bg-indigo-500/[0.03] border-indigo-500/20' 
                                : 'bg-[#0f1525]/30 border-[#1e2740]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="p-2.5 rounded-lg bg-[#0f1525] border border-[#1e2740]/60 text-slate-400">
                                {s.user_agent?.toLowerCase().includes("mobi") ? (
                                  <Smartphone className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <Monitor className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-200">
                                    {parsed.browser} on {parsed.os}
                                  </span>
                                  {s.is_current && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-wider">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                                  <span>{s.ip_address}</span>
                                  <span>•</span>
                                  <span>Logged in: {new Date(s.login_time).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {!s.is_current && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(s.session_id)}
                                className="px-2.5 py-1.5 bg-[#0f1525] text-slate-500 hover:text-red-400 border border-[#1e2740] hover:border-red-500/20 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'plans' && (
          <div className="animate-fade-in">
            <Plans 
              token={token || 'mock-token'} 
              backendUrl={backendUrl}
              onAlert={onAlert || ((msg) => alert(msg))} 
            />
          </div>
        )}

        {activeSubTab === 'danger' && (

          <div className="glass-card p-6 flex flex-col gap-5 border border-red-500/20 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-red-500/15">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-sm text-red-400">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-xs text-slate-200">Delete User Account</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Deleting your account will permanently purge your profile, saved credentials, and all {isMockMode ? 'simulated' : ''} resumes/reports from the SQLite database. This action is absolute and cannot be undone.
                </p>
              </div>

              <div className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Type <span className="text-red-400">"DELETE"</span> to confirm
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="bg-[#0f1525] border border-red-500/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-slate-200 max-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteConfirm.toLowerCase() === "delete") {
                        setShowDeleteModal(true);
                      }
                    }}
                    disabled={deleteConfirm.toLowerCase() !== "delete"}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      deleteConfirm.toLowerCase() === "delete"
                        ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                        : 'bg-slate-100 dark:bg-[#1e2740] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-transparent cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-card p-6 relative flex flex-col border border-red-500/30 shadow-2xl animate-scale-up text-left">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Permanently Delete Account?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              You are about to permanently purge your account and all associated documents. Are you absolutely certain you want to proceed?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0f1525] border border-[#1e2740] text-slate-400 text-xs font-semibold hover:text-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all cursor-pointer"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
