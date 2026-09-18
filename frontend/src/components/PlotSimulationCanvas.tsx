"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Compass, Sliders, Image as ImageIcon, RotateCcw, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PlotSimulationData {
  plotNorth: string;
  plotSouth: string;
  plotEast: string;
  plotWest: string;
  buildingEast: string;
  buildingWest: string;
  buildingNorth: string;
  buildingSouth: string;
  plotNo?: string;
  notes?: string;
}

interface PlotSimulationCanvasProps {
  initialData?: Partial<PlotSimulationData>;
  plotNo?: string;
  currentImage?: string;
  onImageChange: (dataUrl: string) => void;
  onDataChange: (data: PlotSimulationData) => void;
}

export default function PlotSimulationCanvas({
  initialData,
  plotNo = "",
  currentImage = "",
  onImageChange,
  onDataChange,
}: PlotSimulationCanvasProps) {
  // Mode: 'simulate' or 'upload'
  const [mode, setMode] = useState<"simulate" | "upload">(
    currentImage && !initialData?.plotNorth ? "upload" : "simulate"
  );
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Simulation Parameters
  const [simData, setSimData] = useState<PlotSimulationData>({
    plotNorth: initialData?.plotNorth || "50",
    plotSouth: initialData?.plotSouth || "50",
    plotEast: initialData?.plotEast || "40",
    plotWest: initialData?.plotWest || "40",
    buildingEast: initialData?.buildingEast || "20",
    buildingWest: initialData?.buildingWest || "10",
    buildingNorth: initialData?.buildingNorth || "10",
    buildingSouth: initialData?.buildingSouth || "10",
    plotNo: plotNo || initialData?.plotNo || "",
    notes: initialData?.notes || "",
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const patternId = useId();

  // Sync plotNo prop if changes
  useEffect(() => {
    if (plotNo && plotNo !== simData.plotNo) {
      setSimData((prev) => ({ ...prev, plotNo }));
    }
  }, [plotNo]);

  // Convert SVG to PNG Data URL to save into deal.plotImage
  const exportSvgToDataUrl = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        // High resolution for crisp PDF printing
        canvas.width = 1200;
        canvas.height = 900;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pngDataUrl = canvas.toDataURL("image/png");
          onImageChange(pngDataUrl);
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Failed to rasterize SVG diagram", err);
    }
  };

  // Trigger export whenever simData changes
  useEffect(() => {
    if (mode === "simulate") {
      onDataChange(simData);
      const timer = setTimeout(() => {
        exportSvgToDataUrl();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [simData, mode]);

  const handleInputChange = (field: keyof PlotSimulationData, value: string) => {
    setSimData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
        setMode("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // Numeric calculations
  const pNorth = Math.max(10, parseFloat(simData.plotNorth) || 50);
  const pSouth = Math.max(10, parseFloat(simData.plotSouth) || 50);
  const pEast = Math.max(10, parseFloat(simData.plotEast) || 40);
  const pWest = Math.max(10, parseFloat(simData.plotWest) || 40);

  const avgWidth = (pNorth + pSouth) / 2;
  const avgHeight = (pEast + pWest) / 2;

  const bEast = Math.max(0, parseFloat(simData.buildingEast) || 0);
  const bWest = Math.max(0, parseFloat(simData.buildingWest) || 0);
  const bNorth = Math.max(0, parseFloat(simData.buildingNorth) || 0);
  const bSouth = Math.max(0, parseFloat(simData.buildingSouth) || 0);

  // Computed building size
  const bWidth = Math.max(0, avgWidth - (bEast + bWest));
  const bHeight = Math.max(0, avgHeight - (bNorth + bSouth));

  // Canvas bounds (SVG viewBox 0 0 600 450)
  const viewWidth = 600;
  const viewHeight = 450;
  const marginX = 85;
  const marginY = 70;
  const plotBoxW = viewWidth - marginX * 2;
  const plotBoxH = viewHeight - marginY * 2;

  const plotX = marginX;
  const plotY = marginY;

  // Scale building inside plot
  const scaleX = avgWidth > 0 ? plotBoxW / avgWidth : 1;
  const scaleY = avgHeight > 0 ? plotBoxH / avgHeight : 1;

  const buildingX = plotX + bWest * scaleX;
  const buildingY = plotY + bNorth * scaleY;
  const buildingRenderW = Math.max(20, Math.min(plotBoxW - (bWest + bEast) * scaleX, bWidth * scaleX));
  const buildingRenderH = Math.max(20, Math.min(plotBoxH - (bNorth + bSouth) * scaleY, bHeight * scaleY));

  return (
    <div className="w-full flex flex-col items-center">
      {/* Interactive Controls Header - Hidden on Print */}
      <div className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 border-b border-gray-200 text-xs print:hidden">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <Compass size={14} className="text-accent" />
          <span>2D Site Plan Simulation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsConfiguring(!isConfiguring)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
              isConfiguring
                ? "bg-ink text-surface border-ink"
                : "bg-white text-ink border-border hover:bg-gray-100"
            }`}
          >
            <Sliders size={12} />
            {isConfiguring ? "Done Editing" : "Configure Setbacks"}
          </button>
          <label className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-ink-soft border border-border hover:bg-gray-100 cursor-pointer">
            <ImageIcon size={12} />
            Upload File
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Configuration Drawer / Form (Interactive) - Hidden on Print */}
      {isConfiguring && (
        <div className="w-full bg-amber-500/5 border-b border-amber-500/20 p-3 text-xs print:hidden space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Plot Dimensions */}
            <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs space-y-2">
              <div className="font-semibold text-gray-900 flex items-center justify-between border-b pb-1">
                <span>Plot Lengths (ft)</span>
                <span className="text-[10px] text-gray-500 font-normal">4 Directions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">North (N)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.plotNorth}
                    onChange={(e) => handleInputChange("plotNorth", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">South (S)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.plotSouth}
                    onChange={(e) => handleInputChange("plotSouth", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">East (E)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.plotEast}
                    onChange={(e) => handleInputChange("plotEast", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">West (W)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.plotWest}
                    onChange={(e) => handleInputChange("plotWest", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Building Setback Distances */}
            <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs space-y-2">
              <div className="font-semibold text-gray-900 flex items-center justify-between border-b pb-1">
                <span>Building Distance (ft)</span>
                <span className="text-[10px] text-gray-500 font-normal">Setbacks from 4 Sides</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">From East (E)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.buildingEast}
                    onChange={(e) => handleInputChange("buildingEast", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">From West (W)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.buildingWest}
                    onChange={(e) => handleInputChange("buildingWest", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">From North (N)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.buildingNorth}
                    onChange={(e) => handleInputChange("buildingNorth", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block font-medium">From South (S)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs outline-none focus:border-accent"
                    value={simData.buildingSouth}
                    onChange={(e) => handleInputChange("buildingSouth", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-gray-600 font-mono">
              Calculated Building Footprint: <span className="font-bold text-gray-900">{bWidth.toFixed(1)}&apos; x {bHeight.toFixed(1)}&apos;</span> ({Math.round(bWidth * bHeight)} sq.ft)
            </div>
            <button
              type="button"
              onClick={() => setIsConfiguring(false)}
              className="px-3 py-1 bg-accent text-white rounded text-xs font-semibold hover:bg-accent/90 flex items-center gap-1"
            >
              <Check size={12} /> Apply Simulation
            </button>
          </div>
        </div>
      )}

      {/* Main Display Area (Shown on screen and printed on PDF) */}
      <div className="w-full flex items-center justify-center p-2 relative bg-white min-h-[260px]">
        {mode === "upload" && currentImage && !isConfiguring ? (
          <div className="relative group max-w-full flex items-center justify-center">
            <img src={currentImage} alt="Uploaded Diagram" className="max-h-[280px] object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setMode("simulate")}
                className="px-2.5 py-1 bg-white text-ink text-xs font-semibold rounded shadow hover:bg-gray-100"
              >
                Switch to 2D Simulator
              </button>
              <label className="px-2.5 py-1 bg-white text-ink text-xs font-semibold rounded shadow hover:bg-gray-100 cursor-pointer">
                Replace File
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          /* SVG Architectural Simulation Diagram */
          <div className="w-full max-w-[420px] aspect-[4/3] relative flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              className="w-full h-full select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              <defs>
                {/* Diagonal hatch pattern for building */}
                <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
                </pattern>
                {/* Arrow markers */}
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#1e293b" />
                </marker>
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0284c7" />
                </marker>
              </defs>

              {/* Background Grid */}
              <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#fcfcfc" />
              <rect x="15" y="15" width={viewWidth - 30} height={viewHeight - 30} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

              {/* Architectural Corner Compass Rose (Top-Right Corner) */}
              <g transform="translate(535, 60)">
                {/* Compass ring */}
                <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="25" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                
                {/* Cardinal cross lines */}
                <line x1="0" y1="-22" x2="0" y2="22" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="-22" y1="0" x2="22" y2="0" stroke="#cbd5e1" strokeWidth="1" />

                {/* North Needle */}
                <polygon points="0,-22 4,-5 0,0" fill="#dc2626" />
                <polygon points="0,-22 -4,-5 0,0" fill="#ef4444" />
                
                {/* South Needle */}
                <polygon points="0,22 4,5 0,0" fill="#334155" />
                <polygon points="0,22 -4,5 0,0" fill="#64748b" />

                {/* East / West pointers */}
                <polygon points="22,0 5,3 0,0" fill="#64748b" />
                <polygon points="-22,0 -5,3 0,0" fill="#64748b" />

                <circle cx="0" cy="0" r="2.5" fill="#0f172a" />

                {/* Compass Labels */}
                <text x="0" y="-32" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#dc2626">N</text>
                <text x="0" y="38" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">S</text>
                <text x="35" y="3.5" textAnchor="start" fontSize="10" fontWeight="bold" fill="#334155">E</text>
                <text x="-35" y="3.5" textAnchor="end" fontSize="10" fontWeight="bold" fill="#334155">W</text>
              </g>

              {/* Title & Plot Badge */}
              <g transform="translate(30, 42)">
                <text x="0" y="0" fontSize="12" fontWeight="bold" fill="#0f172a" letterSpacing="1">
                  SITE PLAN DIAGRAM
                </text>
                {simData.plotNo && (
                  <text x="0" y="16" fontSize="11" fontWeight="600" fill="#64748b">
                    PLOT NO: {simData.plotNo}
                  </text>
                )}
              </g>

              {/* Outer Plot Boundary */}
              <rect
                x={plotX}
                y={plotY}
                width={plotBoxW}
                height={plotBoxH}
                fill="#f8fafc"
                stroke="#0f172a"
                strokeWidth="2.5"
              />

              {/* Dimension Labels on Plot Boundary */}
              {/* NORTH (Top) */}
              <line x1={plotX} y1={plotY - 14} x2={plotX + plotBoxW} y2={plotY - 14} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <rect x={plotX + plotBoxW / 2 - 45} y={plotY - 24} width="90" height="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="3" />
              <text x={plotX + plotBoxW / 2} y={plotY - 11} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                N: {simData.plotNorth} ft
              </text>

              {/* SOUTH (Bottom) */}
              <line x1={plotX} y1={plotY + plotBoxH + 14} x2={plotX + plotBoxW} y2={plotY + plotBoxH + 14} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <rect x={plotX + plotBoxW / 2 - 45} y={plotY + plotBoxH + 5} width="90" height="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="3" />
              <text x={plotX + plotBoxW / 2} y={plotY + plotBoxH + 18} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                S: {simData.plotSouth} ft
              </text>

              {/* WEST (Left) */}
              <line x1={plotX - 14} y1={plotY} x2={plotX - 14} y2={plotY + plotBoxH} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <g transform={`translate(${plotX - 22}, ${plotY + plotBoxH / 2}) rotate(-90)`}>
                <rect x="-45" y="-9" width="90" height="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="3" />
                <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                  W: {simData.plotWest} ft
                </text>
              </g>

              {/* EAST (Right) */}
              <line x1={plotX + plotBoxW + 14} y1={plotY} x2={plotX + plotBoxW + 14} y2={plotY + plotBoxH} stroke="#0f172a" strokeWidth="1.2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <g transform={`translate(${plotX + plotBoxW + 22}, ${plotY + plotBoxH / 2}) rotate(90)`}>
                <rect x="-45" y="-9" width="90" height="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="3" />
                <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                  E: {simData.plotEast} ft
                </text>
              </g>

              {/* Proposed Building Structure */}
              <rect
                x={buildingX}
                y={buildingY}
                width={buildingRenderW}
                height={buildingRenderH}
                fill={`url(#${patternId})`}
                stroke="#1e293b"
                strokeWidth="2"
              />

              {/* Building Title & Size Badge inside building */}
              <rect
                x={buildingX + buildingRenderW / 2 - 60}
                y={buildingY + buildingRenderH / 2 - 16}
                width="120"
                height="32"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="1"
                rx="4"
              />
              <text
                x={buildingX + buildingRenderW / 2}
                y={buildingY + buildingRenderH / 2 - 2}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#0f172a"
              >
                PROPOSED BUILDING
              </text>
              <text
                x={buildingX + buildingRenderW / 2}
                y={buildingY + buildingRenderH / 2 + 10}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#475569"
              >
                {bWidth.toFixed(0)}&apos; x {bHeight.toFixed(0)}&apos;
              </text>

              {/* SETBACK ARROWS & CALLOUTS */}
              {/* East Setback line (Right side clearance) */}
              {bEast > 0 && (
                <g>
                  <line
                    x1={buildingX + buildingRenderW}
                    y1={buildingY + buildingRenderH / 2}
                    x2={plotX + plotBoxW}
                    y2={buildingY + buildingRenderH / 2}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    markerStart="url(#arrow-blue)"
                    markerEnd="url(#arrow-blue)"
                  />
                  <rect
                    x={(buildingX + buildingRenderW + plotX + plotBoxW) / 2 - 28}
                    y={buildingY + buildingRenderH / 2 - 18}
                    width="56"
                    height="14"
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={(buildingX + buildingRenderW + plotX + plotBoxW) / 2}
                    y={buildingY + buildingRenderH / 2 - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#0369a1"
                  >
                    E: {simData.buildingEast} ft
                  </text>
                </g>
              )}

              {/* West Setback line (Left side clearance) */}
              {bWest > 0 && (
                <g>
                  <line
                    x1={plotX}
                    y1={buildingY + buildingRenderH / 2}
                    x2={buildingX}
                    y2={buildingY + buildingRenderH / 2}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    markerStart="url(#arrow-blue)"
                    markerEnd="url(#arrow-blue)"
                  />
                  <rect
                    x={(plotX + buildingX) / 2 - 28}
                    y={buildingY + buildingRenderH / 2 - 18}
                    width="56"
                    height="14"
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={(plotX + buildingX) / 2}
                    y={buildingY + buildingRenderH / 2 - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#0369a1"
                  >
                    W: {simData.buildingWest} ft
                  </text>
                </g>
              )}

              {/* North Setback line (Top side clearance) */}
              {bNorth > 0 && (
                <g>
                  <line
                    x1={buildingX + buildingRenderW / 2}
                    y1={plotY}
                    x2={buildingX + buildingRenderW / 2}
                    y2={buildingY}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    markerStart="url(#arrow-blue)"
                    markerEnd="url(#arrow-blue)"
                  />
                  <rect
                    x={buildingX + buildingRenderW / 2 - 28}
                    y={(plotY + buildingY) / 2 - 7}
                    width="56"
                    height="14"
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={buildingX + buildingRenderW / 2}
                    y={(plotY + buildingY) / 2 + 4}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#0369a1"
                  >
                    N: {simData.buildingNorth} ft
                  </text>
                </g>
              )}

              {/* South Setback line (Bottom side clearance) */}
              {bSouth > 0 && (
                <g>
                  <line
                    x1={buildingX + buildingRenderW / 2}
                    y1={buildingY + buildingRenderH}
                    x2={buildingX + buildingRenderW / 2}
                    y2={plotY + plotBoxH}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    markerStart="url(#arrow-blue)"
                    markerEnd="url(#arrow-blue)"
                  />
                  <rect
                    x={buildingX + buildingRenderW / 2 - 28}
                    y={(buildingY + buildingRenderH + plotY + plotBoxH) / 2 - 7}
                    width="56"
                    height="14"
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={buildingX + buildingRenderW / 2}
                    y={(buildingY + buildingRenderH + plotY + plotBoxH) / 2 + 4}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#0369a1"
                  >
                    S: {simData.buildingSouth} ft
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
