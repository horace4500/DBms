import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { DiagramData, ERNode, NodeType, ERLink } from '../types';

interface ERCanvasProps {
  data: DiagramData;
  onNodeDragEnd: (id: string, x: number, y: number) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onNodeClick: (id: string) => void;
  linkingMode: boolean;
  linkingSourceId: string | null;
  studentId?: string;
}

const ERCanvas: React.FC<ERCanvasProps> = ({ 
  data, 
  onNodeDragEnd, 
  onSelectionChange,
  onNodeClick,
  linkingMode,
  linkingSourceId,
  studentId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // Handle Selection
  const handleNodeClick = useCallback((id: string, event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault(); // Prevent default browser behavior
    
    // Always notify parent of click
    onNodeClick(id);

    // If in linking mode, do NOT change selection state
    if (linkingMode) return;
    
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      // Support Shift, Ctrl, and Meta (Cmd) keys for multi-selection
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
      } else {
        newSet.clear();
        newSet.add(id);
      }
      return newSet;
    });
  }, [onNodeClick, linkingMode]);

  const handleBgClick = useCallback(() => {
    if (linkingMode) return; // Don't clear selection if linking
    setSelectedNodes(new Set());
  }, [linkingMode]);

  // Sync selection state back to parent
  useEffect(() => {
    onSelectionChange(Array.from(selectedNodes));
  }, [selectedNodes, onSelectionChange]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .on('click', handleBgClick);

    // Define Arrow markers
    let defs = svg.select('defs');
    if (defs.empty()) {
        defs = svg.append('defs');
    }
    
    // Clear existing markers to prevent duplicates on re-render
    defs.selectAll('marker').remove();

    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25) // Adjust based on node size
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Clear previous renders
    svg.selectAll('g.content').remove();

    // Create a group for zoom/pan (optional, but good practice)
    const g = svg.append('g').attr('class', 'content');

    // --- Links ---
    const links = g.selectAll('.link')
      .data(data.links)
      .enter()
      .append('g')
      .attr('class', 'link');

    links.append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2);

    links.append('text')
      .text(d => d.label || '')
      .attr('fill', '#475569')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // --- Nodes ---
    const nodes = g.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', linkingMode ? 'crosshair' : 'pointer')
      .call(d3.drag<SVGGElement, ERNode>()
        .on('start', function() {
          if (linkingMode) return; // Disable drag in linking mode
          d3.select(this).raise().classed('active', true);
        })
        .on('drag', function(event, d) {
          if (linkingMode) return;
          d.x = event.x;
          d.y = event.y;
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
          updateLinks();
        })
        .on('end', function(event, d) {
          if (linkingMode) return;
          d3.select(this).classed('active', false);
          onNodeDragEnd(d.id, d.x, d.y);
        })
      )
      .on('click', (event, d) => handleNodeClick(d.id, event));

    // Render Shapes based on Type
    nodes.each(function(d) {
      const node = d3.select(this);
      const isSelected = selectedNodes.has(d.id);
      const isLinkingSource = d.id === linkingSourceId;
      
      let strokeColor = '#64748b';
      let strokeWidth = 2;
      let shadowFilter = 'none';

      if (isLinkingSource) {
          strokeColor = '#f59e0b'; // Amber-500
          strokeWidth = 3;
          shadowFilter = 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))';
      } else if (isSelected) {
          strokeColor = '#2563eb'; // Blue-600
          strokeWidth = 3;
          shadowFilter = 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))';
      }

      node.style('filter', shadowFilter);

      if (d.type === NodeType.ENTITY) {
        // Rectangle
        node.append('rect')
          .attr('x', -50)
          .attr('y', -25)
          .attr('width', 100)
          .attr('height', 50)
          .attr('rx', 4)
          .attr('fill', '#eff6ff')
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', isLinkingSource ? '5,5' : 'none');
      } else if (d.type === NodeType.ATTRIBUTE) {
        // Ellipse
        node.append('ellipse')
          .attr('rx', 50)
          .attr('ry', 25)
          .attr('fill', '#f0fdf4') // Light Green
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', isLinkingSource ? '5,5' : 'none');
      } else if (d.type === NodeType.RELATIONSHIP) {
        // Diamond (Polygon)
        node.append('polygon')
          .attr('points', '0,-35 50,0 0,35 -50,0')
          .attr('fill', '#fffbeb') // Light Yellow
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', isLinkingSource ? '5,5' : 'none');
      }

      // Label
      node.append('text')
        .text(d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .attr('font-size', '14px')
        .attr('pointer-events', 'none')
        .style('user-select', 'none');
    });

    // Render Student ID Watermark if exists
    if (studentId) {
        g.append('text')
            .attr('x', width - 20)
            .attr('y', height - 20)
            .attr('text-anchor', 'end')
            .attr('fill', '#94a3b8')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text(`学号: ${studentId}`)
            .style('pointer-events', 'none')
            .style('user-select', 'none');
    }

    // Function to update link positions
    function updateLinks() {
      links.select('line')
        .attr('x1', d => {
            const source = data.nodes.find(n => n.id === d.source);
            return source ? source.x : 0;
        })
        .attr('y1', d => {
            const source = data.nodes.find(n => n.id === d.source);
            return source ? source.y : 0;
        })
        .attr('x2', d => {
            const target = data.nodes.find(n => n.id === d.target);
            return target ? target.x : 0;
        })
        .attr('y2', d => {
            const target = data.nodes.find(n => n.id === d.target);
            return target ? target.y : 0;
        });

        links.select('text')
        .attr('x', d => {
            const s = data.nodes.find(n => n.id === d.source);
            const t = data.nodes.find(n => n.id === d.target);
            return s && t ? (s.x + t.x) / 2 : 0;
        })
        .attr('y', d => {
            const s = data.nodes.find(n => n.id === d.source);
            const t = data.nodes.find(n => n.id === d.target);
            return s && t ? (s.y + t.y) / 2 : 0;
        });
    }

    // Initial positioning
    updateLinks();

  }, [data, selectedNodes, linkingMode, linkingSourceId, handleNodeClick, handleBgClick, onNodeDragEnd, studentId]);


  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-slate-200 shadow-inner select-none ${linkingMode ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={(e) => {
            if (e.target === containerRef.current || e.target === svgRef.current) {
                e.preventDefault();
            }
        }}
    >
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
                 backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
             }}>
        </div>
      <svg ref={svgRef} id="er-main-svg" className="w-full h-full block"></svg>
    </div>
  );
};

export default ERCanvas;