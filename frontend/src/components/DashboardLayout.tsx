import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Target, 
  Building, 
  Briefcase, 
  History, 
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  Menu,
  FileCheck,
  Mail,
  UserCheck,
  CreditCard,
  GitPullRequest,
  Sparkles,
  GitBranch,
  Globe,
  ClipboardList,
  MessageSquare
} from 'lucide-react';

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
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

interface DashboardLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  userEmail?: string;
  onLogout: () => void;
}

export default function DashboardLayout({ 
  currentTab, 
  onTabChange, 
  children, 
  userEmail = "candidate@resumeiq.ai",
  onLogout
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'resumes', name: 'My Resumes', icon: History },
    { id: 'ats', name: 'Resume Analyzer', icon: FileText },
    { id: 'career', name: 'AI Career Suite', icon: Briefcase },
    { id: 'applications', name: 'Applications', icon: ClipboardList },
    { id: 'settings', name: 'Settings & Plans', icon: SettingsIcon },
  ];


  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      
      {/* Sidebar — Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-[#0f172a]/70 backdrop-blur-xl border-r border-slate-800/50 transition-all duration-300 relative ${
          sidebarCollapsed ? 'w-[68px]' : 'w-56'
        }`}
      >
        {/* Toggle Button floating on border */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full border border-slate-800 bg-[#0c1222] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shadow-md z-50 transition-transform hover:scale-110"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-slate-800/50 ${
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <polyline points="9 15 11 17 15 13" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-sm bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                Resora AI
              </span>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center rounded-xl transition-all duration-200 text-[13px] font-semibold relative group border ${
                  sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start px-3 py-2.5 gap-3'
                } ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 text-indigo-400 border-indigo-500/20 shadow-md shadow-indigo-500/5' 
                    : 'text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#0f1525] border border-slate-800/60 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl whitespace-nowrap text-slate-300">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-2.5 border-t border-slate-800/50">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium truncate text-slate-400">{userEmail}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500"
                title="Back to Home"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
              title="Back to Home"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside className="w-56 h-full bg-[#080d19] border-r border-slate-800/50 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-14 flex items-center px-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <polyline points="9 15 11 17 15 13" />
                  </svg>
                </div>
                <span className="font-extrabold text-sm bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Resora AI</span>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold border ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 text-indigo-400 border-indigo-500/20' 
                        : 'text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar — minimal */}
        <header className="h-14 border-b border-slate-800/50 bg-[#060913]/70 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md border border-slate-800/60 text-slate-400 md:hidden hover:text-white transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              {menuItems.find(item => item.id === currentTab)?.name || "Resora AI"}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto w-full pb-10 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
