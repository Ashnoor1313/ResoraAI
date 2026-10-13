import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'switch';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border cursor-pointer select-none ${
          isDark
            ? 'bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm shadow-indigo-500/10'
            : 'bg-white hover:bg-slate-50 text-amber-600 border-amber-300 hover:border-amber-400 shadow-sm shadow-amber-500/10'
        } ${className}`}
      >
        <span className="relative flex items-center justify-center w-4 h-4">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400 transition-transform duration-300 rotate-0" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-300 rotate-0" />
          )}
        </span>
        <span className="tracking-wide">{isDark ? 'Night' : 'Day'}</span>
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div 
        className={`inline-flex items-center p-1 rounded-xl border transition-all duration-300 ${
          isDark 
            ? 'bg-[#080d1a] border-[#1e2740]' 
            : 'bg-slate-100 border-slate-200'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            !isDark 
              ? 'bg-white text-amber-600 shadow-sm shadow-slate-200/80 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Day</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isDark 
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Night</span>
        </button>
      </div>
    );
  }

  // Default: 'icon'
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Switch to Day Theme" : "Switch to Night Theme"}
      title={isDark ? "Switch to Day Theme (Light)" : "Switch to Night Theme (Dark)"}
      className={`relative p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center group ${
        isDark
          ? 'bg-[#0b1020]/80 hover:bg-[#131b33] text-indigo-300 border-slate-700/60 hover:border-indigo-500/40 shadow-sm hover:shadow-indigo-500/10'
          : 'bg-white/90 hover:bg-slate-50 text-amber-500 border-slate-200 hover:border-amber-300 shadow-sm shadow-slate-200/60'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-all duration-300 transform group-hover:-rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-600 transition-all duration-300 transform group-hover:rotate-45" />
        )}
      </div>
    </button>
  );
}
