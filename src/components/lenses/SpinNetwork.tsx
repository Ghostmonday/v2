/**
 * Spin Network - "The Polarization View"
 * 
 * A spin glass visualization showing community polarization.
 * Detects "Civil War" in the community sentiment.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { SentimentReading } from '../../types/sentiment';
import { generateSpinNetwork } from '../../data/mockStream';

interface SpinNetworkProps {
  reading: SentimentReading;
  width?: number;
  height?: number;
}

interface NetworkNode {
  id: string;
  spin: number;
  coupling: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
}

export function SpinNetwork({ reading, width = 700, height = 500 }: SpinNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [network, setNetwork] = useState(() => generateSpinNetwork(60));
  const [susceptibility, setSusceptibility] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState(false);
  
  // Calculate network metrics
  const metrics = useMemo(() => {
    const bullishCount = network.nodes.filter(n => n.spin > 0).length;
    const bearishCount = network.nodes.length - bullishCount;
    const polarization = Math.abs(bullishCount - bearishCount) / network.nodes.length;
    const consensus = polarization > 0.7;
    const polarized = polarization < 0.3;
    
    // Susceptibility: how close to flipping
    const avgSpin = network.nodes.reduce((sum, n) => sum + n.spin, 0) / network.nodes.length;
    const variance = network.nodes.reduce((sum, n) => sum + (n.spin - avgSpin) ** 2, 0) / network.nodes.length;
    
    return {
      bullishCount,
      bearishCount,
      polarization,
      consensus,
      polarized,
      susceptibility: Math.min(1, variance * 2),
      avgSpin,
    };
  }, [network]);
  
  // Update susceptibility meter
  useEffect(() => {
    setSusceptibility(metrics.susceptibility);
  }, [metrics.susceptibility]);
  
  // Update spins based on reading
  useEffect(() => {
    // Influence nodes based on sentiment
    const influence = reading.score;
    const momentum = reading.momentum;
    
    setNetwork(prev => {
      const newNodes = prev.nodes.map(node => {
        // Nodes with higher coupling are more influenced
        const influenceFactor = node.coupling * 0.1;
        const randomNoise = (Math.random() - 0.5) * 0.2;
        
        // Calculate new spin tendency
        let newSpin = node.spin;
        newSpin += influence * influenceFactor + randomNoise + momentum * 0.05;
        
        // Snap to -1 or 1 with some hysteresis
        if (newSpin > 0.2) newSpin = 1;
        else if (newSpin < -0.2) newSpin = -1;
        else newSpin = node.spin; // Keep previous
        
        return { ...node, spin: newSpin };
      });
      
      return { ...prev, nodes: newNodes };
    });
    
    // Trigger phase transition animation for extreme regimes
    if (reading.regime === 'liquidation' && !phaseTransition) {
      setPhaseTransition(true);
      setTimeout(() => {
        // Snap all to one direction
        setNetwork(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => ({ ...n, spin: reading.score > 0 ? 1 : -1 })),
        }));
        setTimeout(() => setPhaseTransition(false), 500);
      }, 100);
    }
  }, [reading, phaseTransition]);
  
  // D3 force simulation
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const g = svg.append('g');
    
    // Create a copy of nodes and links for simulation
    const nodes: NetworkNode[] = network.nodes.map(n => ({ ...n }));
    const links: NetworkLink[] = network.links.map(l => ({ ...l }));
    
    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(40)
        .strength(d => (d as NetworkLink).strength * 0.3))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(15));
    
    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#2a3040')
      .attr('stroke-width', d => (d as NetworkLink).strength)
      .attr('stroke-opacity', 0.3);
    
    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as never);
    
    // Node circles
    node.append('circle')
      .attr('r', d => 6 + d.coupling * 4)
      .attr('fill', d => d.spin > 0 ? '#22c55e' : '#ef4444')
      .attr('stroke', d => d.spin > 0 ? '#4ade80' : '#f87171')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)');
    
    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x || 0)
        .attr('y1', d => (d.source as NetworkNode).y || 0)
        .attr('x2', d => (d.target as NetworkNode).x || 0)
        .attr('y2', d => (d.target as NetworkNode).y || 0);
      
      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    return () => {
      simulation.stop();
    };
  }, [network, width, height]);
  
  return (
    <div className="relative">
      {/* Phase transition flash */}
      {phaseTransition && (
        <div className="absolute inset-0 bg-white/30 animate-pulse z-10 rounded-lg" />
      )}
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="rounded-lg bg-lab-void"
      />
      
      {/* Network state indicator */}
      <div className="absolute top-4 left-4 bg-lab-slate/90 backdrop-blur-sm rounded-lg p-4 border border-lab-mercury/30">
        <div className="text-xs font-mono text-lab-silver mb-3">NETWORK STATE</div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sentiment-bullish" />
            <span className="text-sm font-mono text-lab-frost">{metrics.bullishCount}</span>
          </div>
          <div className="w-px h-4 bg-lab-mercury" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sentiment-fear" />
            <span className="text-sm font-mono text-lab-frost">{metrics.bearishCount}</span>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider text-center ${
          metrics.consensus 
            ? 'bg-regime-calm/20 text-regime-calm' 
            : metrics.polarized 
              ? 'bg-regime-volatile/20 text-regime-volatile'
              : 'bg-regime-trending/20 text-regime-trending'
        }`}>
          {metrics.consensus ? 'CONSENSUS' : metrics.polarized ? 'POLARIZED' : 'MIXED'}
        </div>
      </div>
      
      {/* Susceptibility meter */}
      <div className="absolute top-4 right-4 bg-lab-slate/90 backdrop-blur-sm rounded-lg p-4 border border-lab-mercury/30 w-48">
        <div className="text-xs font-mono text-lab-silver mb-2">SUSCEPTIBILITY</div>
        <div className="text-[10px] text-lab-silver/70 mb-3">Phase transition risk</div>
        
        <SusceptibilityMeter value={susceptibility} />
        
        {susceptibility > 0.7 && (
          <div className="mt-3 text-xs text-regime-liquidation animate-pulse text-center">
            ⚠ CRITICAL INSTABILITY
          </div>
        )}
      </div>
      
      {/* Average spin indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-lab-slate/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-lab-mercury/30">
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-lab-silver">AVG SPIN</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-16 h-2 rounded-full overflow-hidden bg-gradient-to-r from-sentiment-fear via-lab-mercury to-sentiment-bullish"
            >
              <div 
                className="w-1 h-full bg-white shadow-lg"
                style={{ 
                  marginLeft: `${(metrics.avgSpin + 1) / 2 * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
            <span 
              className="text-sm font-mono"
              style={{ color: metrics.avgSpin > 0 ? '#22c55e' : '#ef4444' }}
            >
              {metrics.avgSpin > 0 ? '+' : ''}{metrics.avgSpin.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SusceptibilityMeter({ value }: { value: number }) {
  const segments = 20;
  const activeSegments = Math.floor(value * segments);
  
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }, (_, i) => {
        const isActive = i < activeSegments;
        const intensity = i / segments;
        
        let color = '#22c55e'; // Green - safe
        if (intensity > 0.5) color = '#eab308'; // Yellow - warning
        if (intensity > 0.7) color = '#f97316'; // Orange - danger
        if (intensity > 0.85) color = '#ef4444'; // Red - critical
        
        return (
          <div
            key={i}
            className="flex-1 h-6 rounded-sm transition-all duration-150"
            style={{
              backgroundColor: isActive ? color : '#1e222d',
              boxShadow: isActive ? `0 0 8px ${color}50` : 'none',
              opacity: isActive ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

