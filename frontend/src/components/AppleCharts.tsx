import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

// BRM Provincial Design Color Tokens
const APPLE_COLORS = {
  blue: '#226380',
  navy: '#113240',
  emerald: '#34c759',
  amber: '#F2C894',
  indigo: '#5856d6',
  rose: '#ff2d55',
  teal: '#A3C3C7',
  gray: '#8e8e93',
};

// 1. Apple Smooth Spline Area Trend Chart
export interface TrendPoint {
  label: string;
  hospedagens: number;
  religiosos: number;
}

interface AppleTrendChartProps {
  data: TrendPoint[];
  title?: string;
  subtitle?: string;
}

export const AppleTrendChart: React.FC<AppleTrendChartProps> = ({
  data,
  title = "Movimentação Geral",
  subtitle = "Fluxo comparativo nos últimos períodos"
}) => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'hospedagens' | 'religiosos'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = data;

  const maxVal = Math.max(
    ...points.map(p => Math.max(p.hospedagens, p.religiosos)),
    5
  );

  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const divisor = Math.max(points.length - 1, 1);

  const getCoordinates = (value: number, index: number) => {
    const x = paddingX + (index / divisor) * chartWidth;
    const y = height - paddingY - (value / maxVal) * chartHeight;
    return { x, y };
  };

  const createSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    const coords = values.map((val, idx) => getCoordinates(val, idx));
    let path = `M ${coords[0].x} ${coords[0].y}`;

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const createAreaPath = (values: number[]) => {
    if (values.length === 0) return '';
    const linePath = createSmoothPath(values);
    const lastX = paddingX + chartWidth;
    const firstX = paddingX;
    const bottomY = height - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const hospValues = points.map(p => p.hospedagens);
  const religValues = points.map(p => p.religiosos);

  const totalHosp = hospValues.reduce((a, b) => a + b, 0);
  const totalRelig = religValues.reduce((a, b) => a + b, 0);

  return (
    <div className="apple-card p-6 md:p-8 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
      {/* Header with Canonical Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-cinzel">
              Estatísticas da Província
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              · Tempo Real
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-cinzel">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Canonical Rectangular Switcher */}
        <div className="inline-flex p-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22]">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors border ${
              activeMetric === 'all'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('hospedagens')}
            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 border ${
              activeMetric === 'hospedagens'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 bg-[#0071e3]" />
            Hospedagens ({totalHosp})
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('religiosos')}
            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 border ${
              activeMetric === 'religiosos'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 bg-[#34c759]" />
            Religiosos ({totalRelig})
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Gradient Hospedagens */}
            <linearGradient id="appleHospGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0071e3" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0071e3" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient Religiosos */}
            <linearGradient id="appleReligGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34c759" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34c759" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted Grid Horizontal Lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * chartHeight;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-[#e5e5ea] dark:text-white/10"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Hospedagens Area & Line */}
          {(activeMetric === 'all' || activeMetric === 'hospedagens') && (
            <>
              <path
                d={createAreaPath(hospValues)}
                fill="url(#appleHospGradient)"
                className="transition-all duration-300"
              />
              <path
                d={createSmoothPath(hospValues)}
                fill="none"
                stroke="#0071e3"
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </>
          )}

          {/* Religiosos Area & Line */}
          {(activeMetric === 'all' || activeMetric === 'religiosos') && (
            <>
              <path
                d={createAreaPath(religValues)}
                fill="url(#appleReligGradient)"
                className="transition-all duration-300"
              />
              <path
                d={createSmoothPath(religValues)}
                fill="none"
                stroke="#34c759"
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </>
          )}

          {/* Data Points and Interaction Circles */}
          {points.map((p, idx) => {
            const hospPt = getCoordinates(p.hospedagens, idx);
            const religPt = getCoordinates(p.religiosos, idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx}>
                {/* Vertical hover indicator */}
                {isHovered && (
                  <line
                    x1={hospPt.x}
                    y1={paddingY}
                    x2={hospPt.x}
                    y2={height - paddingY}
                    stroke="#8e8e93"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                )}

                {/* Hosp point */}
                {(activeMetric === 'all' || activeMetric === 'hospedagens') && (
                  <circle
                    cx={hospPt.x}
                    cy={hospPt.y}
                    r={isHovered ? 6 : 4}
                    fill="#0071e3"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer shadow-sm"
                  />
                )}

                {/* Relig point */}
                {(activeMetric === 'all' || activeMetric === 'religiosos') && (
                  <circle
                    cx={religPt.x}
                    cy={religPt.y}
                    r={isHovered ? 6 : 4}
                    fill="#34c759"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer shadow-sm"
                  />
                )}

                {/* Touch/Mouse Target Area */}
                <rect
                  x={hospPt.x - 25}
                  y={paddingY}
                  width="50"
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                />

                {/* X Axis Label */}
                <text
                  x={hospPt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-[#1d1d1f] dark:fill-white font-bold'
                      : 'fill-[#8e8e93] dark:fill-[#86868b]'
                  }`}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Float in Capsule */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none rounded-[6px] bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3.5 py-2 shadow-xl flex items-center gap-3 text-xs transition-all"
            style={{
              left: `${Math.min(
                Math.max((hoveredIndex / divisor) * 100, 15),
                85
              )}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-semibold text-[#113240] dark:text-white">
              {points[hoveredIndex].label}:
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#226380] font-medium">
                <span className="w-2 h-2 rounded-[2px] bg-[#226380]" />
                {points[hoveredIndex].hospedagens} hosp.
              </span>
              <span className="flex items-center gap-1 text-[#34c759] font-medium">
                <span className="w-2 h-2 rounded-[2px] bg-[#34c759]" />
                {points[hoveredIndex].religiosos} relig.
              </span>
            </div>
          </div>
        )}

        {totalHosp === 0 && totalRelig === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
            <span className="text-xs font-semibold text-[#707070] dark:text-[#86868b] bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-sm px-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 shadow-sm">
              Sem movimentações registradas neste período
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


// 2. Apple Activity Donut Chart (Segmented Ring with architectural center number)
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface AppleDonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  totalLabel?: string;
}

export const AppleDonutChart: React.FC<AppleDonutChartProps> = ({
  data,
  title = "Distribuição por Grau",
  subtitle = "Composição dos membros da Província",
  totalLabel = "Religiosos"
}) => {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="apple-card p-6 md:p-8 flex flex-col justify-between">
      <div className="mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#707070] dark:text-[#86868b]">
          Segmentação Canônica
        </span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mt-1">
          {title}
        </h2>
        <p className="text-xs text-[#707070] dark:text-[#86868b] mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-[#f5f5f7] dark:text-white/5"
            />

            {/* Segments */}
            {data.map((item, index) => {
              const percent = total > 0 ? item.value / total : 0;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHighlighted = activeSegment === index || activeSegment === null;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={activeSegment === index ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: isHighlighted ? 1 : 0.4,
                    filter: activeSegment === index ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none'
                  }}
                  onMouseEnter={() => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                />
              );
            })}
          </svg>

          {/* Architectural Center Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              {activeSegment !== null ? data[activeSegment].value : total}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] dark:text-[#86868b] mt-0.5">
              {activeSegment !== null ? data[activeSegment].label : totalLabel}
            </span>
          </div>
        </div>

        {/* Legend Pills with Percentages */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const isSelected = activeSegment === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveSegment(idx)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center justify-between p-2 rounded-[6px] transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-[#226380]/40 bg-[#226380]/10 dark:bg-white/10'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-inter">
                    {item.value}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 w-8 text-right font-mono">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// 3. Apple Capacity Ring & Bed Occupancy Gauge
interface AppleOccupancyGaugeProps {
  totalQuartos: number;
  quartosOcupados: number;
  totalHospedes: number;
}

export const AppleOccupancyGauge: React.FC<AppleOccupancyGaugeProps> = ({
  totalQuartos,
  quartosOcupados,
  totalHospedes,
}) => {
  const percent = totalQuartos > 0 ? Math.min(Math.round((quartosOcupados / totalQuartos) * 100), 100) : 0;
  const quartosLivres = Math.max(totalQuartos - quartosOcupados, 0);

  return (
    <div className="apple-card p-6 md:p-8 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-cinzel">
          Capacidade & Leitos
        </span>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-cinzel">
          Ocupação da Hospedaria
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Quartos ativos e índice de acolhida da casa
        </p>
      </div>

      <div className="my-6 space-y-4">
        {/* Big percentage & progress bar */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-inter">
              {percent}%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ocupação atual
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${
              percent > 80 ? 'bg-rose-500' : percent > 50 ? 'bg-[#F2C894]' : 'bg-[#113240] dark:bg-white'
            }`} />
            {percent > 80 ? 'Alta Demanda' : percent > 50 ? 'Moderado' : 'Vagas Disponíveis'}
          </span>
        </div>

        {/* Straight Architectural Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-[4px] overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className="h-full rounded-[3px] transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(percent, 4)}%`,
              backgroundColor: percent > 80 ? APPLE_COLORS.rose : percent > 50 ? APPLE_COLORS.amber : APPLE_COLORS.blue,
            }}
          />
        </div>

        {/* Detailed Metric Boxes - Rectangular & Clean */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-white/5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
              Ocupados
            </span>
            <span className="text-lg font-bold text-[#226380] mt-0.5 block font-inter">
              {quartosOcupados}
            </span>
          </div>

          <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-white/5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
              Vagos
            </span>
            <span className="text-lg font-bold text-[#34c759] mt-0.5 block font-inter">
              {quartosLivres}
            </span>
          </div>

          <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-white/5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
              Quartos
            </span>
            <span className="text-lg font-bold text-[#113240] dark:text-white mt-0.5 block font-inter">
              {totalQuartos}
            </span>
          </div>

          <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-white/5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
              Hóspedes
            </span>
            <span className="text-lg font-bold text-[#5856d6] mt-0.5 block font-inter">
              {totalHospedes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
