import React, { useEffect, useRef, useState } from 'react';
import ForceGraph from 'force-graph';
import { useTranslation } from 'react-i18next';
import { Network, X, RefreshCw, ZoomIn, ZoomOut, Filter, Compass } from 'lucide-react';
import type { GraphData, GraphNode, Verse, Book } from '../../types/bible';

interface KnowledgeGraphProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVerse: Verse | null;
  currentBook: Book | null;
  studyTrans?: string;
  onJumpToPassage: (bookId: number, chapter: number, verse?: number) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  isOpen,
  onClose,
  selectedVerse,
  currentBook,
  studyTrans = 'KJV',
  onJumpToPassage
}) => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const [graphMode, setGraphMode] = useState<'focused' | 'macro'>('focused');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load graph data based on mode and selected verse
  const loadGraph = async () => {
    setIsLoading(true);
    try {
      if (graphMode === 'focused' && selectedVerse) {
        const data = await window.api.getKnowledgeGraphData({
          bookId: selectedVerse.book_id,
          chapter: selectedVerse.chapter,
          verse: selectedVerse.verse,
          translationId: studyTrans,
          lang: i18n.language
        });
        setGraphData(data);
      } else {
        const data = await window.api.getKnowledgeGraphData({
          translationId: studyTrans,
          lang: i18n.language
        });
        setGraphData(data);
      }
    } catch (e) {
      console.error('Failed to load graph data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGraph();
    }
  }, [isOpen, graphMode, selectedVerse?.book_id, selectedVerse?.chapter, selectedVerse?.verse, studyTrans, i18n.language]);

  // Initialize and update ForceGraph canvas
  useEffect(() => {
    if (!isOpen || !containerRef.current || graphData.nodes.length === 0) return;

    if (!graphInstanceRef.current) {
      const Graph = new ForceGraph(containerRef.current)
        .backgroundColor('#0f141c')
        .nodeId('id')
        .nodeLabel((node: any) => `${node.name} (${node.type})`)
        .nodeColor((node: any) => node.color || '#38bdf8')
        .nodeVal((node: any) => node.val || 5)
        .linkSource('source')
        .linkTarget('target')
        .linkColor(() => '#273447')
        .linkWidth(1.5)
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalParticleSpeed(0.005)
        .onNodeClick((node: any) => {
          setSelectedNode(node);
          if (node.passage) {
            onJumpToPassage(node.passage.book_id, node.passage.chapter, node.passage.verse);
          }
        });

      graphInstanceRef.current = Graph;
    }

    graphInstanceRef.current.graphData(graphData);
    graphInstanceRef.current.width(containerRef.current.clientWidth);
    graphInstanceRef.current.height(containerRef.current.clientHeight);
  }, [isOpen, graphData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (graphInstanceRef.current && containerRef.current) {
        graphInstanceRef.current.width(containerRef.current.clientWidth);
        graphInstanceRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Graph Toolbar Header */}
      <div className="h-14 bg-workstation-panel border-b border-workstation-border flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-workstation-accent/10 border border-workstation-accent/30 flex items-center justify-center">
            <Network className="w-4 h-4 text-workstation-accent" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t('graph.title')}
            </h2>
            <p className="text-[11px] text-workstation-muted">
              {graphMode === 'focused' && selectedVerse
                ? `Exploring connections around passage (v${selectedVerse.verse})`
                : 'Canonical Bible Structure & Major Themes'
              }
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-workstation-bg p-0.5 rounded-lg border border-workstation-border">
            <button
              onClick={() => setGraphMode('focused')}
              disabled={!selectedVerse}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                graphMode === 'focused'
                  ? 'bg-workstation-active text-workstation-accent'
                  : 'text-workstation-muted hover:text-white disabled:opacity-40'
              }`}
            >
              {t('graph.focus_verse')}
            </button>
            <button
              onClick={() => setGraphMode('macro')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                graphMode === 'macro'
                  ? 'bg-workstation-active text-workstation-accent'
                  : 'text-workstation-muted hover:text-white'
              }`}
            >
              {t('graph.macro_view')}
            </button>
          </div>

          <button
            onClick={loadGraph}
            className="p-1.5 rounded-lg bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white transition-colors"
            title="Refresh Physics Layout"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white transition-colors"
            title="Close Graph"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-workstation-bg">
        <div ref={containerRef} className="w-full h-full" />

        {/* Graph Legend Overlay */}
        <div className="absolute left-6 bottom-6 bg-workstation-panel/90 backdrop-blur-md border border-workstation-border rounded-xl p-3 text-xs space-y-1.5 shadow-xl select-none">
          <span className="text-[10px] font-bold text-workstation-muted uppercase tracking-wider block mb-1">
            Legend
          </span>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span>Target Verse</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-indigo-400" />
            <span>Cross-Reference (TSK)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Biblical Figure</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Theme / Doctrine</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span>Personal Study Note</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute right-6 bottom-6 max-w-sm bg-workstation-panel/95 backdrop-blur-md border border-workstation-border rounded-xl p-4 text-xs shadow-2xl select-text animate-in slide-in-from-right-4 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-workstation-bg border border-workstation-border text-workstation-accent">
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-workstation-muted hover:text-white"
              >
                ✕
              </button>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{selectedNode.name}</h4>
            {selectedNode.details && (
              <p className="text-slate-300 text-xs leading-relaxed italic scripture-serif">
                "{selectedNode.details}"
              </p>
            )}
            {selectedNode.passage && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    if (selectedNode.passage) {
                      onJumpToPassage(selectedNode.passage.book_id, selectedNode.passage.chapter, selectedNode.passage.verse);
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1 bg-workstation-accent hover:bg-sky-400 text-slate-950 font-semibold rounded-md text-[11px] transition-colors"
                >
                  Open in Reader →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
