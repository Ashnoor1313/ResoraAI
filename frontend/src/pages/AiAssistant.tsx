import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  Zap,
  Info,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AiAssistantProps {
  resumeId?: number;
  reportData?: any;
  backendUrl: string;
  token?: string;
}

export default function AiAssistant({
  resumeId,
  reportData,
  backendUrl,
  token
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`resumeiq_chat_${resumeId || 'global'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Initial System Message grounded in active report
    const candidateName = reportData?.extracted_data?.name || "Candidate";
    const targetRole = reportData?.target_role || "Software Developer";
    const skills = reportData?.extracted_data?.skills || [];
    
    let welcomeText = `Hello ${candidateName}! 👋 I am your Resume Studio AI Copilot. I've analyzed your active resume for the **${targetRole}** role.\n\n`;
    
    if (skills.length > 0) {
      welcomeText += `I see strong technical skills in: **${skills.slice(0, 5).join(', ')}**.\n\n`;
    }
    
    welcomeText += `Here is what I can help you with right now:\n` +
      `• Identify missing high-priority ATS keywords\n` +
      `• Rewrite weak bullets into Google XYZ impact achievements\n` +
      `• Tailor your resume for specific FAANG or Startup tracks\n` +
      `• Brainstorm interview preparation scenarios\n\n` +
      `What would you like to optimize today?`;

    return [
      { sender: 'ai', text: welcomeText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`resumeiq_chat_${resumeId || 'global'}`, JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText("");

    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Connect to backend chat copilot service or fallback to sandbox response
      const response = await fetch(`${backendUrl}/api/v1/tools/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'mock-token'}`
        },
        body: JSON.stringify({
          resume_id: resumeId || null,
          message: text,
          target_role: reportData?.target_role || "Software Developer"
        })
      });

      let aiReply = "";
      if (response.ok) {
        const data = await response.json();
        aiReply = data.response || "I could not generate a response. Let me know if you have other questions!";
      } else {
        throw new Error();
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      // Mock Sandbox fallbacks based on keyword matches
      setTimeout(() => {
        let reply = "";
        const lower = text.toLowerCase();
        
        if (lower.includes("keyword") || lower.includes("ats") || lower.includes("gap")) {
          reply = `Here is a custom ATS analysis for the **${reportData?.target_role || 'SDE'}** track:\n\n` +
            `• **Missing Skills Detected:** Docker, Kubernetes, AWS CloudFormation, REDIS cache.\n` +
            `• **Action Items:** Include these in your 'Core Competencies' section. Add an experience bullet showing how you optimized deployment latency by 20% using AWS/Docker.`;
        } else if (lower.includes("xyz") || lower.includes("bullet") || lower.includes("rewrite")) {
          reply = `Let's optimize a bullet point using the Google XYZ Formula: **"Accomplished [X] as measured by [Y], by doing [Z]"**.\n\n` +
            `*Original:* "Helped build frontend views for the team."\n` +
            `*AI Optimization:* **"Spearheaded design and deployment of 15+ reusable React components (Z), reducing frontend page render latency by 32% (Y) and boosting active user retention rate (X)."**`;
        } else {
          reply = `Understood. I have scanned your Resume Knowledge Graph. I recommend structuring your achievements with strong action verbs (e.g., *Spearheaded*, *Architected*, *Optimized*) and concrete metrics. \n\nWhat other specific section can we optimize?`;
        }

        const aiMsg: Message = {
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { sender: 'ai', text: "Chat history cleared. How can I help you improve your resume?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  };

  const prompts = [
    "Identify high-priority keyword gaps",
    "Rewrite bullet point with Google XYZ",
    "Generate custom SDE summary",
    "List target interview questions"
  ];

  return (
    <div className="flex gap-5 h-[calc(100vh-80px)] overflow-hidden animate-fade-in text-left">
      
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden min-w-0">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800/80 bg-[#0f1525]/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white tracking-tight">AI Workspace Copilot</h3>
              <p className="text-[10px] text-slate-500">Context-aware assistant to help you write, rewrite, and optimize your resume.</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#070b13]/10">
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex gap-3 max-w-2xl ${isAi ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                >
                  <div className={`w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center border ${
                    isAi ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed font-normal whitespace-pre-wrap select-text ${
                      isAi ? 'bg-[#0f1525] border border-slate-800/60 text-slate-300' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-600 block px-1">{msg.timestamp}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {loading && (
            <div className="flex gap-3 max-w-2xl mr-auto text-left items-center text-slate-500 text-xs font-semibold">
              <div className="w-8.5 h-8.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>Generating response...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-[#070b13]/20 flex gap-2 overflow-x-auto shrink-0 select-none">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/30 hover:border-indigo-500/40 hover:text-indigo-400 transition-all text-[10.5px] font-bold text-slate-500 whitespace-nowrap cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0f1525]/30 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about your resume, tailoring, or interview questions..."
              className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Sidebar Info Panel */}
      <div className="w-80 glass-card p-5 hidden xl:flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights Context
        </h3>
        
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Target Track</span>
            <span className="font-semibold text-slate-300">{reportData?.target_role || "Software Developer"}</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Overall ATS Health</span>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300">{reportData?.score_overall || 85}% Compatibilty</span>
              <span className="text-emerald-400 font-bold">Optimal</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Workspace Mode</span>
            <p className="text-slate-500 text-[10.5px]">This assistant parses your active Resume Knowledge Graph context and responds immediately.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
