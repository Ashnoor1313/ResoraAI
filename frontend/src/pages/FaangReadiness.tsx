import React from 'react';

interface FaangReadinessProps {
  faangData: {
    google: number;
    amazon: number;
    meta: number;
    microsoft: number;
    breakdown: {
      google_criteria: { impact: number; scale: number; complexity: number };
      amazon_criteria: { ownership: number; metrics: number; results: number };
      meta_criteria: { product_thinking: number; execution: number };
      microsoft_criteria: { collaboration: number; engineering_depth: number };
    };
  };
}

export default function FaangReadiness({ faangData }: FaangReadinessProps) {
  const { google, amazon, meta, microsoft, breakdown } = faangData;

  const companies = [
    {
      name: "Google",
      score: google,
      accent: "text-blue-400",
      barColor: "bg-blue-500",
      desc: "Impact, scale, and algorithmic complexity.",
      criteria: [
        { name: "Complexity", val: breakdown?.google_criteria?.complexity || 70 },
        { name: "Scale", val: breakdown?.google_criteria?.scale || 65 },
        { name: "Impact", val: breakdown?.google_criteria?.impact || 75 }
      ]
    },
    {
      name: "Amazon",
      score: amazon,
      accent: "text-orange-400",
      barColor: "bg-orange-500",
      desc: "Ownership, metrics, and results delivery.",
      criteria: [
        { name: "Ownership", val: breakdown?.amazon_criteria?.ownership || 75 },
        { name: "Metrics", val: breakdown?.amazon_criteria?.metrics || 60 },
        { name: "Results", val: breakdown?.amazon_criteria?.results || 72 }
      ]
    },
    {
      name: "Meta",
      score: meta,
      accent: "text-teal-400",
      barColor: "bg-teal-500",
      desc: "Product thinking and execution speed.",
      criteria: [
        { name: "Product", val: breakdown?.meta_criteria?.product_thinking || 68 },
        { name: "Execution", val: breakdown?.meta_criteria?.execution || 78 }
      ]
    },
    {
      name: "Microsoft",
      score: microsoft,
      accent: "text-green-400",
      barColor: "bg-green-500",
      desc: "Engineering depth and collaboration.",
      criteria: [
        { name: "Engineering", val: breakdown?.microsoft_criteria?.engineering_depth || 72 },
        { name: "Collaboration", val: breakdown?.microsoft_criteria?.collaboration || 80 }
      ]
    }
  ];

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: 'Strong', color: 'text-emerald-400' };
    if (score >= 60) return { text: 'Competitive', color: 'text-amber-400' };
    return { text: 'Needs Work', color: 'text-red-400' };
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header */}
      <div className="glass-card p-5">
        <h3 className="font-medium text-sm text-slate-300 mb-1">FAANG Readiness</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Each company evaluates candidates against different criteria. See how your resume scores across their hiring rubrics.
        </p>
      </div>

      {/* Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {companies.map((comp) => {
          const label = getScoreLabel(comp.score);
          return (
            <div key={comp.name} className="glass-card p-5 flex flex-col justify-between">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md bg-[#0f1525] border border-[#1e2740] flex items-center justify-center font-bold text-xs ${comp.accent}`}>
                    {comp.name[0]}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200">{comp.name}</h4>
                </div>
                <span className="text-2xl font-bold text-white">{comp.score}</span>
              </div>

              <p className="text-[11px] text-slate-500 mb-4">{comp.desc}</p>

              {/* Criteria Bars */}
              <div className="space-y-3">
                {comp.criteria.map((crit) => (
                  <div key={crit.name}>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-500">{crit.name}</span>
                      <span className="text-slate-300 font-medium">{crit.val}</span>
                    </div>
                    <div className="w-full h-1 bg-[#1e2740] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${comp.barColor}`} 
                        style={{ width: `${crit.val}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="mt-4 pt-3 border-t border-[#1e2740] flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Status</span>
                <span className={`font-medium ${label.color}`}>{label.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
