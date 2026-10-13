import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Edit3, 
  Check, 
  RotateCcw, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

export interface ReconstructionSuggestion {
  block_id: string;
  original: string;
  suggested: string;
  type?: string;
  explanation?: string;
}

export interface ValidationReport {
  is_valid: boolean;
  warnings: string[];
  overlaps: any[];
  total_pages: number;
}

export interface ResumeRebuilderProps {
  resumeId: number;
  targetRole?: string;
  filename?: string;
  backendUrl: string;
  token?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function ResumeRebuilder({
  resumeId,
  targetRole = 'Software Engineer',
  filename = 'resume.pdf',
  backendUrl,
  token,
  onClose,
  isModal = false
}: ResumeRebuilderProps) {
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [rdom, setRdom] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<ReconstructionSuggestion[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  
  // Selection state: block_id -> boolean
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  
  // Custom edited text per block_id (if candidate tweaked the suggestion)
  const [editedSuggestions, setEditedSuggestions] = useState<Record<string, string>>({});
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Compiled PDF URL state for preview and re-download
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);
  const [compiledFilename, setCompiledFilename] = useState<string>('reconstructed_resume.pdf');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // Fetch Reconstruction data
  const fetchReconstruction = async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeader = token && token !== 'undefined' ? `Bearer ${token}` : 'Bearer mock-token';
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/reconstruction`, {
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Failed to fetch reconstruction layout (status ${response.status})`);
      }

      const data = await response.json();
      setRdom(data.rdom || null);
      const fetchedSuggestions: ReconstructionSuggestion[] = data.suggestions || [];
      setSuggestions(fetchedSuggestions);
      setValidationReport(data.validation_report || null);

      // Pre-select all suggestions by default for a seamless 1-click experience
      const initialSelected = new Set<string>();
      fetchedSuggestions.forEach(s => {
        if (s.block_id && s.suggested && s.suggested.trim() !== s.original.trim()) {
          initialSelected.add(s.block_id);
        }
      });
      setSelectedBlockIds(initialSelected);
    } catch (err: any) {
      console.error('Reconstruction error:', err);
      setError(err.message || 'Error communicating with reconstruction engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchReconstruction();
    }
    return () => {
      // Clean up object URL when component unmounts
      if (compiledPdfUrl) {
        URL.revokeObjectURL(compiledPdfUrl);
      }
    };
  }, [resumeId]);

  // Section categorization helper
  const getSectionForBlock = (blockId: string): string => {
    if (!rdom || !rdom.pages) return 'Experience';
    for (const page of rdom.pages) {
      for (const block of page.blocks || []) {
        if (block.id === blockId) {
          const sec = (block.section_type || '').replace('header_', '').toLowerCase();
          if (sec.includes('exp')) return 'Experience';
          if (sec.includes('proj')) return 'Projects';
          if (sec.includes('edu')) return 'Education';
          if (sec.includes('skill')) return 'Skills';
          if (sec.includes('sum') || sec.includes('obj')) return 'Summary';
          return 'Content';
        }
      }
    }
    return 'Experience';
  };

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (activeFilter === 'all') return suggestions;
    return suggestions.filter(s => getSectionForBlock(s.block_id).toLowerCase() === activeFilter.toLowerCase());
  }, [suggestions, activeFilter, rdom]);

  // Toggle selection
  const toggleSelect = (blockId: string) => {
    setSelectedBlockIds(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(suggestions.map(s => s.block_id));
    setSelectedBlockIds(all);
  };

  const deselectAll = () => {
    setSelectedBlockIds(new Set());
  };

  // Compile and Download PDF
  const handleCompileAndDownload = async () => {
    setCompiling(true);
    setError(null);
    setDownloadSuccessToast(false);

    try {
      // Build approved changes dictionary { block_id: text }
      const approved_changes: Record<string, string> = {};
      suggestions.forEach(s => {
        if (selectedBlockIds.has(s.block_id)) {
          // Use edited text if modified by user, otherwise standard suggested text
          approved_changes[s.block_id] = editedSuggestions[s.block_id] || s.suggested;
        }
      });

      const authHeader = token && token !== 'undefined' ? `Bearer ${token}` : 'Bearer mock-token';
      const response = await fetch(`${backendUrl}/api/v1/resumes/${resumeId}/rebuild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ approved_changes })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Compilation failed with status ${response.status}`);
      }

      // Extract filename from Content-Disposition header if available
      let downloadName = `reconstructed_${filename.replace(/\.[^/.]+$/, '')}.pdf`;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          downloadName = matches[1].replace(/['"]/g, '');
        }
      }
      setCompiledFilename(downloadName);

      // Convert response stream to Blob
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(pdfBlob);

      // Clean up previous blob if any
      if (compiledPdfUrl) {
        URL.revokeObjectURL(compiledPdfUrl);
      }
      setCompiledPdfUrl(objectUrl);

      // Trigger automatic browser file download
      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = downloadName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 8000);
    } catch (err: any) {
      console.error('Rebuild compile error:', err);
      setError(err.message || 'Failed to compile reconstructed PDF.');
    } finally {
      setCompiling(false);
    }
  };

  const estimatedScoreBoost = Math.min(22, Math.max(8, selectedBlockIds.size * 4));

  return (
    <div className={`flex flex-col gap-6 text-left animate-fade-in ${isModal ? 'p-6 max-h-[90vh] overflow-y-auto' : ''}`}>
      {/* Top Banner & Header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                RDOM Layout Reflow Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                PyMuPDF Vector Overlay
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              Interactive Resume Rebuilder
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Select verified ATS bullet enhancements and layout refactorings. The RDOM engine recalculates precise typography bounding boxes, adjusts line wraps, and renders an exact vector PDF download.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCompileAndDownload}
              disabled={compiling || loading || selectedBlockIds.size === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                compiling || loading || selectedBlockIds.size === 0
                  ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-indigo-500/25 active:scale-95'
              }`}
            >
              {compiling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Reflowing & Compiling PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>Compile & Download PDF ({selectedBlockIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Engine Quality Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090e1a]/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Target Track</span>
            <span className="text-xs font-bold text-slate-800 dark:text-white truncate block">{targetRole}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090e1a]/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Geometry Safety</span>
            <span className={`text-xs font-bold flex items-center gap-1 ${
              validationReport?.is_valid !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validationReport?.overlaps?.length || 0} Overlaps Detected
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090e1a]/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Active Modifications</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {selectedBlockIds.size} of {suggestions.length} Approved
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090e1a]/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Estimated ATS Boost</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
              +{estimatedScoreBoost}% ATS Impact
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-200">Rebuilt PDF Downloaded Successfully!</p>
              <p className="text-[11px] text-slate-400">
                Saved as <strong className="text-white font-mono">{compiledFilename}</strong>. Layout reflow and font metrics verified.
              </p>
            </div>
          </div>
          {compiledPdfUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#1e2740] hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Preview In-App
              </button>
              <a
                href={compiledPdfUrl}
                download={compiledFilename}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                Re-Download
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReconstruction}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[11px] font-bold text-rose-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Analyzing Document Geometry & RDOM Layout...</p>
          <p className="text-[11px] text-slate-500">Mapping bounding boxes, line spans, and generating ATS rewrites</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-3 text-slate-400">
          <ShieldCheck className="w-10 h-10 text-emerald-400/60" />
          <h3 className="text-sm font-bold text-white">Document Layout is Already High-Scoring</h3>
          <p className="text-xs text-slate-400 max-w-md">
            No weak bullet points or syntax clipping detected in this resume layout. You can still compile a clean standardized PDF.
          </p>
          <button
            onClick={handleCompileAndDownload}
            disabled={compiling}
            className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Compile & Export Clean PDF
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Controls Bar: Section Filters + Bulk Actions */}
          <div className="glass-card p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase mr-1">Section:</span>
              {['all', 'experience', 'projects', 'summary'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveFilter(sec)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    activeFilter === sec
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Bulk select buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
              >
                Approve All ({suggestions.length})
              </button>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <button
                onClick={deselectAll}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="flex flex-col gap-3">
            {filteredSuggestions.map((suggestion) => {
              const isSelected = selectedBlockIds.has(suggestion.block_id);
              const sectionName = getSectionForBlock(suggestion.block_id);
              const isEditingThis = editingBlockId === suggestion.block_id;
              const currentText = editedSuggestions[suggestion.block_id] || suggestion.suggested;

              return (
                <div
                  key={suggestion.block_id}
                  className={`glass-card p-5 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-[#0f172a]/70 shadow-lg shadow-indigo-500/5'
                      : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090e1a]/50 opacity-90 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(suggestion.block_id)}
                        className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                        id={`check-${suggestion.block_id}`}
                      />
                      <label
                        htmlFor={`check-${suggestion.block_id}`}
                        className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center gap-2"
                      >
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          {sectionName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {suggestion.block_id}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved for Reflow
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                          Ignored
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diff View Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Original weak text */}
                    <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                            Current In Resume
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                          {suggestion.original}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-rose-500/10 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        <span>Generic phrasing or unquantified impact detected</span>
                      </div>
                    </div>

                    {/* ATS Optimized Rewrite */}
                    <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/5 border-emerald-500/25 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            ATS-Optimized Rebuild
                          </span>
                          {!isEditingThis && (
                            <button
                              onClick={() => {
                                setEditingBlockId(suggestion.block_id);
                                if (!editedSuggestions[suggestion.block_id]) {
                                  setEditedSuggestions(prev => ({ ...prev, [suggestion.block_id]: suggestion.suggested }));
                                }
                              }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit Text
                            </button>
                          )}
                        </div>

                        {isEditingThis ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={currentText}
                              onChange={(e) => setEditedSuggestions(prev => ({
                                ...prev,
                                [suggestion.block_id]: e.target.value
                              }))}
                              rows={3}
                              className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-indigo-400 dark:border-indigo-500/50 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-sans leading-relaxed"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  // Revert to original AI suggested
                                  setEditedSuggestions(prev => {
                                    const next = { ...prev };
                                    delete next[suggestion.block_id];
                                    return next;
                                  });
                                  setEditingBlockId(null);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] dark:text-slate-300 font-medium cursor-pointer"
                              >
                                Revert
                              </button>
                              <button
                                onClick={() => setEditingBlockId(null)}
                                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] text-white font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-800 dark:text-emerald-100 font-medium leading-relaxed font-sans">
                            {currentText}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400">
                          {suggestion.explanation || 'Action verb + quantified business result'}
                        </span>
                        {editedSuggestions[suggestion.block_id] && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[9px] uppercase tracking-wider">
                            Custom Modified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Floating Bar */}
          <div className="sticky bottom-4 z-20 mt-4 glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500/30 shadow-2xl bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>{selectedBlockIds.size} Enhancements Selected</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">· +{estimatedScoreBoost}% ATS Boost</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ready to reflow RDOM geometry and compile pixel-perfect PDF bytes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {compiledPdfUrl && (
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  View Last PDF
                </button>
              )}
              <button
                onClick={handleCompileAndDownload}
                disabled={compiling || loading || selectedBlockIds.size === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  compiling || loading || selectedBlockIds.size === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-indigo-500/30 active:scale-95'
                }`}
              >
                {compiling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Compile & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Live PDF Preview Modal */}
      {showPreviewModal && compiledPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#0b1020]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">{compiledFilename}</h3>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Compiled Vector PDF
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={compiledPdfUrl}
                  download={compiledFilename}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </a>
                <a
                  href={compiledPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="flex-1 w-full bg-slate-900">
              <iframe
                src={compiledPdfUrl}
                title="Reconstructed PDF Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
